import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/PageHeader";
import { useErrorToast } from "@/components/useErrorToast";
import { getDays, getProfile } from "@/lib/api";
import { TIERS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/days/")({
  head: () => ({ meta: [{ title: "Day별 학습 | 단어루틴" }, { name: "description", content: "점수 구간별 Day 단어장" }] }),
  component: Days,
});

function Days() {
  const days = useQuery({ queryKey: ["days"], queryFn: getDays });
  const profile = useQuery({ queryKey: ["profile"], queryFn: getProfile });
  useErrorToast(days.error, days.refetch);
  const start = profile.data?.startTier;

  return (
    <div>
      <PageHeader title="Day" />
      {!days.data ? (
        <div className="grid gap-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      ) : (
        <div className="grid gap-6">
          {TIERS.map((tier) => (
            <section key={tier} className={cn("rounded-3xl p-4", tier === start ? "bg-accent" : "")}>
              <h2 className="mb-3 flex items-center gap-2 font-semibold">
                {tier}점 구간
                {tier === start && <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">내 시작 구간</span>}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {days.data.filter((d) => d.tier === tier).map((d) => (
                  <Link key={d.dayNo} to="/days/$dayNo" params={{ dayNo: String(d.dayNo) }} className="rounded-2xl border bg-card p-4 shadow-card">
                    <p className="font-bold">Day {d.dayNo}</p>
                    <p className="mt-2 text-sm text-muted-foreground">학습 {d.learned}/{d.total}</p>
                    <p className="text-sm text-muted-foreground">정답률 {d.accuracy === null ? "-" : `${d.accuracy}%`}</p>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
