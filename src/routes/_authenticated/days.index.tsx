import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TickBar } from "@/components/ProgressBar";
import { useErrorToast } from "@/components/useErrorToast";
import { getDays, getProfile } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/days/")({
  head: () => ({ meta: [{ title: "Day별 학습 | 단어루틴" }, { name: "description", content: "Day별 단어장" }] }),
  component: Days,
});

function Days() {
  const days = useQuery({ queryKey: ["days"], queryFn: getDays });
  const profile = useQuery({ queryKey: ["profile"], queryFn: getProfile });
  useErrorToast(days.error, days.refetch);

  const list = days.data ?? [];
  const doneCount = list.filter((d) => d.learned >= d.total).length;
  const current = list.find((d) => d.learned < d.total)?.dayNo;
  const target = profile.data?.targetScore;
  const targetLabel = target === 900 ? "900+" : target === 500 ? "500 이하" : target;

  return (
    <div className="pt-9 lg:pt-14">
      <h1 className="text-[26px] font-bold leading-[1.3] tracking-[-0.03em] lg:text-[34px]">Day</h1>
      <p className="mt-1.5 text-sm text-muted-foreground lg:mt-2 lg:text-base">Day 순서대로 이어서 학습해요.</p>

      <section className="mt-5 rounded-[18px] border bg-card px-[18px] pb-[18px] pt-4 lg:mt-8 lg:flex lg:flex-wrap lg:items-center lg:gap-x-12 lg:gap-y-6 lg:rounded-[20px] lg:px-7 lg:py-6">
        <div className="flex items-center justify-between gap-3 lg:contents">
          <div>
            <span className="block text-xs text-muted-foreground">내 목표 점수</span>
            <span className="mt-0.5 block font-serif text-4xl font-semibold leading-[1.1] tracking-tight lg:text-[44px]">
              {targetLabel ?? "-"}<span className="ml-0.5 font-sans text-[15px] font-medium lg:ml-1 lg:text-base">{target === 500 ? "" : "점"}</span>
            </span>
          </div>
          <Link to="/more" className="flex items-center gap-0.5 text-[13px] font-bold text-primary lg:order-last lg:text-sm">
            목표 바꾸기<ChevronRight className="h-4 w-4 lg:h-[18px] lg:w-[18px]" aria-hidden />
          </Link>
        </div>
        <p className="mt-2.5 text-[13px] leading-normal text-muted-foreground lg:mt-0 lg:min-w-[260px] lg:flex-1 lg:text-sm lg:leading-relaxed">
          목표 점수에 맞는 난이도의 단어로 Day가 구성돼요.<span className="hidden lg:inline"><br />점수를 바꾸면 단어 난이도가 함께 바뀌어요.</span>
        </p>
        <div className="mt-3.5 lg:mt-0 lg:min-w-[240px] lg:max-w-[320px] lg:flex-1">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-muted-foreground">전체 진행</span>
            <span className="font-bold">{doneCount} / {list.length} Day 완료</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={doneCount}
            aria-valuemin={0}
            aria-valuemax={list.length}
            aria-label="전체 Day 진행률"
            className="mt-2 h-[5px] overflow-hidden rounded-full bg-border lg:h-1.5"
          >
            <div className="h-full bg-primary" style={{ width: list.length ? `${(doneCount / list.length) * 100}%` : 0 }} />
          </div>
        </div>
      </section>

      <div className="mt-6 flex items-baseline justify-between lg:mt-10">
        <h2 className="px-0.5 text-sm font-bold lg:text-lg">전체 Day</h2>
        {list[0] && <span className="text-xs text-muted-foreground lg:text-[13px]">Day마다 단어 {list[0].total}개</span>}
      </div>

      {!days.data ? (
        <div className="mt-2.5 grid grid-cols-2 gap-2.5 lg:mt-4 lg:grid-cols-[repeat(auto-fill,minmax(190px,1fr))] lg:gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-[112px] rounded-2xl lg:h-[140px]" />)}
        </div>
      ) : (
        <div className="mt-2.5 grid grid-cols-2 gap-2.5 lg:mt-4 lg:grid-cols-[repeat(auto-fill,minmax(190px,1fr))] lg:gap-4">
          {list.map((d) => {
            const done = d.learned >= d.total;
            const isCurrent = d.dayNo === current;
            return (
              <Link
                key={d.dayNo}
                to="/days/$dayNo"
                params={{ dayNo: String(d.dayNo) }}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "rounded-2xl bg-card p-4 pb-[15px] lg:p-5 lg:pb-[22px]",
                  isCurrent ? "border-2 border-primary p-[15px] pb-3.5 lg:p-[19px] lg:pb-[21px]" : "border",
                )}
              >
                <span className="flex items-center justify-between">
                  <span className="text-[17px] font-bold tracking-tight lg:text-[19px]">Day {d.dayNo}</span>
                  {done && (
                    <span role="img" aria-label="완료" className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground lg:h-[22px] lg:w-[22px]">
                      <Check className="h-3 w-3" strokeWidth={3.5} aria-hidden />
                    </span>
                  )}
                  {isCurrent && <span className="rounded-md bg-accent px-1.5 py-0.5 text-[11px] font-bold text-primary lg:px-2 lg:text-xs">{d.learned > 0 ? "진행 중" : "다음 학습"}</span>}
                </span>
                <TickBar thin className="mt-2.5 lg:mt-3.5" value={d.learned} max={d.total} segments={d.total} label={`Day ${d.dayNo} 진행률`} />
                <span className="mt-2.5 block text-[13px] text-muted-foreground lg:mt-3.5 lg:text-sm">학습 {d.learned}/{d.total}</span>
                <span className="mt-px block text-[13px] text-muted-foreground lg:mt-0.5 lg:text-sm">정답률 {d.accuracy === null ? "-" : `${d.accuracy}%`}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
