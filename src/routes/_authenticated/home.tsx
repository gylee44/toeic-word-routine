import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, NotebookPen, RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgressBar } from "@/components/ProgressBar";
import { StreakBadge } from "@/components/StreakBadge";
import { useErrorToast } from "@/components/useErrorToast";
import { getHomeSummary, getProfile } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({ meta: [{ title: "홈 | 단어루틴" }, { name: "description", content: "오늘의 학습과 복습 현황" }] }),
  component: Home,
});

function Home() {
  const profile = useQuery({ queryKey: ["profile"], queryFn: getProfile });
  const summary = useQuery({ queryKey: ["home"], queryFn: getHomeSummary });
  useErrorToast(summary.error, summary.refetch);

  if (!summary.data || !profile.data) {
    return (
      <div className="grid gap-4 pt-6">
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-44 rounded-3xl" />
        <Skeleton className="h-32 rounded-3xl" />
      </div>
    );
  }
  const { todayLearned, dailyGoal, reviewDue, streak } = summary.data;
  const goalMet = todayLearned >= dailyGoal;
  const t = profile.data.targetScore;

  return (
    <div className="grid gap-4 pt-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">안녕하세요, {profile.data.name}님</h1>
          <p className="mt-1 text-sm text-muted-foreground">목표 {t === 900 ? "900+" : t === 500 ? "500 이하" : t}점을 향해 가고 있어요</p>
        </div>
        <StreakBadge days={streak} />
      </header>

      <section className="rounded-3xl border bg-card p-5 shadow-card">
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold">오늘의 학습</h2>
          <p className="text-sm tabular-nums"><span className="text-xl font-bold text-primary">{todayLearned}</span> / {dailyGoal}</p>
        </div>
        <ProgressBar className="mt-3" value={todayLearned} max={dailyGoal} label="오늘 학습 진행률" />
        {goalMet ? (
          <>
            <p className="mt-4 flex items-center gap-2 font-semibold text-success"><Trophy className="h-5 w-5" aria-hidden />오늘 목표 완료!</p>
            <Button asChild size="lg" variant="soft" className="mt-3 w-full"><Link to="/learn" search={{ extra: true }}>추가 학습</Link></Button>
          </>
        ) : (
          <Button asChild size="lg" className="mt-5 w-full">
            <Link to="/learn" search={{}}>{todayLearned > 0 ? "이어서 학습" : "오늘의 학습 시작"}</Link>
          </Button>
        )}
      </section>

      <section className="rounded-3xl border bg-card p-5 shadow-card">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground"><RotateCcw className="h-5 w-5" aria-hidden /></span>
          <h2 className="font-semibold">{reviewDue > 0 ? `오늘 복습할 단어 ${reviewDue}개` : "오늘 복습할 단어가 없어요"}</h2>
        </div>
        {reviewDue > 0 && <Button asChild size="lg" variant="outline" className="mt-4 w-full"><Link to="/review">복습 시작</Link></Button>}
      </section>

      <Link to="/wrong-notes" className="flex min-h-14 items-center gap-3 rounded-2xl bg-muted px-5 py-4 font-medium">
        <NotebookPen className="h-5 w-5 text-destructive" aria-hidden />
        <span className="flex-1">오답노트 보기</span>
        <ChevronRight className="h-5 w-5 text-muted-foreground" aria-hidden />
      </Link>
    </div>
  );
}
