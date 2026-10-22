/**
 * 데이터 접근 계층. UI는 이 파일의 함수만 호출하고 Supabase를 직접 부르지 않는다.
 * 채점·SRS·하루 상한 같은 규칙은 서버 RPC가 처리하고, 여기서는 호출과 형태 변환만 한다.
 */
import { FunctionsFetchError, FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { requestCardPayment } from "@/lib/toss";
import { todayKST } from "@/lib/date";
import type { LearnedWord, Pos, Profile, StudyMode, Word } from "@/types";

// ---------- 공통 ----------
const WORD_COLUMNS = "id,headword,pos,meaning_ko,example_en,example_ko,tier,freq_rank";
const AUTH_REDIRECT_KEY = "dr-auth-redirect";

/** 화면의 학습 모드 → DB study_events.mode */
const DB_MODE: Record<StudyMode, string> = { learn: "learn", review: "review", wrong: "wrong_note" };

interface WordRow {
  id: string;
  headword: string;
  pos: string;
  meaning_ko: string;
  example_en: string;
  example_ko: string;
  tier: number;
  freq_rank: number;
}
interface ProfileRow {
  id: string;
  name: string;
  target_score: number | null;
  start_tier: number | null;
  daily_goal: number | null;
  onboarded_at: string | null;
  pro_until?: string | null;
}

const toWord = (r: WordRow): Word => ({
  id: r.id,
  headword: r.headword,
  pos: r.pos as Pos,
  meaningKo: r.meaning_ko,
  exampleEn: r.example_en,
  exampleKo: r.example_ko,
  tier: r.tier,
  freqRank: r.freq_rank,
});

const toProfile = (r: ProfileRow, email: string): Profile => ({
  userId: r.id,
  name: r.name,
  email,
  targetScore: r.target_score,
  dailyGoal: r.daily_goal,
  startTier: r.start_tier,
  onboarded: r.onboarded_at !== null,
  proUntil: r.pro_until ?? null,
});

/** Supabase Auth 오류 코드 → 화면 문구 */
const AUTH_MESSAGES: Record<string, string> = {
  invalid_credentials: "이메일 또는 비밀번호가 올바르지 않아요.",
  user_already_exists: "이미 가입된 이메일이에요.",
  email_exists: "이미 가입된 이메일이에요.",
  email_not_confirmed: "이메일 인증을 완료한 뒤 로그인해 주세요.",
  weak_password: "비밀번호가 너무 약해요. 더 길고 복잡하게 만들어 주세요.",
  over_email_send_rate_limit: "인증 메일 요청이 많아요. 잠시 후 다시 시도해 주세요.",
  over_request_rate_limit: "요청이 많아요. 잠시 후 다시 시도해 주세요.",
};

/**
 * Supabase 오류를 화면에 보여줄 Error로 바꾼다.
 * RPC가 낸 오류(P0001 등)는 서버의 한국어 메시지를 그대로 쓴다.
 */
function toError(e: { message: string; code?: string | undefined }): Error {
  if (e.code && AUTH_MESSAGES[e.code]) return new Error(AUTH_MESSAGES[e.code]);
  if (e.code && /^(P0001|P0002|22023|28000)$/.test(e.code)) return new Error(e.message);
  if (/fetch|network/i.test(e.message)) return new Error("네트워크 연결을 확인하고 다시 시도해 주세요.");
  return new Error("문제가 발생했어요. 다시 시도해 주세요.");
}

async function requireUser() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw toError(error);
  if (!data.session) throw new Error("로그인이 필요해요.");
  return data.session.user;
}

const callbackUrl = () => `${window.location.origin}/auth/callback`;

// ---------- 인증 ----------
/** 가입 후 바로 로그인되면 프로필을, 이메일 인증이 필요하면 null을 반환한다. */
export async function signUp(name: string, email: string, password: string): Promise<Profile | null> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: { data: { name: name.trim() }, emailRedirectTo: callbackUrl() },
  });
  if (error) throw toError(error);
  // 이메일 인증을 켠 상태에서 이미 가입된 이메일이면 오류 대신 identities가 빈 사용자가 온다
  if (data.user && data.user.identities?.length === 0) throw new Error(AUTH_MESSAGES["user_already_exists"]);
  if (!data.session) return null;
  const profile = await getProfile();
  if (!profile) throw new Error("프로필을 만들지 못했어요. 다시 시도해 주세요.");
  return profile;
}

