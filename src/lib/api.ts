/**
 * Mock data layer (localStorage). Every data access in the UI goes through these
 * async functions so they can later be swapped for backend RPCs.
 */
import { WORDS } from "@/data/words";
import { SRS_INTERVALS, START_TIER_BY_TARGET, TIERS, WRONG_NOTE_CLEAR_STREAK } from "@/lib/constants";
import { addDays, todayKST } from "@/lib/date";
import type { Profile, StudyEvent, StudyMode, Word, WordProgress } from "@/types";

interface UserRow { id: string; name: string; email: string; password: string }
interface DB {
  users: UserRow[];
  session: string | null;
  profiles: Record<string, Profile>;
  progress: Record<string, Record<string, WordProgress>>;
  events: Record<string, StudyEvent[]>;
}

const KEY = "danaroutine-db-v1";
const emptyDB = (): DB => ({ users: [], session: null, profiles: {}, progress: {}, events: {} });

function load(): DB {
  if (typeof localStorage === "undefined") return emptyDB();
  try {
    return { ...emptyDB(), ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return emptyDB();
  }
}
function save(db: DB) {
  localStorage.setItem(KEY, JSON.stringify(db));
}
const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

function requireUser(db: DB): string {
  if (!db.session) throw new Error("로그인이 필요해요.");
  return db.session;
}
function wordById(id: string): Word {
  const w = WORDS.find((x) => x.id === id);
  if (!w) throw new Error("단어를 찾을 수 없어요.");
  return w;
}
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function logEvent(db: DB, userId: string, e: Omit<StudyEvent, "id" | "date" | "at">) {
  (db.events[userId] ||= []).push({ ...e, id: uid(), date: todayKST(), at: Date.now() });
}
function todayLearnedCount(db: DB, userId: string) {
  const t = todayKST();
  return Object.values(db.progress[userId] || {}).filter((p) => p.firstStudiedAt === t).length;
}

// ---------- Auth ----------
export async function signUp(name: string, email: string, password: string): Promise<Profile> {
  await delay();
  const db = load();
  const e = email.trim().toLowerCase();
  if (db.users.some((u) => u.email === e)) throw new Error("이미 가입된 이메일이에요.");
  if (password.length < 8) throw new Error("비밀번호는 8자 이상이어야 해요.");
  const id = uid();
  db.users.push({ id, name: name.trim(), email: e, password });
  db.profiles[id] = { userId: id, name: name.trim(), email: e, targetScore: null, dailyGoal: null, startTier: null, onboarded: false };
  db.session = id;
  save(db);
  return db.profiles[id];
}

export async function signIn(email: string, password: string): Promise<Profile> {
  await delay();
  const db = load();
  const u = db.users.find((x) => x.email === email.trim().toLowerCase() && x.password === password);
  if (!u) throw new Error("이메일 또는 비밀번호가 올바르지 않아요.");
  db.session = u.id;
  save(db);
  return db.profiles[u.id];
}

export async function signOut(): Promise<void> {
  const db = load();
  db.session = null;
  save(db);
}

export async function getSession(): Promise<{ userId: string } | null> {
  const db = load();
  return db.session ? { userId: db.session } : null;
}

export async function getProfile(): Promise<Profile | null> {
  const db = load();
  return db.session ? db.profiles[db.session] ?? null : null;
}

export async function saveOnboarding(targetScore: number, dailyGoal: number): Promise<Profile> {
  await delay();
  const db = load();
  const id = requireUser(db);
  db.profiles[id] = { ...db.profiles[id], targetScore, dailyGoal, startTier: START_TIER_BY_TARGET[targetScore] ?? 500, onboarded: true };
  save(db);
  return db.profiles[id];
}

// ---------- Learning ----------
/** New words from startTier upward (then lower tiers), tier → dayNo → freqRank. */
export async function getTodayWords(opts: { extra?: boolean } = {}): Promise<Word[]> {
  await delay();
  const db = load();
  const id = requireUser(db);
  const p = db.profiles[id];
  const goal = p.dailyGoal ?? 10;
  const count = opts.extra ? goal : goal - todayLearnedCount(db, id);
  if (count <= 0) return [];
  const prog = db.progress[id] || {};
  const start = p.startTier ?? 500;
  const tierOrder = [...TIERS.filter((t) => t >= start), ...TIERS.filter((t) => t < start)];
  return WORDS.filter((w) => !prog[w.id])
    .sort((a, b) => tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier) || a.dayNo - b.dayNo || a.freqRank - b.freqRank)
    .slice(0, count);
}

export async function getWordsByIds(ids: string[]): Promise<Word[]> {
  return ids.map(wordById);
}

export async function recordFlashcard(wordId: string, known: boolean, mode: StudyMode): Promise<void> {
  await delay(80);
  const db = load();
  const id = requireUser(db);
  const today = todayKST();
  const prog = (db.progress[id] ||= {});
  const prev = prog[wordId];
  const box = known ? 1 : 0;
  prog[wordId] = {
    wordId,
    box,
    status: "learning",
    firstStudiedAt: prev?.firstStudiedAt ?? today,
    nextReviewAt: addDays(today, known ? 1 : 0),
    wrongCount: prev?.wrongCount ?? 0,
    correctStreak: prev?.correctStreak ?? 0,
    lastWrongAt: prev?.lastWrongAt ?? null,
    updatedAt: Date.now(),
  };
  logEvent(db, id, { wordId, type: "flashcard", mode, correct: known });
  save(db);
}

