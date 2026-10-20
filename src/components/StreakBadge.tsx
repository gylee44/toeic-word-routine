import { Flame } from "lucide-react";

export function StreakBadge({ days }: { days: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-streak-soft px-3 py-1.5 text-sm font-semibold text-foreground">
      <Flame className="h-4 w-4 text-streak" aria-hidden />
      {days > 0 ? `${days}일 연속` : "오늘 시작해요"}
    </span>
  );
}
