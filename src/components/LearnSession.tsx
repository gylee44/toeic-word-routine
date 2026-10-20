import { useCallback, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { X, PartyPopper } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Flashcard } from "@/components/Flashcard";
import { ProgressBar } from "@/components/ProgressBar";
import { errorMessage } from "@/components/useErrorToast";
import { recordFlashcard } from "@/lib/api";
import { setQuizQueue } from "@/lib/session";
import type { StudyMode, Word } from "@/types";

export function ExitButton({ onExit }: { onExit: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="학습 종료"><X className="h-6 w-6" /></Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-[360px] rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>학습을 종료할까요?</AlertDialogTitle>
          <AlertDialogDescription>지금까지 학습한 내용은 저장돼요.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>계속하기</AlertDialogCancel>
          <AlertDialogAction onClick={onExit}>종료</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function LearnSession({ words, mode, title }: { words: Word[]; mode: StudyMode; title?: string }) {
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [saving, setSaving] = useState(false);
  const done = idx >= words.length;
  const onFlip = useCallback(() => setFlipped((f) => !f), []);

  async function answer(known: boolean) {
    if (saving) return;
    setSaving(true);
    try {
      await recordFlashcard(words[idx].id, known, mode);
      setFlipped(false);
      setIdx((i) => i + 1);
    } catch (e) {
      toast.error(errorMessage(e), { action: { label: "다시 시도", onClick: () => answer(known) } });
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="flex min-h-dvh flex-col py-6">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <PartyPopper className="h-14 w-14 text-primary" aria-hidden />
          <h1 className="mt-4 text-2xl font-bold">{words.length}개 단어를 모두 봤어요!</h1>
          <p className="mt-2 text-muted-foreground">퀴즈로 기억을 단단하게 다져볼까요?</p>
        </div>
        <div className="grid gap-3">
          <Button size="xl" onClick={() => { setQuizQueue(words.map((w) => w.id)); navigate({ to: "/quiz", search: { mode } }); }}>
            퀴즈 시작
          </Button>
          <Button size="xl" variant="ghost" onClick={() => navigate({ to: "/home" })}>홈으로</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col py-4">
      <div className="flex items-center gap-3">
        <ExitButton onExit={() => navigate({ to: "/home" })} />
        <ProgressBar value={idx} max={words.length} label="학습 진행률" />
        <span className="shrink-0 text-sm font-semibold tabular-nums">{idx + 1} / {words.length}</span>
      </div>
      {title && <p className="mt-3 text-center text-sm font-medium text-muted-foreground">{title}</p>}
      <div className="flex flex-1 items-center py-6">
        <Flashcard word={words[idx]} flipped={flipped} onFlip={onFlip} />
      </div>
      <div className="grid grid-cols-2 gap-3 pb-2">
        <Button size="xl" variant="secondary" disabled={saving} onClick={() => answer(false)}>모르겠어요</Button>
        <Button size="xl" disabled={saving} onClick={() => answer(true)}>알아요</Button>
      </div>
    </div>
  );
}
