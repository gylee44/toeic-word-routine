import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TickBar } from "@/components/ProgressBar";
import { StreakWeek } from "@/components/StreakWeek";
import { errorMessage } from "@/components/useErrorToast";
import { getHomeSummary, getProfile, getTodayLearnedWords, getWrongNotes } from "@/lib/api";
import { formatTargetScore } from "@/lib/constants";
import { getQuizProgress, setQuizQueue } from "@/lib/session";
import { cn } from "@/lib/utils";
import type { Word } from "@/types";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({ meta: [{ title: "홈 | 단어루틴" }, { name: "description", content: "오늘의 학습과 복습 현황" }] }),
  component: Home,
});

const WORDS_PER_PAGE = 10;

/** 오늘 학습한 단어. 10개씩 페이지를 넘기며 다시 볼 수 있다. */
function LearnedWords({ words }: { words: Word[] }) {
  const [page, setPage] = useState(0);
  const pageCount = Math.ceil(words.length / WORDS_PER_PAGE);
  const current = Math.min(page, pageCount - 1);
  const visible = words.slice(current * WORDS_PER_PAGE, (current + 1) * WORDS_PER_PAGE);
  return (
    <div className="mt-6 border-t pt-1 lg:mt-8">
      <div className="mb-1 mt-4 flex items-center justify-between">
        <h3 className="text-sm font-bold">오늘 학습한 단어</h3>
        <Link to="/words" className="flex items-center gap-0.5 py-1 text-[13px] font-medium text-primary">단어장 전체 보기<ChevronRight className="h-4 w-4" aria-hidden /></Link>
      </div>
      <ul>
        {visible.map((w) => (
          <li key={w.id} className="flex items-baseline gap-4 border-b border-border/60 py-3 last:border-b-0 lg:py-3.5">
            <span className="w-28 shrink-0 font-serif text-lg font-semibold lg:w-[180px] lg:text-[22px]">{w.headword}</span>
            <span className="min-w-0 flex-1 text-sm text-muted-foreground lg:text-[15px]">{w.meaningKo}</span>
          </li>
        ))}
      </ul>
      {pageCount > 1 && (
        <nav aria-label="오늘 학습한 단어 페이지" className="mt-2 flex items-center justify-between">
          <Button variant="ghost" className="-ml-4" onClick={() => setPage(current - 1)} disabled={current === 0}>
            <ChevronLeft aria-hidden />이전
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums" aria-live="polite">{current + 1} / {pageCount}</span>
          <Button variant="ghost" className="-mr-4" onClick={() => setPage(current + 1)} disabled={current === pageCount - 1}>
            다음<ChevronRight aria-hidden />
          </Button>
        </nav>
      )}
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="홈 화면을 불러오는 중" className="pt-9 lg:pt-14">
      <Skeleton className="h-9 w-64 rounded-xl lg:h-11" />
      <Skeleton className="mt-2.5 h-5 w-44 rounded-lg" />
      <div className="mt-6 flex flex-col gap-3 lg:mt-9 lg:flex-row lg:items-start lg:gap-6">
        <Skeleton className="h-60 rounded-[var(--radius-card)] lg:h-[230px] lg:flex-1" />
        <div className="flex flex-col gap-3 lg:w-[360px] lg:shrink-0 lg:gap-4">
          <Skeleton className="h-[74px] rounded-[var(--radius-card)] lg:h-[92px]" />
          <Skeleton className="h-28 rounded-[var(--radius-card)] lg:h-[144px]" />
          <Skeleton className="h-14 rounded-[var(--radius-card)] lg:h-[60px]" />
        </div>
      </div>
    </div>
  );
}

function HomeError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div role="alert" className="pt-9 lg:pt-14">
      <div className="card-surface mx-auto max-w-[480px] px-6 py-10 text-center">
        <h1 className="text-lg font-bold">홈 정보를 불러오지 못했어요</h1>
        <p className="mt-2 text-sm text-muted-foreground">{errorMessage(error)}</p>
        <Button className="mt-6" size="lg" onClick={onRetry}>다시 시도</Button>
      </div>
    </div>
  );
}