export async function getQuizChoices(wordId: string): Promise<Word[]> {
  const w = wordById(wordId);
  const seen = new Set([w.meaningKo]);
  const pick = (pool: Word[]) => {
    const out: Word[] = [];
    for (const c of shuffle(pool)) {
      if (out.length >= 3) break;
      if (c.id === w.id || seen.has(c.meaningKo)) continue;
      seen.add(c.meaningKo);
      out.push(c);
    }
    return out;
  };
  const wrong = pick(WORDS.filter((x) => x.pos === w.pos));
  if (wrong.length < 3) wrong.push(...pick(WORDS).slice(0, 3 - wrong.length));
  return shuffle([w, ...wrong]);
}

export async function recordQuizAnswer(wordId: string, choiceWordId: string, mode: StudyMode): Promise<{ isCorrect: boolean }> {
  await delay(80);
  const db = load();
  const id = requireUser(db);
  const today = todayKST();
  const isCorrect = wordId === choiceWordId;
  const prog = (db.progress[id] ||= {});
  const prev: WordProgress = prog[wordId] ?? {
    wordId, box: 0, status: "learning", firstStudiedAt: today, nextReviewAt: today,
    wrongCount: 0, correctStreak: 0, lastWrongAt: null, updatedAt: Date.now(),
  };
  const next = { ...prev, updatedAt: Date.now() };
  if (isCorrect) {
    if (prev.box >= 4) next.status = "mastered";
    next.box = Math.min(prev.box + 1, 4);
    next.correctStreak = prev.correctStreak + 1;
  } else {
    next.box = 0;
    next.status = "learning";
    next.wrongCount = prev.wrongCount + 1;
    next.correctStreak = 0;
    next.lastWrongAt = new Date().toISOString();
  }
  next.nextReviewAt = addDays(today, SRS_INTERVALS[next.box]);
  prog[wordId] = next;
  logEvent(db, id, { wordId, type: "quiz", mode, correct: isCorrect });
  save(db);
  return { isCorrect };
}

export async function getReviewWords(): Promise<Word[]> {
  await delay();
  const db = load();
  const id = requireUser(db);
  const today = todayKST();
  return Object.values(db.progress[id] || {})
    .filter((p) => p.status !== "mastered" && p.nextReviewAt <= today)
    .map((p) => wordById(p.wordId));
}

export interface WrongNote { word: Word; wrongCount: number; lastWrongAt: string | null }
export async function getWrongNotes(): Promise<WrongNote[]> {
  await delay();
  const db = load();
  const id = requireUser(db);
  return Object.values(db.progress[id] || {})
    .filter((p) => p.wrongCount > 0 && p.correctStreak < WRONG_NOTE_CLEAR_STREAK)
    .sort((a, b) => (b.lastWrongAt ?? "").localeCompare(a.lastWrongAt ?? ""))
    .map((p) => ({ word: wordById(p.wordId), wrongCount: p.wrongCount, lastWrongAt: p.lastWrongAt }));
}

export interface DaySummary { dayNo: number; tier: number; total: number; learned: number; accuracy: number | null }
export async function getDays(): Promise<DaySummary[]> {
  await delay();
  const db = load();
  const id = requireUser(db);
  const prog = db.progress[id] || {};
  const events = (db.events[id] || []).filter((e) => e.type === "quiz");
  const days = [...new Set(WORDS.map((w) => w.dayNo))].sort((a, b) => a - b);
  return days.map((dayNo) => {
    const ws = WORDS.filter((w) => w.dayNo === dayNo);
    const ids = new Set(ws.map((w) => w.id));
    const ev = events.filter((e) => ids.has(e.wordId));
    return {
      dayNo,
      tier: ws[0].tier,
      total: ws.length,
      learned: ws.filter((w) => prog[w.id]).length,
      accuracy: ev.length ? Math.round((ev.filter((e) => e.correct).length / ev.length) * 100) : null,
    };
  });
}

export async function getDayWords(dayNo: number): Promise<Word[]> {
  await delay();
  return WORDS.filter((w) => w.dayNo === dayNo).sort((a, b) => a.freqRank - b.freqRank);
}

export async function getHomeSummary(): Promise<{ todayLearned: number; dailyGoal: number; reviewDue: number; streak: number }> {
  await delay();
  const db = load();
  const id = requireUser(db);
  const today = todayKST();
  const reviewDue = Object.values(db.progress[id] || {}).filter((p) => p.status !== "mastered" && p.nextReviewAt <= today).length;
  const dates = new Set((db.events[id] || []).map((e) => e.date));
  let streak = 0;
  let d = dates.has(today) ? today : addDays(today, -1);
  while (dates.has(d)) {
    streak++;
    d = addDays(d, -1);
  }
  return { todayLearned: todayLearnedCount(db, id), dailyGoal: db.profiles[id].dailyGoal ?? 10, reviewDue, streak };
}
