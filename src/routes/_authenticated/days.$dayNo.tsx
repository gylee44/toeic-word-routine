import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { LearnSession } from "@/components/LearnSession";
import { getDayWords } from "@/lib/api";
import { MAX_DAY } from "@/data/words";

export const Route = createFileRoute("/_authenticated/days/$dayNo")({
  loader: ({ params }) => {
    const n = Number(params.dayNo);
    if (!Number.isInteger(n) || n < 1 || n > MAX_DAY) throw notFound();
    return { dayNo: n };
  },
  head: () => ({ meta: [{ title: "Day 학습 | 단어루틴" }, { name: "description", content: "Day 단어 플래시카드" }] }),
  component: DayLearn,
  notFoundComponent: () => (
    <div className="py-20 text-center">
      <p className="text-xl font-bold">존재하지 않는 Day예요</p>
      <Button asChild className="mt-6"><Link to="/days">Day 목록으로</Link></Button>
    </div>
  ),
  errorComponent: () => <p className="py-20 text-center">불러오지 못했어요.</p>,
});

function DayLearn() {
  const { dayNo } = Route.useLoaderData();
  const q = useQuery({ queryKey: ["day", dayNo], queryFn: () => getDayWords(dayNo) });
  if (!q.data) return <Skeleton className="mt-20 h-80 rounded-3xl" />;
  return <LearnSession words={q.data} mode="day" title={`Day ${dayNo}`} />;
}
