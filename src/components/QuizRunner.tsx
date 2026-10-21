import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExitButton } from "@/components/LearnSession";
import { ProgressBar } from "@/components/ProgressBar";
import { QuizQuestion } from "@/components/QuizQuestion";
import { errorMessage } from "@/components/useErrorToast";
import { getQuizChoices, recordQuizAnswer, type QuizChoice } from "@/lib/api";
import { clearQuizProgress, getQuizProgress, setQuizProgress, setQuizResult } from "@/lib/session";
import type { StudyMode, Word } from "@/types";

export function QuizRunner({ words, mode, title }: { words: Word[]; mode: StudyMode; title: string }) {
  const navigate = useNavigate();
  const ids = words.map((w) => w.id);
  // 풀던 기록이 있으면 푼 개수만큼 건너뛰고 이어서 푼다
  const [saved] = useState(() => getQuizProgress(mode, ids)?.results ?? []);
  const [idx, setIdx] = useState(saved.length);
  const [choices, setChoices] = useState<QuizChoice[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const lock = useRef(false);
  const results = useRef<{ id: string; ok: boolean }[]>(saved);
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
      setQuizProgress({ mode, ids, results: results.current });
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
      clearQuizProgress();
      navigate({ to: "/quiz/result", replace: true });
      return;
    }
    setSelected(null);
    setIdx((i) => i + 1);
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col py-4 lg:min-h-0 lg:max-w-[880px] lg:pb-16 lg:pt-12">
      <div className="flex items-center gap-3 lg:gap-4">
        <ExitButton onExit={() => navigate({ to: "/home" })} />
        <span className="hidden shrink-0 text-sm font-medium text-muted-foreground lg:block">{title}</span>
        <ProgressBar value={idx + (selected ? 1 : 0)} max={words.length} label="퀴즈 진행률" className="flex-1" />
        <span className="shrink-0 text-sm font-bold tabular-nums">{idx + 1} / {words.length}</span>
      </div>
      <p className="mt-2.5 text-center text-[13px] text-muted-foreground lg:hidden">{title}</p>
      <div className="flex-1 py-5 lg:flex-none lg:pb-6 lg:pt-7">
        {choices ? (
          <QuizQuestion word={word} choices={choices} selectedId={selected} submitting={submitting} onSelect={select} />
        ) : (
          <div className="grid gap-3">
            <Skeleton className="h-36 rounded-[18px]" />
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[58px] rounded-[14px]" />)}
          </div>
        )}
      </div>
      {/* 모바일에서는 화면 아래에 고정해 해설 길이와 상관없이 같은 자리에서 누를 수 있다 */}
      <div className="sticky bottom-0 z-10 -mx-5 bg-background px-5 pb-4 pt-3 lg:static lg:mx-0 lg:flex lg:justify-end lg:bg-transparent lg:p-0">
        <Button size="xl" className="w-full lg:w-auto lg:px-10" disabled={!selected} onClick={next}>
          {idx + 1 >= words.length ? "결과 보기" : "다음"}
        </Button>
      </div>
    </div>
  );
}
