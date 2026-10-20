import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { WORDS } from "@/data/words";
import { getQuizResult, type QuizResult } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/quiz/result")({
  head: () => ({ meta: [{ title: "퀴즈 결과 | 단어루틴" }, { name: "description", content: "퀴즈 결과" }] }),
  component: Result,
});

function Result() {
  const navigate = useNavigate();
  const [r, setR] = useState<QuizResult | null | undefined>(undefined);
  useEffect(() => setR(getQuizResult()), []);
  if (r === undefined) return null;
  if (!r) return <div className="pt-20"><EmptyState title="결과가 없어요" action={<Button asChild className="w-full"><Link to="/home">홈으로</Link></Button>} /></div>;
  const wrong = r.wrongIds.map((id) => WORDS.find((w) => w.id === id)).filter((w) => !!w);
  const perfect = wrong.length === 0;

  return (
    <div className="flex min-h-dvh flex-col py-8">
      <div className="text-center">
        <p className="text-sm font-medium text-muted-foreground">퀴즈 결과</p>
        <p className="mt-2 text-5xl font-bold tabular-nums"><span className="text-primary">{r.correct}</span> / {r.total}</p>
        <p className="mt-3 font-semibold">{perfect ? "완벽해요! 🎉" : "조금만 더 하면 돼요!"}</p>
      </div>
      <div className="mt-8 flex-1">
        {!perfect && (
          <>
            <h2 className="mb-3 font-semibold">틀린 단어 {wrong.length}개</h2>
            <ul className="grid gap-2">
              {wrong.map((w) => (
                <li key={w.id} className="flex items-center gap-3 rounded-2xl bg-danger-soft p-4">
                  <XCircle className="h-5 w-5 shrink-0 text-destructive" aria-label="오답" />
                  <span className="font-semibold">{w.headword}</span>
                  <span className="ml-auto text-sm">{w.meaningKo}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      <div className="mt-6 grid gap-3">
        {!perfect && <Button size="xl" onClick={() => navigate({ to: "/learn", search: { ids: r.wrongIds.join(",") } })}>틀린 단어 다시 학습</Button>}
        <Button size="xl" variant={perfect ? "default" : "ghost"} onClick={() => navigate({ to: "/home" })}>홈으로</Button>
      </div>
    </div>
  );
}