export async function signIn(email: string, password: string): Promise<Profile> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error) throw toError(error);
  const profile = await getProfile();
  if (!profile) throw new Error("프로필을 찾을 수 없어요. 다시 시도해 주세요.");
  return profile;
}

/** Google 로그인 화면으로 이동한다. 돌아온 뒤 갈 경로는 sessionStorage에 잠시 보관한다. */
export async function signInWithGoogle(redirect?: string): Promise<void> {
  if (redirect) sessionStorage.setItem(AUTH_REDIRECT_KEY, redirect);
  else sessionStorage.removeItem(AUTH_REDIRECT_KEY);
  const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: callbackUrl() } });
  if (error) throw toError(error);
}

/**
 * Supabase가 인증 실패 시 URL에 붙이는 error·error_code를 화면 문구로 바꾼다.
 * 예: 뒤로가기로 이미 끝난 Google 로그인 창에서 계정을 고르면 bad_oauth_state가 온다.
 */
export function authErrorMessage(error: string, errorCode?: string | null): string {
  if (errorCode && ["bad_oauth_state", "flow_state_expired", "flow_state_not_found", "otp_expired"].includes(errorCode)) {
    return "로그인 요청이 만료되었어요. 다시 로그인해 주세요.";
  }
  if (error === "access_denied") return "로그인이 취소되었어요.";
  return "로그인에 실패했어요. 다시 시도해 주세요.";
}

/**
 * /auth/callback에서 호출한다. URL의 code는 Supabase 클라이언트가 세션으로 바꿔 두므로
 * 여기서는 결과를 확인하고, 프로필과 돌아갈 경로를 반환한다.
 */
