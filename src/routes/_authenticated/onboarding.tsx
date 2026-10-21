import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/components/useErrorToast";
import { saveOnboarding, signOut } from "@/lib/api";
import { DAILY_GOALS, TARGET_SCORES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "목표 설정 | 단어루틴" }, { name: "description", content: "목표 점수와 하루 학습량을 정해요." }] }),
  component: Onboarding,
});

const GOAL_CAPTION: Record<number, string> = { 10: "가볍게 시작", 20: "적당한 분량", 30: "집중 학습" };

function Segment({ selected, onClick, className, children }: { selected: boolean; onClick: () => void; className?: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "rounded-[10px] text-[15px] transition-colors",
        selected ? "bg-primary font-bold text-primary-foreground" : "font-medium text-foreground hover:bg-muted",
        className,
      )}
    >
      {children}
    </button>
  );
}

interface GoalPickerProps {
  target: number | null;
  goal: number | null;
  setTarget: (n: number) => void;
  setGoal: (n: number) => void;
  /** cards: 온보딩(하루 학습량을 카드로) / compact: 더보기(막대 선택) */
  variant?: "cards" | "compact";
  className?: string;
}

export function GoalPicker({ target, goal, setTarget, setGoal, variant = "cards", className }: GoalPickerProps) {
  const compact = variant === "compact";
  const segmentHeight = compact ? "h-[42px] lg:h-[50px]" : "h-[46px] lg:h-[52px]";
  return (
    <div className={cn("grid gap-6", className)}>
      <section>
        <h2 className="text-[15px] font-bold lg:text-base">목표 점수</h2>
        <div role="group" aria-label="목표 점수" className="mt-3 grid grid-cols-5 gap-0.5 rounded-[14px] border border-input bg-background p-1 lg:mt-3.5">
          {TARGET_SCORES.map((t) => (
            <Segment key={t.value} selected={target === t.value} onClick={() => setTarget(t.value)} className={cn(segmentHeight, t.value === 500 && "text-sm")}>
              {t.label}
            </Segment>
          ))}
        </div>
        <p className="mt-3 flex min-h-5 items-center gap-2 text-sm font-medium text-primary lg:min-h-0 lg:empty:hidden" aria-live="polite">
          {target && (
            <>
              <Check className="h-4 w-4" aria-hidden />
              {target === 900 ? "900+" : target === 500 ? "500 이하" : target}점 목표에 맞는 단어로 {compact ? "학습해요" : "시작해요"}
            </>
          )}
        </p>
      </section>

      <section>
        <h2 className="text-[15px] font-bold lg:text-base">하루 학습량</h2>
        {compact ? (
          <div role="group" aria-label="하루 학습량" className="mt-3 grid grid-cols-3 gap-0.5 rounded-[14px] border border-input bg-background p-1">
            {DAILY_GOALS.map((g) => (
              <Segment key={g} selected={goal === g} onClick={() => setGoal(g)} className={segmentHeight}>{g}개</Segment>
            ))}
          </div>
        ) : (
          <div role="group" aria-label="하루 학습량" className="mt-3 grid grid-cols-3 gap-2.5 lg:mt-3.5 lg:gap-3">
            {DAILY_GOALS.map((g) => {
              const selected = goal === g;
              return (
                <button
                  key={g}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setGoal(g)}
                  className={cn(
                    "flex h-[104px] flex-col items-start justify-between rounded-2xl p-3.5 text-left transition-colors lg:h-28 lg:p-[18px]",
                    selected ? "border-2 border-primary bg-accent" : "border border-input bg-card p-[15px] hover:border-primary/50 lg:p-[19px]",
                  )}
                >
                  <span className="font-serif text-4xl font-semibold leading-none text-foreground lg:text-[38px]">
                    {g}<span className="ml-0.5 font-sans text-sm font-medium lg:text-[15px]">개</span>
                  </span>
                  <span className={cn("text-[13px] lg:text-sm", selected ? "font-bold text-primary" : "text-muted-foreground")}>{GOAL_CAPTION[g]}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Onboarding() {
  const navigate = useNavigate();
  const qc = useQueryClient();
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

  // 온보딩 전에는 다른 화면으로 갈 수 없으므로, 계정을 바꿀 수 있게 로그아웃을 둔다
  async function logout() {
    try {
      await qc.cancelQueries();
      qc.clear();
      await signOut();
      navigate({ to: "/login", search: { redirect: undefined }, replace: true });
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <div className="flex min-h-dvh flex-col py-7 lg:min-h-0 lg:flex-row lg:items-start lg:gap-20 lg:pb-20 lg:pt-24">
      {/* 왼쪽 안내 문구: 기준 너비 400px로 두고 늘어나지 않게 한다 (오른쪽 폼이 남는 공간을 차지) */}
      <div className="lg:flex-[0_1_400px]">
        <p className="text-[13px] font-medium text-muted-foreground lg:text-sm">가입 완료 · 마지막 단계</p>
        <h1 className="mt-2.5 text-[30px] font-bold leading-[1.3] tracking-[-0.03em] lg:mt-3 lg:text-[44px] lg:leading-[1.25]">
          목표를<br className="hidden lg:block" /> 알려주세요
        </h1>
        <p className="mt-2.5 text-[15px] text-muted-foreground lg:mt-4 lg:text-base lg:leading-relaxed">
          나에게 맞는 단어부터 골라드릴게요.<span className="hidden lg:inline"><br />언제든 더보기에서 바꿀 수 있어요.</span>
        </p>
      </div>
      <div className="mt-9 flex flex-1 flex-col lg:mt-0 lg:flex-[999_1_560px] lg:rounded-3xl lg:border lg:bg-card lg:p-10">
        <div className="flex-1 lg:flex-none">
          <GoalPicker target={target} goal={goal} setTarget={setTarget} setGoal={setGoal} className="gap-9 lg:gap-10" />
          <p className="mt-3 text-[13px] text-muted-foreground lg:hidden">언제든 더보기에서 바꿀 수 있어요.</p>
        </div>
        <Button size="xl" className="mt-6 lg:mt-10" disabled={!target || !goal || saving} onClick={start}>시작하기</Button>
        <Button type="button" variant="ghost" className="mt-2 self-center text-sm font-medium text-muted-foreground" onClick={logout}>
          다른 계정으로 로그인
        </Button>
      </div>
    </div>
  );
}
