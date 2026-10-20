import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { QuizRunner } from "@/components/QuizRunner";
import { useErrorToast } from "@/components/useErrorToast";
import { getReviewWords, getWordsByIds, getWrongNotes } from "@/lib/api";
import { getQuizQueue } from "@/lib/session";
import type { StudyMode } from "@/types";

const MODES: StudyMode[] = ["learn", "review", "wrong", "day"];

export const Route = createFileRoute("/_authenticated/quiz/")({
  validateSearch: (s: Record<string, unknown>): { mode: StudyMode } => ({
    mode: MODES.includes(s["mode"] as StudyMode) ? (s["mode"] as StudyMode) : "learn",
  }),
  head: () => ({ meta: [{ title: "퀴즈 | 단어루틴" }, { name: "description", content: "뜻 맞히기 퀴즈" }] }),
  component: Quiz,
});

export function QuizByMode({ mode }: { mode: StudyMode }) {
  const q = useQuery({
    queryKey: ["quiz", mode],
    queryFn: async () => {
      if (mode === "review") return getReviewWords();
      if (mode === "wrong") return (await getWrongNotes()).map((n) => n.word);
      return getWordsByIds(getQuizQueue());
    },
    staleTime: Infinity,
    gcTime: 0,
  });
  useErrorToast(q.error, q.refetch);
  if (!q.data) return <Skeleton className="mt-20 h-80 rounded-3xl" />;
  if (q.data.length === 0)
    return (
      <div className="pt-20">
        <EmptyState title="풀 문제가 없어요" description="학습하거나 복습할 단어가 생기면 다시 와주세요." action={<Button asChild size="lg" className="w-full"><Link to="/home">홈으로</Link></Button>} />
      </div>
    );
  const title = mode === "review" ? `오늘의 복습 ${q.data.length}개` : mode === "wrong" ? `오답 다시 풀기 ${q.data.length}개` : "학습 확인 퀴즈";
  return <QuizRunner words={q.data} mode={mode} title={title} />;
}

function Quiz() {
  const { mode } = Route.useSearch();
  return <QuizByMode mode={mode} />;
}
