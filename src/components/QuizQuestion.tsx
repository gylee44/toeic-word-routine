import { Check, X } from "lucide-react";
import { POS_KO } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { QuizChoice } from "@/lib/api";
import type { Word } from "@/types";

interface Props {
  word: Word;
  choices: QuizChoice[];
  selectedId: string | null;
  submitting: boolean;
  onSelect: (choiceId: string) => void;
}

/** 예문 안의 해당 단어를 강조한다 (활용형은 그대로 둔다) */
function HighlightedExample({ text, headword }: { text: string; headword: string }) {
  const i = text.toLowerCase().indexOf(headword.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span className="text-primary">{text.slice(i, i + headword.length)}</span>
      {text.slice(i + headword.length)}
    </>
  );
}

/** 정답 해설 본문. 높이를 미리 잡아 두는 자리 표시에도 같은 내용을 쓴다. */
function Feedback({ word, isCorrect }: { word: Word; isCorrect: boolean }) {
  return (
    <>
      <p className={cn("text-sm font-bold lg:text-[15px]", isCorrect ? "text-success" : "text-destructive")}>
        {isCorrect ? "정답이에요!" : `아쉬워요, 정답은 ‘${word.meaningKo}’이에요`}
      </p>
      <p className="mt-2 font-serif text-base font-semibold leading-normal lg:mt-2.5 lg:text-[19px]"><HighlightedExample text={word.exampleEn} headword={word.headword} /></p>
      <p className="mt-1 text-[13px] text-muted-foreground lg:text-sm">{word.exampleKo}</p>
    </>
  );
}

export function QuizQuestion({ word, choices, selectedId, submitting, onSelect }: Props) {
  const answered = selectedId !== null;
  const isCorrect = selectedId === word.id;
  return (
    <div className="lg:rounded-[22px] lg:border lg:bg-card lg:px-11 lg:pb-9 lg:pt-10">
      <div>
        <span className="inline-block rounded-[7px] bg-accent px-2.5 py-1 text-[13px] font-medium text-primary">{POS_KO[word.pos]}</span>
        <p className="mt-3 font-serif text-5xl font-semibold leading-[1.1] tracking-[-0.02em] lg:mt-3.5 lg:text-[64px] lg:leading-[1.05]">{word.headword}</p>
        <p className="mt-2.5 text-sm text-muted-foreground lg:mt-3 lg:text-[15px]">알맞은 뜻을 고르세요</p>
      </div>

      <div className="mt-[22px] grid gap-2.5 lg:mt-7 lg:grid-cols-2 lg:gap-3" role="group" aria-label="보기">
        {choices.map((c, i) => {
          const correct = answered && c.id === word.id;
          const wrong = answered && c.id === selectedId && c.id !== word.id;
          const idle = answered && !correct && !wrong;
          return (
            <button
              key={c.id}
              type="button"
              disabled={answered || submitting}
              onClick={() => onSelect(c.id)}
              className={cn(
                "flex h-[58px] items-center gap-3 rounded-[14px] border bg-card px-4 text-left text-base transition-colors disabled:cursor-default lg:h-16 lg:gap-3.5 lg:px-[18px] lg:text-[17px]",
                !answered && "font-medium hover:border-primary hover:bg-accent",
                correct && "border-2 border-success bg-success-soft font-bold",
                wrong && "border-2 border-destructive bg-danger-soft font-bold",
                idle && "font-medium text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-[13px] font-bold lg:h-7 lg:w-7 lg:text-sm",
                  correct && "bg-success text-success-foreground",
                  wrong && "bg-destructive text-destructive-foreground",
                  !correct && !wrong && "bg-muted text-muted-foreground",
                )}
              >
                {i + 1}
              </span>
              <span className="flex-1">{c.meaningKo}</span>
              {correct && <span className="flex items-center gap-1 text-[13px] font-medium text-success"><Check className="h-[18px] w-[18px]" strokeWidth={2.5} aria-hidden />정답</span>}
              {wrong && <span className="flex items-center gap-1 text-[13px] font-medium text-destructive"><X className="h-[18px] w-[18px]" strokeWidth={2.5} aria-hidden />내 선택</span>}
            </button>
          );
        })}
      </div>

      {/* 해설이 나와도 아래 버튼이 밀리지 않도록, 같은 내용을 보이지 않게 깔아 높이를 미리 잡는다 (오답 문구가 더 길어서 그쪽 기준) */}
      <div className="mt-4 grid lg:mt-5">
        <div aria-hidden className="invisible col-start-1 row-start-1 rounded-[14px] border border-transparent px-4 py-3.5 lg:border-0 lg:px-5 lg:py-[18px]">
          <Feedback word={word} isCorrect={false} />
        </div>
        <div
          aria-live="polite"
          className={cn(
            "col-start-1 row-start-1 rounded-[14px] border border-transparent px-4 py-3.5 lg:border-0 lg:px-5 lg:py-[18px]",
            answered && "border-border bg-card lg:bg-background",
          )}
        >
          {answered && <Feedback word={word} isCorrect={isCorrect} />}
        </div>
      </div>
    </div>
  );
}
