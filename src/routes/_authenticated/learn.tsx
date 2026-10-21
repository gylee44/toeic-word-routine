import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { LearnSession } from "@/components/LearnSession";
import { useErrorToast } from "@/components/useErrorToast";
import { getTodayWords, getWordsByIds } from "@/lib/api";

type S = { extra?: boolean | undefined; ids?: string | undefined };

export const Route = createFileRoute("/_authenticated/learn")({
  validateSearch: (s: Record<string, unknown>): S => ({
    extra: s["extra"] === true || s["extra"] === "true" ? true : undefined,
    ids: typeof s["ids"] === "string" ? s["ids"] : undefined,
  }),
  head: () => ({ meta: [{ title: "오늘의 학습 | 단어루틴" }, { name: "description", content: "플래시카드로 오늘의 단어 학습" }] }),
  component: Learn,
});

function Learn() {
  const { extra, ids } = Route.useSearch();
  const q = useQuery({
    queryKey: ["learn", extra, ids],
    queryFn: () => (ids ? getWordsByIds(ids.split(",")) : getTodayWords({ extra })),
    staleTime: Infinity,
  });
  useErrorToast(q.error, q.refetch);
  if (!q.data) return <Skeleton className="mt-20 h-80 rounded-3xl" />;
  if (q.data.length === 0)
    return (
      <div className="pt-20 lg:pt-0">
        <PageHeader title="오늘의 학습" desktopOnly />
        <EmptyState icon={<CheckCircle2 className="h-10 w-10" />} title="학습할 새 단어가 없어요" description="오늘 목표를 완료했거나 모든 단어를 학습했어요." action={<Button asChild size="lg" className="w-full lg:h-14"><Link to="/home">홈으로</Link></Button>} />
      </div>
    );
  return <LearnSession words={q.data} mode="learn" />;
}
