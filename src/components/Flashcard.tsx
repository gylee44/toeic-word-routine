import { useEffect } from "react";
import { POS_KO } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Word } from "@/types";

export function Flashcard({ word, flipped, onFlip }: { word: Word; flipped: boolean; onFlip: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.code === "Space" && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault();
        onFlip();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onFlip]);

  return (
    <button
      type="button"
      onClick={onFlip}
      aria-label={flipped ? "카드 앞면 보기" : "카드 뒤집어 뜻 보기"}
      className="perspective block h-80 w-full rounded-3xl text-left"
    >
      <div className={cn("preserve-3d relative h-full w-full transition-transform duration-500", flipped && "rotate-y-180")}>
        <div className="backface-hidden absolute inset-0 flex flex-col items-center justify-center rounded-3xl border bg-card p-6 shadow-card">
          <span className="mb-3 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">{POS_KO[word.pos]}</span>
          <p className="text-4xl font-bold tracking-tight">{word.headword}</p>
          <p className="mt-8 text-sm text-muted-foreground">탭하거나 스페이스바로 뒤집기</p>
        </div>
        <div className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col justify-center gap-4 rounded-3xl border bg-card p-6 shadow-card">
          <div>
            <p className="text-sm text-muted-foreground">{word.headword} · {POS_KO[word.pos]}</p>
            <p className="mt-1 text-2xl font-bold">{word.meaningKo}</p>
          </div>
          <div className="rounded-2xl bg-muted p-4">
            <p className="font-medium leading-relaxed">{word.exampleEn}</p>
            <p className="mt-2 text-sm text-muted-foreground">{word.exampleKo}</p>
          </div>
        </div>
      </div>
    </button>
  );
}
