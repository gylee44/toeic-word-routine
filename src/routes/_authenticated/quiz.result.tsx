import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { useErrorToast } from "@/components/useErrorToast";
import { getWordsByIds } from "@/lib/api";
import { getQuizResult, type QuizResult } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/quiz/result")({
  head: () => ({ meta: [{ title: "퀴즈 결과 | 단어루틴" }, { name: "description", content: "퀴즈 결과" }] }),
  component: Result,
});

function Result() {
  const navigate = useNavigate();
  const [r, setR] = useState<QuizResult | null | undefined>(undefined);
  useEffect(() => setR(getQuizResult()), []);
  const wrongIds = r?.wrongIds ?? [];
  const wrongWords = useQuery({ queryKey: ["words", wrongIds], queryFn: () => getWordsByIds(wrongIds), enabled: wrongIds.length > 0 });
  useErrorToast(wrongWords.error, wrongWords.refetch);
  if (r === undefined) return null;
  if (!r) return <div className="pt-20 lg:pt-14"><EmptyState title="결과가 없어요" action={<Button asChild size="lg" className="w-full"><Link to="/home">홈으로</Link></Button>} /></div>;
  const perfect = r.wrongIds.length === 0;
  const wrong = wrongWords.data ?? [];

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col py-7 lg:min-h-[calc(100dvh-72px)] lg:max-w-[1040px] lg:flex-row lg:flex-wrap lg:items-start lg:gap-x-[72px] lg:gap-y-12 lg:py-[88px]">
      <section className="lg:min-w-0 lg:flex-[1_1_340px]">
        <p className="text-[13px] font-medium text-muted-foreground lg:text-sm">퀴즈 결과</p>
        <p className="mt-9 flex items-baseline gap-2 lg:mt-5 lg:gap-3">
          <span className="font-serif text-[96px] font-semibold leading-none tracking-[-0.03em] text-primary tabular-nums lg:text-[144px]">{r.correct}</span>
          <span className="font-serif text-4xl font-semibold text-muted-foreground lg:text-5xl">/ {r.total}</span>
        </p>
        <h1 className="mt-4 text-2xl font-bold leading-[1.35] tracking-[-0.03em] lg:mt-6 lg:text-[32px]">
          {perfect ? "완벽해요!" : <>조금만 더 하면<br />완벽해요</>}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground lg:mt-3 lg:text-base">
          {perfect ? "모든 문제를 맞혔어요." : "틀린 단어는 오답노트에 모아뒀어요."}
        </p>
        <div className="mt-9 hidden flex-wrap items-center gap-3 lg:flex">
          {!perfect && <Button size="xl" className="px-8" onClick={() => navigate({ to: "/learn", search: { ids: r.wrongIds.join(",") } })}>틀린 단어 다시 학습</Button>}
          <Button size="xl" variant={perfect ? "default" : "ghost"} className="px-6 font-medium" onClick={() => navigate({ to: "/home" })}>홈으로</Button>
        </div>
      </section>

      {!perfect && (
        <section className="mt-9 lg:mt-0 lg:min-w-0 lg:flex-[1_1_380px] lg:rounded-[22px] lg:border lg:bg-card lg:px-8 lg:pb-3 lg:pt-7">
          <div className="flex items-baseline justify-between border-b border-foreground pb-2.5 lg:pb-3.5">
            <h2 className="text-[15px] font-bold lg:text-base">틀린 단어</h2>
            <span className="text-[13px] text-muted-foreground lg:text-sm">{r.wrongIds.length}개</span>
          </div>
          {!wrongWords.data && <div className="grid gap-2 pt-3">{r.wrongIds.map((id) => <Skeleton key={id} className="h-12 rounded-xl" />)}</div>}
          <ul>
            {wrong.map((w) => (
              <li key={w.id} className="flex items-center gap-3 border-b py-4 last:border-b-0 lg:gap-3.5 lg:py-5">
                <X className="h-[18px] w-[18px] shrink-0 text-destructive lg:h-5 lg:w-5" strokeWidth={2.5} aria-label="오답" />
                <span className="flex-1 font-serif text-xl font-semibold lg:text-2xl">{w.headword}</span>
                <span className="text-[15px] lg:text-base">{w.meaningKo}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-auto grid gap-1.5 pt-6 lg:hidden">
        {!perfect && <Button size="xl" onClick={() => navigate({ to: "/learn", search: { ids: r.wrongIds.join(",") } })}>틀린 단어 다시 학습</Button>}
        <Button size="xl" variant={perfect ? "default" : "ghost"} className="font-medium" onClick={() => navigate({ to: "/home" })}>홈으로</Button>
      </div>
    </div>
  );
}
