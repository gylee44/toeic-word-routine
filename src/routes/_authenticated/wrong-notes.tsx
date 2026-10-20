import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { useErrorToast } from "@/components/useErrorToast";
import { getWrongNotes } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/wrong-notes")({
  head: () => ({ meta: [{ title: "오답노트 | 단어루틴" }, { name: "description", content: "자주 틀린 단어 모아보기" }] }),
  component: WrongNotes,
});

function WrongNotes() {
  const q = useQuery({ queryKey: ["wrong"], queryFn: getWrongNotes });
  useErrorToast(q.error, q.refetch);
  return (
    <div>
      <PageHeader title="오답노트" />
      {!q.data ? (
        <div className="grid gap-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
      ) : q.data.length === 0 ? (
        <EmptyState icon={<NotebookPen className="h-10 w-10" />} title="오답 단어가 없어요" description="퀴즈에서 틀린 단어가 여기에 모여요." />
      ) : (
        <>
          <Button asChild size="lg" className="mb-4 w-full"><Link to="/quiz" search={{ mode: "wrong" }}>오답 단어 다시 학습</Link></Button>
          <ul className="grid gap-2">
            {q.data.map(({ word, wrongCount }) => (
              <li key={word.id} className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-card">
                <div className="flex-1">
                  <p className="font-semibold">{word.headword}</p>
                  <p className="text-sm text-muted-foreground">{word.meaningKo}</p>
                </div>
                <span className="rounded-full bg-danger-soft px-3 py-1 text-xs font-semibold text-destructive">오답 {wrongCount}회</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
