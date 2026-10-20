import { CheckCircle2, XCircle } from "lucide-react";
import { POS_KO } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Word } from "@/types";

interface Props {
  word: Word;
  choices: Word[];
  selectedId: string | null;
  submitting: boolean;
  onSelect: (choiceId: string) => void;
}

export function QuizQuestion({ word, choices, selectedId, submitting, onSelect }: Props) {
  const answered = selectedId !== null;
  const isCorrect = selectedId === word.id;
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border bg-card px-6 py-10 text-center shadow-card">
        <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">{POS_KO[word.pos]}</span>
        <p className="mt-3 text-4xl font-bold tracking-tight">{word.headword}</p>
        <p className="mt-2 text-sm text-muted-foreground">알맞은 뜻을 고르세요</p>
      </div>
      <div className="grid gap-3" role="group" aria-label="보기">
        {choices.map((c, i) => {
          const correct = answered && c.id === word.id;
          const wrong = answered && c.id === selectedId && c.id !== word.id;
          return (
            <button
              key={c.id}
              type="button"
              disabled={answered || submitting}
              onClick={() => onSelect(c.id)}
              className={cn(
                "flex min-h-14 items-center gap-3 rounded-2xl border-2 bg-card px-4 py-3 text-left font-medium transition-colors disabled:cursor-default",
                !answered && "hover:border-primary hover:bg-accent",
                correct && "border-success bg-success-soft",
                wrong && "border-destructive bg-danger-soft",
                answered && !correct && !wrong && "opacity-60",
              )}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm">{i + 1}</span>
              <span className="flex-1">{c.meaningKo}</span>
              {correct && <CheckCircle2 className="h-5 w-5 text-success" aria-label="정답" />}
              {wrong && <XCircle className="h-5 w-5 text-destructive" aria-label="오답" />}
            </button>
          );
        })}
      </div>
      <div aria-live="polite" className="min-h-6 text-center font-semibold">
        {answered && (isCorrect ? <span className="text-success">정답이에요! 👏</span> : <span className="text-destructive">아쉬워요, 정답은 "{word.meaningKo}"</span>)}
      </div>
    </div>
  );
}
