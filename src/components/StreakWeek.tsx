import { Check } from "lucide-react";
import { addDays, todayKST } from "@/lib/date";
import { cn } from "@/lib/utils";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

/** 이번 주(월~일) 학습 기록. 오늘은 학습 여부와 관계없이 강조한다. */
export function StreakWeek({ days, studiedDates }: { days: number; studiedDates: string[] }) {
  const today = todayKST();
  const dow = new Date(`${today}T00:00:00Z`).getUTCDay(); // 0=일
  const monday = addDays(today, -((dow + 6) % 7));
  const week = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const studied = new Set(studiedDates);
  return (
    // 보조 정보라 흰 바탕 없이 테두리만 둔다 (학습·복습 카드보다 시각 무게를 낮춘다)
    <section className="card-surface bg-transparent px-5 pb-5 pt-4 lg:px-6 lg:pb-6 lg:pt-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[15px] font-bold lg:text-base">{days > 0 ? `${days}일 연속 학습 중` : "이번 주 학습 기록"}</h2>
        {days > 0 && <span className="text-[13px] text-muted-foreground">이번 주</span>}
      </div>
      <ul aria-label={`이번 주 학습 기록, ${week.filter((d) => studied.has(d)).length}일 학습`} className="mt-3.5 grid grid-cols-7 text-center lg:mt-[18px]">
        {week.map((date) => {
          const isToday = date === today;
          const isFuture = date > today;
          const done = studied.has(date);
          const label = DAY_LABELS[new Date(`${date}T00:00:00Z`).getUTCDay()];
          return (
            <li key={date} className="flex flex-col items-center gap-1.5 lg:gap-2">
              <span className={cn("text-xs", isToday ? "font-bold text-foreground" : "text-muted-foreground")}>{isToday ? "오늘" : label}</span>
              <span
                role="img"
                aria-label={`${label}요일 ${done ? "학습 완료" : isToday ? "학습 전" : isFuture ? "예정" : "학습 안 함"}`}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full lg:h-[30px] lg:w-[30px]",
                  done && "bg-primary text-primary-foreground",
                  !done && isToday && "border-2 border-primary bg-accent",
                  !done && !isToday && !isFuture && "border border-input",
                  isFuture && "border border-dashed border-input",
                )}
              >
                {done && <Check className="h-3.5 w-3.5" strokeWidth={3.5} aria-hidden />}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
