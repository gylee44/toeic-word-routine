import { cn } from "@/lib/utils";

/** 가는 선형 진행 바 (플래시카드·퀴즈 상단) */
export function ProgressBar({ value, max, className, label }: { value: number; max: number; className?: string; label?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className={cn("h-1 w-full overflow-hidden rounded-full bg-border", className)}
    >
      <div className="h-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

/** 칸으로 나눈 진행 바. total이 많으면 칸 수(segments)에 비례해 채운다. */
export function TickBar({ value, max, segments = 10, thin, className, label }: { value: number; max: number; segments?: number; thin?: boolean; className?: string; label?: string }) {
  const filled = max > 0 ? Math.min(segments, Math.round((Math.min(value, max) / max) * segments)) : 0;
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className={cn("grid", thin ? "gap-[3px]" : "gap-1 lg:gap-1.5", className)}
      style={{ gridTemplateColumns: `repeat(${segments}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: segments }, (_, i) => (
        <span
          key={i}
          className={cn(
            "transition-colors duration-300 motion-reduce:transition-none",
            thin ? "h-[5px] rounded-sm lg:h-1.5" : "h-2 rounded-[3px] lg:h-2.5 lg:rounded-[4px]",
            i < filled ? "bg-primary" : "bg-border",
          )}
          style={{ transitionDelay: `${i * 40}ms` }}
        />
      ))}
    </div>
  );
}
