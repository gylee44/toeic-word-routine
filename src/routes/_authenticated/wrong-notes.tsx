import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { useErrorToast } from "@/components/useErrorToast";
import { getWrongNotes } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/wrong-notes")({
  head: () => ({ meta: [{ title: "오답노트 | 단어루틴" }, { name: "description", content: "자주 틀린 단어 모아보기" }] }),
  component: WrongNotes,
});

function WrongNotes() {
  const q = useQuery({ queryKey: ["wrong"], queryFn: getWrongNotes });
  useErrorToast(q.error, q.refetch);
  const count = q.data?.length ?? 0;
  const cta = (
    <Button asChild size="lg" className="w-full lg:h-[54px] lg:w-auto lg:px-7 lg:text-base">
      <Link to="/quiz" search={{ mode: "wrong" }}>오답 단어 다시 학습<ArrowRight aria-hidden /></Link>
    </Button>
  );
  return (
    <div className="pt-9 lg:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <h1 className="text-[26px] font-bold leading-[1.3] tracking-[-0.03em] lg:text-[34px]">오답노트</h1>
            {count > 0 && <span className="text-sm text-muted-foreground lg:hidden">{count}개</span>}
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground lg:mt-2 lg:text-base">두 번 연속 맞히면 목록에서 빠져요.</p>
        </div>
        {count > 0 && <div className="hidden lg:block">{cta}</div>}
      </div>

      <div className="mt-5 lg:mt-8">
        {!q.data ? (
          <div className="grid gap-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
        ) : count === 0 ? (
          <EmptyState icon={<NotebookPen className="h-10 w-10" />} title="오답 단어가 없어요" description="퀴즈에서 틀린 단어가 여기에 모여요." />
        ) : (
          <>
            <div className="lg:hidden">{cta}</div>
            <section className="mt-5 border-t border-foreground lg:mt-0 lg:rounded-[20px] lg:border lg:bg-card lg:px-8 lg:pb-3 lg:pt-2">
              <div className="hidden items-center gap-4 border-b border-foreground pb-3 pt-4 text-[13px] font-bold text-muted-foreground lg:flex">
                <span className="flex-[1_1_220px]">단어 · {count}개</span>
                <span className="flex-[2_1_260px]">뜻</span>
                <span className="w-[90px] shrink-0 text-right">오답 횟수</span>
              </div>
              <ul>
                {q.data.map(({ word, wrongCount }) => (
                  <li key={word.id} className="flex items-center gap-3 border-b py-4 pl-0.5 last:border-b-0 lg:gap-4 lg:py-5 lg:pl-0">
                    <span className="flex-1 lg:flex-[1_1_220px]">
                      <span className="block font-serif text-[22px] font-semibold leading-[1.2] lg:text-[26px]">{word.headword}</span>
                      <span className="mt-[3px] block text-sm text-muted-foreground lg:hidden">{word.meaningKo}</span>
                    </span>
                    <span className="hidden text-base lg:block lg:flex-[2_1_260px]">{word.meaningKo}</span>
                    <span className="lg:w-[90px] lg:shrink-0 lg:text-right">
                      <span className="inline-block rounded-md bg-danger-soft px-2.5 py-1 text-xs font-bold text-destructive lg:text-[13px]">오답 {wrongCount}회</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