function Home() {
  const navigate = useNavigate();
  const profile = useQuery({ queryKey: ["profile"], queryFn: getProfile });
  const summary = useQuery({ queryKey: ["home"], queryFn: getHomeSummary });
  const learned = useQuery({ queryKey: ["todayLearned"], queryFn: getTodayLearnedWords });
  const wrong = useQuery({ queryKey: ["wrong"], queryFn: getWrongNotes });

  if (summary.isError || profile.isError) {
    return (
      <HomeError
        error={summary.error ?? profile.error}
        onRetry={() => {
          if (summary.isError) summary.refetch();
          if (profile.isError) profile.refetch();
        }}
      />
    );
  }
  if (!summary.data || !profile.data) return <HomeSkeleton />;

  const { todayLearned, dailyGoal, remainingNew, reviewDue, streak, studiedDates } = summary.data;
  const goalMet = todayLearned >= dailyGoal;
  // 하루 신규 학습 상한에 닿으면 추가 학습을 막는다 (관리자는 remainingNew가 null)
  const capReached = remainingNew === 0;
  // 조회에 실패하면 개수를 단정하지 않고 개수 표시만 숨긴다
  const wrongCount = wrong.isError ? 0 : (wrong.data?.length ?? 0);
  const learnedWords = learned.data ?? [];

  // 풀던 퀴즈가 있으면 이어 풀 수 있게 푼 개수를 보여준다
  const answered = getQuizProgress("learn", learnedWords.map((w) => w.id))?.results.length ?? 0;
  // 오늘 학습한 단어 전체로 확인 퀴즈를 연다 (새로고침해도 서버 조회 결과로 다시 만들 수 있다)
  const quizButton =
    learnedWords.length > 0 ? (
      <Button
        size="lg"
        variant="outline"
        className="shrink-0 lg:h-14 lg:px-6 lg:text-base"
        onClick={() => {
          setQuizQueue(learnedWords.map((w) => w.id));
          navigate({ to: "/quiz", search: { mode: "learn" } });
        }}
      >
        {answered > 0 ? (
          <>
            퀴즈 이어서 <span className="font-normal tabular-nums opacity-70">{answered}/{learnedWords.length}</span>
          </>
        ) : (
          "단어 퀴즈"
        )}
      </Button>
    ) : null;
  // 퀴즈 버튼은 학습 버튼 왼쪽에 둔다 (400px 미만에서는 위아래로 쌓는다)
  const withQuiz = (cta: React.ReactNode) =>
    quizButton ? (
      <div className="flex gap-2 max-[399px]:flex-col lg:gap-3">
        {quizButton}
        <div className="min-w-0 flex-1 lg:flex-none">{cta}</div>
      </div>
    ) : (
      cta
    );

  const action = capReached ? (
    <div className="flex flex-col gap-3 lg:items-end">
      <p className="text-sm text-muted-foreground lg:text-[15px]">
        오늘 새 단어는 여기까지예요. 내일 새 단어로 만나요.{reviewDue > 0 && " 복습은 계속할 수 있어요."}
      </p>
      {quizButton}
    </div>
  ) : goalMet ? (
    <div className="flex flex-col gap-2 lg:items-end">
      {withQuiz(
        <Button asChild size="lg" variant="soft" className="w-full lg:h-14 lg:w-auto lg:px-7 lg:text-base">
          <Link to="/learn" search={{ extra: true }}>새 단어 더 학습하기</Link>
        </Button>,
      )}
      {remainingNew != null && <p className="text-[13px] text-muted-foreground lg:text-sm">오늘 {remainingNew}개까지 더 배울 수 있어요</p>}
    </div>
  ) : (
    withQuiz(
      <Button asChild size="lg" className="w-full lg:h-14 lg:w-auto lg:px-7 lg:text-base">
        <Link to="/learn" search={{}}>{todayLearned > 0 ? "이어서 학습" : "오늘의 학습 시작"}<ArrowRight aria-hidden /></Link>
      </Button>,
    )
  );

  return (
    <div className="pt-9 lg:pt-14">
      <header>
        <h1 className="text-[26px] font-bold leading-[1.3] tracking-[-0.03em] lg:text-[34px]">안녕하세요, {profile.data.name}님</h1>
        <p className="mt-1.5 text-sm text-muted-foreground lg:mt-2 lg:text-base">
          {profile.data.targetScore != null && `목표 ${formatTargetScore(profile.data.targetScore)}점 · `}하루 {dailyGoal}개{reviewDue > 0 && ` · 오늘 복습 ${reviewDue}개 남음`}
        </p>
      </header>

      <div className="mt-6 flex flex-col gap-3 lg:mt-9 lg:flex-row lg:items-start lg:gap-6">
        <section className="card-surface p-5 lg:min-w-0 lg:flex-1 lg:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold lg:text-[15px]">오늘의 학습</h2>
            <span className="text-[13px] text-muted-foreground lg:text-sm">목표 {dailyGoal}개</span>
          </div>
          <div className="mt-3.5 flex flex-wrap items-end justify-between gap-5 lg:mt-5">
            <p className="flex items-baseline gap-1.5 lg:gap-2.5">
              <span
                className={cn(
                  "font-serif text-[56px] font-semibold leading-none tracking-tight tabular-nums transition-colors duration-500 motion-reduce:transition-none lg:text-[88px]",
                  todayLearned === 0 && "text-muted-foreground",
                  goalMet && "text-primary",
                )}
              >
                {todayLearned}
              </span>
              <span className="text-lg text-muted-foreground lg:text-[22px]">/ {dailyGoal} 단어</span>
            </p>
            <div className="hidden lg:block">{action}</div>
          </div>
          <TickBar className="mt-4 lg:mt-6" value={todayLearned} max={dailyGoal} label="오늘 학습 진행률" />
          {todayLearned === 0 && <p className="mt-4 text-sm text-muted-foreground">하루 {dailyGoal}개, 가볍게 시작해 봐요.</p>}
          {goalMet && <p className="mt-4 flex items-center gap-2 font-bold text-success"><Trophy className="h-5 w-5" aria-hidden />오늘 목표 완료!</p>}
          <div className="mt-5 lg:hidden">{action}</div>

          {learnedWords.length > 0 && <LearnedWords words={learnedWords} />}
        </section>

        <div className="flex flex-col gap-3 lg:w-[360px] lg:shrink-0 lg:gap-4">
          {reviewDue > 0 ? (
            <Link to="/review" className="card-surface flex items-center gap-4 border-primary/30 bg-accent px-5 py-4 lg:gap-[18px] lg:px-6 lg:py-5">
              <span className="w-10 text-center font-serif text-[34px] font-semibold leading-none text-primary lg:w-12 lg:text-[44px]">{reviewDue}</span>
              <span className="flex-1">
                <span className="block text-[15px] font-bold lg:text-base">오늘 복습할 단어</span>
                <span className="mt-0.5 block text-[13px] text-muted-foreground lg:text-sm">잊기 전에 한 번 더 확인해요</span>
              </span>
              <span className="flex items-center gap-0.5 text-sm font-bold text-primary">복습 시작<ChevronRight className="h-[18px] w-[18px]" aria-hidden /></span>
            </Link>
          ) : (
            <div className="card-surface border-dashed bg-transparent px-5 py-4 lg:px-6 lg:py-5">
              <p className="text-[15px] font-bold lg:text-base">오늘 복습할 단어가 없어요</p>
              <p className="mt-0.5 text-[13px] text-muted-foreground lg:text-sm">새 단어를 학습하면 복습 일정이 생겨요</p>
            </div>
          )}

          <StreakWeek days={streak} studiedDates={studiedDates} />

          <Link to="/wrong-notes" className="card-surface flex min-h-14 items-center justify-between px-5 py-4 text-sm font-medium lg:px-6 lg:text-[15px]">
            <span>
              {wrongCount > 0 ? (<>오답노트 <span className="font-bold text-destructive">{wrongCount}개</span>가 기다려요</>) : "오답노트 보기"}
            </span>
            <ChevronRight className="h-[18px] w-[18px] text-muted-foreground" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
