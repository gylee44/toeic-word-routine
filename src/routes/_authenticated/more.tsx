import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { errorMessage } from "@/components/useErrorToast";
import { getProfile, isProActive, saveOnboarding, signOut } from "@/lib/api";
import { formatKSTDate } from "@/lib/date";
import { GoalPicker } from "./onboarding";

export const Route = createFileRoute("/_authenticated/more")({
  head: () => ({ meta: [{ title: "더보기 | 단어루틴" }, { name: "description", content: "설정 및 정보" }] }),
  component: More,
});

function More() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const profile = useQuery({ queryKey: ["profile"], queryFn: getProfile });
  const [target, setTarget] = useState<number | null>(null);
  const [goal, setGoal] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (profile.data) { setTarget(profile.data.targetScore); setGoal(profile.data.dailyGoal); }
  }, [profile.data]);

  async function save() {
    if (!target || !goal) return;
    setSaving(true);
    try {
      await saveOnboarding(target, goal);
      await qc.invalidateQueries();
      toast.success("목표가 저장되었어요.");
    } catch (e) { toast.error(errorMessage(e)); } finally { setSaving(false); }
  }

  async function logout() {
    await qc.cancelQueries();
    qc.clear();
    await signOut();
    navigate({ to: "/login", search: { redirect: undefined }, replace: true });
  }

  const name = profile.data?.name ?? "";
  const proUntil = profile.data?.proUntil ?? null;
  // Pro 이용 상태 (이용 중이면 끝나는 날짜, 아니면 가격)
  const proStatus = isProActive(proUntil) && proUntil ? `${formatKSTDate(proUntil)}까지` : "1,000원 · 30일";
  return (
    <div>
      <PageHeader title="더보기" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_352px] lg:items-start lg:gap-6">
        <section className="order-2 rounded-[18px] border bg-card p-[18px] lg:order-1 lg:rounded-[22px] lg:p-9">
          <h2 className="hidden text-lg font-bold lg:block">학습 목표</h2>
          <GoalPicker target={target} goal={goal} setTarget={setTarget} setGoal={setGoal} variant="compact" className="lg:mt-7" />
          <div className="mt-[18px] lg:mt-8 lg:flex lg:justify-end">
            <Button size="lg" variant="outline" className="w-full border-primary text-primary hover:bg-accent lg:w-auto lg:px-8" disabled={saving} onClick={save}>
              변경 사항 저장
            </Button>
          </div>
        </section>

        <div className="order-1 grid gap-4 lg:order-2">
          <div className="flex items-center gap-3.5 lg:rounded-[22px] lg:border lg:bg-card lg:px-6 lg:py-[22px]">
            <span aria-hidden className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-[17px] font-bold text-primary lg:h-[52px] lg:w-[52px] lg:text-xl">{name.slice(0, 1)}</span>
            <span>
              <span className="block text-base font-bold lg:text-[17px]">{name}</span>
              <span className="mt-px block text-[13px] text-muted-foreground lg:text-sm">{profile.data?.email}</span>
            </span>
          </div>
          <Link to="/pro" className="hidden items-center justify-between rounded-[22px] border bg-card px-6 py-5 text-base font-medium lg:flex">
            <span>Pro 이용권<span className="mt-0.5 block text-sm font-normal text-muted-foreground">{proStatus}</span></span>
            <ChevronRight className="h-[18px] w-[18px] text-muted-foreground" aria-hidden />
          </Link>
          <Link to="/licenses" className="hidden items-center justify-between rounded-[22px] border bg-card px-6 py-5 text-base font-medium lg:flex">
            라이선스 및 출처<ChevronRight className="h-[18px] w-[18px] text-muted-foreground" aria-hidden />
          </Link>
          <Button type="button" size="xl" variant="outline" className="hidden text-destructive hover:text-destructive lg:inline-flex" onClick={logout}>로그아웃</Button>
        </div>
      </div>

      <div className="mt-4 border-t lg:hidden">
        <Link to="/pro" className="flex h-14 items-center justify-between border-b text-[15px] font-medium">
          <span>Pro 이용권</span>
          <span className="flex items-center gap-1 text-[13px] font-normal text-muted-foreground">{proStatus}<ChevronRight className="h-[18px] w-[18px]" aria-hidden /></span>
        </Link>
        <Link to="/licenses" className="flex h-14 items-center justify-between border-b text-[15px] font-medium">
          라이선스 및 출처<ChevronRight className="h-[18px] w-[18px] text-muted-foreground" aria-hidden />
        </Link>
        <button type="button" onClick={logout} className="flex h-14 w-full items-center border-b text-[15px] font-medium text-destructive">로그아웃</button>
      </div>
      <p className="mt-4 text-center text-xs leading-normal text-muted-foreground lg:mt-14">TOEIC은 ETS의 등록상표이며, 본 서비스는 ETS와 무관합니다.</p>
    </div>
  );
}
