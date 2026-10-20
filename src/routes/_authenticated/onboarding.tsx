import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/components/useErrorToast";
import { saveOnboarding } from "@/lib/api";
import { DAILY_GOALS, START_TIER_BY_TARGET, TARGET_SCORES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "목표 설정 | 단어루틴" }, { name: "description", content: "목표 점수와 하루 학습량을 정해요." }] }),
  component: Onboarding,
});

export function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "min-h-12 rounded-xl border-2 px-4 font-semibold transition-colors",
        selected ? "border-primary bg-accent text-accent-foreground" : "border-border bg-card hover:border-primary/50",
      )}
    >
      {children}
    </button>
  );
}

export function GoalPicker({ target, goal, setTarget, setGoal }: { target: number | null; goal: number | null; setTarget: (n: number) => void; setGoal: (n: number) => void }) {
  return (
    <>
      <section>
        <h2 className="font-semibold">목표 점수</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {TARGET_SCORES.map((t) => <Chip key={t.value} selected={target === t.value} onClick={() => setTarget(t.value)}>{t.label}</Chip>)}
        </div>
        <p className="mt-3 min-h-6 text-sm font-medium text-primary" aria-live="polite">
          {target && `${START_TIER_BY_TARGET[target]}점 구간부터 시작해요`}
        </p>
      </section>
      <section className="mt-4">
        <h2 className="font-semibold">하루 학습량</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {DAILY_GOALS.map((g) => <Chip key={g} selected={goal === g} onClick={() => setGoal(g)}>{g}개</Chip>)}
        </div>
      </section>
    </>
  );
}

function Onboarding() {
  const navigate = useNavigate();
  const [target, setTarget] = useState<number | null>(null);
  const [goal, setGoal] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  async function start() {
    if (!target || !goal) return;
    setSaving(true);
    try {
      await saveOnboarding(target, goal);
      navigate({ to: "/home", replace: true });
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col py-8">
      <h1 className="text-2xl font-bold">목표를 알려주세요</h1>
      <p className="mt-1 text-muted-foreground">나에게 맞는 단어부터 골라드릴게요.</p>
      <div className="mt-8 flex-1">
        <GoalPicker target={target} goal={goal} setTarget={setTarget} setGoal={setGoal} />
      </div>
      <Button size="xl" disabled={!target || !goal || saving} onClick={start}>시작하기</Button>
    </div>
  );
}
