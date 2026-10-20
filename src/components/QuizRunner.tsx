import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExitButton } from "@/components/LearnSession";
import { ProgressBar } from "@/components/ProgressBar";
import { QuizQuestion } from "@/components/QuizQuestion";
import { errorMessage } from "@/components/useErrorToast";
import { getQuizChoices, recordQuizAnswer } from "@/lib/api";
import { setQuizResult } from "@/lib/session";
import type { StudyMode, Word } from "@/types";

export function QuizRunner({ words, mode, title }: { words: Word[]; mode: StudyMode; title: string }) {
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const [choices, setChoices] = useState<Word[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const lock = useRef(false);
  const results = useRef<{ id: string; ok: boolean }[]>([]);
  const word = words[idx]!;

  useEffect(() => {
    setChoices(null);
    getQuizChoices(word.id).then(setChoices).catch((e) => toast.error(errorMessage(e)));
  }, [word.id]);

  async function select(choiceId: string) {
    if (lock.current || selected) return;
    lock.current = true;
    setSubmitting(true);
    try {
      const { isCorrect } = await recordQuizAnswer(word.id, choiceId, mode);
      results.current.push({ id: word.id, ok: isCorrect });
      setSelected(choiceId);
    } catch (e) {
      toast.error(errorMessage(e), { action: { label: "다시 시도", onClick: () => select(choiceId) } });
    } finally {
      lock.current = false;
      setSubmitting(false);
    }
  }

  function next() {
    if (idx + 1 >= words.length) {
      const r = results.current;
      setQuizResult({ mode, total: r.length, correct: r.filter((x) => x.ok).length, wrongIds: r.filter((x) => !x.ok).map((x) => x.id) });
      navigate({ to: "/quiz/result", replace: true });
      return;
    }
    setSelected(null);
    setIdx((i) => i + 1);
  }

  return (
    <div className="flex min-h-dvh flex-col py-4">
      <div className="flex items-center gap-3">
        <ExitButton onExit={() => navigate({ to: "/home" })} />
        <ProgressBar value={idx + (selected ? 1 : 0)} max={words.length} label="퀴즈 진행률" />
        <span className="shrink-0 text-sm font-semibold tabular-nums">{idx + 1} / {words.length}</span>
      </div>
      <p className="mt-3 text-center text-sm font-medium text-muted-foreground">{title}</p>
      <div className="flex-1 py-5">
        {choices ? (
          <QuizQuestion word={word} choices={choices} selectedId={selected} submitting={submitting} onSelect={select} />
        ) : (
          <div className="grid gap-3">
            <Skeleton className="h-44 rounded-3xl" />
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-2xl" />)}
          </div>
        )}
      </div>
      <Button size="xl" disabled={!selected} onClick={next}>
        {idx + 1 >= words.length ? "결과 보기" : "다음"}
      </Button>
    </div>
  );
}
