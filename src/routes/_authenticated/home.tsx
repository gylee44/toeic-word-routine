import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ChevronRight, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TickBar } from "@/components/ProgressBar";
import { StreakWeek } from "@/components/StreakWeek";
import { useErrorToast } from "@/components/useErrorToast";
import { getHomeSummary, getProfile, getTodayLearnedWords, getWrongNotes } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({ meta: [{ title: "홈 | 단어루틴" }, { name: "description", content: "오늘의 학습과 복습 현황" }] }),
  component: Home,
});

function Home() {
  const profile = useQuery({ queryKey: ["profile"], queryFn: getProfile });
  const summary = useQuery({ queryKey: ["home"], queryFn: getHomeSummary });
  const learned = useQuery({ queryKey: ["todayLearned"], queryFn: getTodayLearnedWords });
  const wrong = useQuery({ queryKey: ["wrong"], queryFn: getWrongNotes });
  useErrorToast(summary.error, summary.refetch);

  if (!summary.data || !profile.data) {
    return (
      <div className="grid gap-3 pt-9 lg:pt-14">
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-52 rounded-[18px]" />
        <Skeleton className="h-20 rounded-[18px]" />
        <Skeleton className="h-28 rounded-[18px]" />
      </div>
    );
  }
  const { todayLearned, dailyGoal, reviewDue, streak, studiedDates } = summary.data;
  const goalMet = todayLearned >= dailyGoal;
  const t = profile.data.targetScore;
  const wrongCount = wrong.data?.length ?? 0;

  const action = goalMet ? (
    <Button asChild size="lg" variant="soft" className="w-full lg:h-14 lg:w-auto lg:px-7 lg:text-base"><Link to="/learn" search={{ extra: true }}>추가 학습</Link></Button>
  ) : (
    <Button asChild size="lg" className="w-full lg:h-14 lg:w-auto lg:px-7 lg:text-base">
      <Link to="/learn" search={{}}>{todayLearned > 0 ? "이어서 학습" : "오늘의 학습 시작"}<ArrowRight aria-hidden /></Link>
    </Button>
  );

  return (
    <div className="pt-9 lg:pt-14">
      <header>
        <h1 className="text-[26px] font-bold leading-[1.3] tracking-[-0.03em] lg:text-[34px]">안녕하세요, {profile.data.name}님</h1>
        <p className="mt-1.5 text-sm text-muted-foreground lg:mt-2 lg:text-base">
          목표 {t === 900 ? "900+" : t === 500 ? "500 이하" : t}점 · 맞춤 단어 학습 중
        </p>
      </header>

      <div className="mt-6 flex flex-col gap-3 lg:mt-9 lg:flex-row lg:items-start lg:gap-6">
        <section className="rounded-[18px] border bg-card p-5 lg:min-w-0 lg:flex-1 lg:rounded-[20px] lg:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold lg:text-[15px]">오늘의 학습</h2>
            <span className="text-[13px] text-muted-foreground lg:text-sm">목표 {dailyGoal}개</span>
          </div>
          <div className="mt-3.5 flex flex-wrap items-end justify-between gap-5 lg:mt-5">
            <p className="flex items-baseline gap-1.5 lg:gap-2.5">
              <span className="font-serif text-[56px] font-semibold leading-none tracking-tight tabular-nums lg:text-[88px]">{todayLearned}</span>
              <span className="text-lg text-muted-foreground lg:text-[22px]">/ {dailyGoal} 단어</span>
            </p>
            <div className="hidden lg:block">{action}</div>
          </div>
          <TickBar className="mt-4 lg:mt-6" value={todayLearned} max={dailyGoal} label="오늘 학습 진행률" />
          {goalMet && <p className="mt-4 flex items-center gap-2 font-bold text-success"><Trophy className="h-5 w-5" aria-hidden />오늘 목표 완료!</p>}
          <div className="mt-[18px] lg:hidden">{action}</div>

          {(learned.data?.length ?? 0) > 0 && (
            <div className="mt-8 hidden border-t pt-1 lg:block">
              <h3 className="mb-1 mt-4 text-sm font-bold">오늘 학습한 단어</h3>
              <ul>
                {learned.data!.map((w) => (
                  <li key={w.id} className="flex items-baseline gap-4 border-b border-border/60 py-3.5 last:border-b-0">
                    <span className="w-[180px] font-serif text-[22px] font-semibold">{w.headword}</span>
                    <span className="flex-1 text-[15px] text-muted-foreground">{w.meaningKo}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <div className="flex flex-col gap-3 lg:w-[360px] lg:shrink-0 lg:gap-4">
          {reviewDue > 0 ? (
            <Link to="/review" className="flex items-center gap-4 rounded-[18px] border bg-card px-[18px] py-4 lg:gap-[18px] lg:rounded-[20px] lg:px-6 lg:py-[22px]">
              <span className="w-10 text-center font-serif text-[34px] font-semibold leading-none lg:w-12 lg:text-[44px]">{reviewDue}</span>
              <span className="flex-1">
                <span className="block text-[15px] font-bold lg:text-base">오늘 복습할 단어</span>
                <span className="mt-0.5 block text-[13px] text-muted-foreground lg:text-sm">잊기 전에 한 번 더 확인해요</span>
              </span>
              <span className="flex items-center gap-0.5 text-sm font-bold text-primary">복습<ChevronRight className="h-[18px] w-[18px]" aria-hidden /></span>
            </Link>
          ) : (
            <div className="rounded-[18px] border bg-card px-[18px] py-4 lg:rounded-[20px] lg:px-6 lg:py-[22px]">
              <p className="text-[15px] font-bold lg:text-base">오늘 복습할 단어가 없어요</p>
              <p className="mt-0.5 text-[13px] text-muted-foreground lg:text-sm">새 단어를 학습하면 복습 일정이 생겨요</p>
            </div>
          )}

          <StreakWeek days={streak} studiedDates={studiedDates} />

          <Link to="/wrong-notes" className="flex items-center justify-between px-1 py-3.5 text-sm font-medium lg:rounded-[20px] lg:border lg:px-6 lg:py-[18px] lg:text-[15px]">
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
