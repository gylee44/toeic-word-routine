import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
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

  const face = "backface-hidden absolute inset-0 rounded-[22px] border border-input bg-card lg:rounded-[26px]";
  return (
    <div className="relative w-full pb-5 lg:pb-6">
      {/* 쌓인 카드 장식 */}
      <div aria-hidden className="absolute inset-x-5 bottom-0 top-5 rounded-[22px] border bg-muted lg:inset-x-10 lg:top-6 lg:rounded-[26px]" />
      <div aria-hidden className="absolute inset-x-2.5 bottom-2.5 top-2.5 rounded-[22px] border bg-muted/60 lg:inset-x-5 lg:bottom-3 lg:top-3 lg:rounded-[26px]" />
      <button
        type="button"
        onClick={onFlip}
        aria-label={flipped ? "카드 앞면 보기" : "카드 뒤집어 뜻 보기"}
        className="perspective relative block h-[min(400px,52dvh)] w-full rounded-[22px] text-left lg:h-[372px] lg:rounded-[26px]"
      >
        <div className={cn("preserve-3d relative h-full w-full transition-transform duration-500", flipped && "rotate-y-180")}>
          <div className={cn(face, "flex flex-col items-stretch justify-between p-6 lg:p-10")}>
            <span className="self-start rounded-[7px] bg-accent px-2.5 py-1 text-[13px] font-medium text-primary">{POS_KO[word.pos]}</span>
            <p className="text-center font-serif text-[clamp(40px,14vw,58px)] font-semibold leading-[1.05] tracking-[-0.02em]">{word.headword}</p>
            <p className="flex items-center justify-center gap-1.5 text-[13px] text-muted-foreground lg:hidden">
              <RefreshCw className="h-4 w-4" strokeWidth={1.75} aria-hidden />탭하거나 스페이스바로 뒤집기
            </p>
            <span className="hidden lg:block" />
          </div>
          <div className={cn(face, "rotate-y-180 flex flex-col justify-center gap-4 p-6 lg:flex-row lg:items-center lg:gap-10 lg:p-11")}>
            <div className="lg:w-[260px] lg:shrink-0">
              <p className="text-sm text-muted-foreground lg:hidden">{word.headword} · {POS_KO[word.pos]}</p>
              <span className="hidden rounded-[7px] bg-accent px-2.5 py-1 text-[13px] font-medium text-primary lg:inline-block">{POS_KO[word.pos]}</span>
              <p className="mt-[18px] hidden font-serif text-[56px] font-semibold leading-[1.05] tracking-[-0.02em] lg:block">{word.headword}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight lg:mt-3.5 lg:text-[26px]">{word.meaningKo}</p>
            </div>
            <div className="rounded-2xl bg-background p-4 lg:flex-1 lg:rounded-[18px] lg:px-[30px] lg:py-7">
              <p className="font-serif text-base font-semibold leading-relaxed lg:text-[23px] lg:leading-normal">{word.exampleEn}</p>
              <p className="mt-2 text-sm text-muted-foreground lg:mt-3.5 lg:text-[15px]">{word.exampleKo}</p>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}