export async function completeAuthCallback(): Promise<{ profile: Profile; redirect: string | undefined }> {
  const params = new URLSearchParams(window.location.search + window.location.hash.replace(/^#/, "&"));
  const urlError = params.get("error");
  if (urlError) throw new Error(authErrorMessage(urlError, params.get("error_code")));
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) throw new Error("인증 링크가 만료되었거나 이미 사용되었어요. 다시 로그인해 주세요.");
  const profile = await getProfile();
  if (!profile) throw new Error("프로필을 찾을 수 없어요. 다시 시도해 주세요.");
  const saved = sessionStorage.getItem(AUTH_REDIRECT_KEY);
  sessionStorage.removeItem(AUTH_REDIRECT_KEY);
  return { profile, redirect: saved?.startsWith("/") ? saved : undefined };
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw toError(error);
}

export async function getSession(): Promise<{ userId: string } | null> {
  const { data } = await supabase.auth.getSession();
  return data.session ? { userId: data.session.user.id } : null;
}

export async function getProfile(): Promise<Profile | null> {
  const { data: s } = await supabase.auth.getSession();
  if (!s.session) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id,name,target_score,start_tier,daily_goal,onboarded_at,pro_until")
    .eq("id", s.session.user.id)
    .maybeSingle<ProfileRow>();
  if (error) throw toError(error);
  return data ? toProfile(data, s.session.user.email ?? "") : null;
}

export async function saveOnboarding(targetScore: number, dailyGoal: number): Promise<Profile> {
  const user = await requireUser();
  const { data, error } = await supabase
    .rpc("save_onboarding", { p_target_score: targetScore, p_daily_goal: dailyGoal })
    .single<ProfileRow>();
  if (error) throw toError(error);
  return toProfile(data, user.email ?? "");
}

// ---------- 학습 ----------
/** 오늘의 학습 단어. 개수·정렬·하루 상한은 서버(get_today_words)가 정한다. */
export async function getTodayWords(opts: { extra?: boolean | undefined } = {}): Promise<Word[]> {
  const { data, error } = await supabase.rpc("get_today_words", { p_extra: !!opts.extra });
  if (error) throw toError(error);
  return (data as WordRow[]).map(toWord);
}

/** id 목록 순서대로 단어를 돌려준다. */
export async function getWordsByIds(ids: string[]): Promise<Word[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("words").select(WORD_COLUMNS).in("id", ids);
  if (error) throw toError(error);
  const byId = new Map((data as WordRow[]).map((r) => [r.id, toWord(r)]));
  return ids.map((id) => byId.get(id)).filter((w): w is Word => !!w);
}

/** 오늘(KST) 처음 학습한 단어. 홈의 "오늘 학습한 단어" 목록과 단어 퀴즈에 쓴다. 오늘 학습량과 같이 현재 목표 점수로 학습한 단어만 센다. */
export async function getTodayLearnedWords(): Promise<Word[]> {
  const user = await requireUser();
  const { data: profile, error: profileError } = await supabase.from("profiles").select("target_score").eq("id", user.id).single();
  if (profileError) throw toError(profileError);
  if (profile.target_score == null) return [];
  const { data, error } = await supabase
    .from("user_word_progress")
    .select(`first_studied_at, words(${WORD_COLUMNS})`)
    .eq("user_id", user.id)
    .eq("first_studied_date", todayKST())
    .eq("target_score", profile.target_score)
    .order("first_studied_at");
  if (error) throw toError(error);
  return (data as unknown as { words: WordRow }[]).map((r) => toWord(r.words));
}

interface LearnedRow {
  first_studied_date: string;
  status: "learning" | "mastered";
  box: number;
  next_review_at: string;
  wrong_count: number;
  correct_streak: number;
  words: WordRow;
}

/**
 * 지금까지 학습한 모든 단어(목표 점수와 무관, 최근 학습순). 단어장 화면의 검색·정렬·필터는 이 목록으로 화면에서 처리한다.
 * PostgREST는 한 번에 최대 1000행이라, 그보다 많아져도 모두 가져오도록 나눠서 읽는다.
 */
export async function getLearnedWords(): Promise<LearnedWord[]> {
  const user = await requireUser();
  const PAGE = 1000;
  const rows: LearnedRow[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("user_word_progress")
      .select(`first_studied_date, status, box, next_review_at, wrong_count, correct_streak, words(${WORD_COLUMNS})`)
      .eq("user_id", user.id)
      .order("first_studied_at", { ascending: false })
      .order("word_id")
      .range(from, from + PAGE - 1);
    if (error) throw toError(error);
    rows.push(...(data as unknown as LearnedRow[]));
    if (data.length < PAGE) break;
  }
  return rows.map((r) => ({
    ...toWord(r.words),
    firstStudiedDate: r.first_studied_date,
    status: r.status,
    box: r.box,
    nextReviewAt: r.next_review_at,
    wrongCount: r.wrong_count,
    correctStreak: r.correct_streak,
  }));
}

export async function recordFlashcard(wordId: string, known: boolean, mode: StudyMode): Promise<void> {
  const { error } = await supabase.rpc("record_flashcard", { p_word_id: wordId, p_known: known, p_mode: DB_MODE[mode] });
  if (error) throw toError(error);
}

/** 퀴즈 보기. 서버는 정답 표시 없이 id와 뜻만 섞어서 준다. */
export interface QuizChoice { id: string; meaningKo: string }
export async function getQuizChoices(wordId: string): Promise<QuizChoice[]> {
  const { data, error } = await supabase.rpc("get_quiz_choices", { p_word_id: wordId });
  if (error) throw toError(error);
  return (data as { id: string; meaning_ko: string }[]).map((c) => ({ id: c.id, meaningKo: c.meaning_ko }));
}

/** 서버에서 채점하고 SRS를 갱신한다. */
export async function recordQuizAnswer(wordId: string, choiceWordId: string, mode: StudyMode): Promise<{ isCorrect: boolean }> {
  const { data, error } = await supabase.rpc("record_quiz_answer", {
    p_word_id: wordId,
    p_choice_word_id: choiceWordId,
    p_mode: DB_MODE[mode],
  });
  if (error) throw toError(error);
  return { isCorrect: data === true };
}

/** 오늘 복습할 단어: next_review_at이 오늘 이전이거나 같은 단어(mastered 포함). */
export async function getReviewWords(): Promise<Word[]> {
  const user = await requireUser();
  const { data, error } = await supabase
    .from("user_word_progress")
    .select(`next_review_at, words(${WORD_COLUMNS})`)
    .eq("user_id", user.id)
    .lte("next_review_at", todayKST())
    .order("next_review_at");
  if (error) throw toError(error);
  return (data as unknown as { words: WordRow }[]).map((r) => toWord(r.words));
}

export interface WrongNote { word: Word; wrongCount: number; lastWrongAt: string | null }
/** 오답노트: 틀린 적이 있고 연속 정답이 2회 미만인 단어, 최근 오답 순. */
export async function getWrongNotes(): Promise<WrongNote[]> {
  const user = await requireUser();
  const { data, error } = await supabase
    .from("user_word_progress")
    .select(`wrong_count, last_wrong_at, words(${WORD_COLUMNS})`)
    .eq("user_id", user.id)
    .gt("wrong_count", 0)
    .lt("correct_streak", 2)
    .order("last_wrong_at", { ascending: false, nullsFirst: false });
  if (error) throw toError(error);
  return (data as unknown as { wrong_count: number; last_wrong_at: string | null; words: WordRow }[]).map((r) => ({
    word: toWord(r.words),
    wrongCount: r.wrong_count,
    lastWrongAt: r.last_wrong_at,
  }));
}

export interface HomeSummary {
  todayLearned: number;
  dailyGoal: number;
  /** 하루 신규 학습 상한 */
  dailyCap: number;
  /** 오늘 더 학습할 수 있는 새 단어 수. 관리자와 Pro 이용 중이면 null(제한 없음) */
  remainingNew: number | null;
  reviewDue: number;
  streak: number;
  /** 최근 7일 중 학습한 날짜(YYYY-MM-DD, KST) */
  studiedDates: string[];
}
export async function getHomeSummary(): Promise<HomeSummary> {
  const { data, error } = await supabase.rpc("get_home_summary");
  if (error) throw toError(error);
  const s = data as {
    today_learned: number;
    daily_goal: number | null;
    daily_cap: number;
    remaining_new: number | null;
    review_due: number;
    streak: number;
    studied_dates: string[];
  };
  return {
    todayLearned: s.today_learned,
    dailyGoal: s.daily_goal ?? 10,
    dailyCap: s.daily_cap,
    remainingNew: s.remaining_new,
    reviewDue: s.review_due,
    streak: s.streak,
    studiedDates: s.studied_dates,
  };
}

// ---------- 결제 (PRD FR-12) ----------
/** Pro 이용 기간 중인지. 서버의 상한 판정(has_unlimited_learning)과 같은 기준이다. */
export function isProActive(proUntil: string | null, now: Date = new Date()): boolean {
  return proUntil !== null && new Date(proUntil) > now;
}

/** 토스 결제창에서 사용자가 닫거나 취소한 경우의 오류 코드 */
const TOSS_CANCEL_CODES = new Set(["USER_CANCEL", "PAY_PROCESS_CANCELED"]);

/**
 * Pro 이용권 주문을 만들고 토스 결제창을 연다. 가격·기간은 서버(create_payment_order)가 정한다.
 * 결제창을 닫으면 조용히 끝난다. 결제를 마치면 토스가 /payments/success 또는 /payments/fail로 이동시킨다.
 */
export async function startProPayment(): Promise<void> {
  await requireUser();
  const { data, error } = await supabase.rpc("create_payment_order", { p_product_code: "pro_pass" });
  if (error) throw toError(error);
  const order = data as { order_id: string; amount: number; order_name: string };
  try {
    await requestCardPayment({ orderId: order.order_id, amount: order.amount, orderName: order.order_name });
  } catch (e) {
    const code = (e as { code?: unknown }).code;
    if (typeof code === "string" && TOSS_CANCEL_CODES.has(code)) return;
    throw new Error("결제창을 열지 못했어요. 다시 시도해 주세요.");
  }
}

/**
 * 결제 성공 페이지에서 승인을 요청한다. 승인과 Pro 부여는 Edge Function(payments-confirm)이 서버에서 처리한다.
 * 같은 결제로 다시 요청해도 한 번만 반영된다.
 */
export async function confirmProPayment(p: { paymentKey: string; orderId: string; amount: number }): Promise<{ proUntil: string | null }> {
  await requireUser();
  const { data, error } = await supabase.functions.invoke("payments-confirm", { body: p });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      // Edge Function이 돌려준 한국어 안내 문구를 그대로 보여준다
      const body = (await (error.context as Response).json().catch(() => null)) as { message?: unknown } | null;
      if (typeof body?.message === "string") throw new Error(body.message);
    }
    if (error instanceof FunctionsFetchError) throw new Error("네트워크 연결을 확인하고 다시 시도해 주세요.");
    throw new Error("결제를 확인하지 못했어요. 다시 시도해 주세요.");
  }
  return { proUntil: (data as { proUntil: string | null }).proUntil };
}
