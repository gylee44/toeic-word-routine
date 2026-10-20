import { cn } from "@/lib/utils";

export function ProgressBar({ value, max, className, label }: { value: number; max: number; className?: string; label?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className={cn("h-2.5 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}
