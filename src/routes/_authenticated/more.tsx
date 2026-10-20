import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { errorMessage } from "@/components/useErrorToast";
import { getProfile, saveOnboarding, signOut } from "@/lib/api";
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

  return (
    <div className="grid gap-4">
      <PageHeader title="더보기" />
      <section className="rounded-3xl border bg-card p-5 shadow-card">
        <GoalPicker target={target} goal={goal} setTarget={setTarget} setGoal={setGoal} />
        <Button size="lg" className="mt-5 w-full" disabled={saving} onClick={save}>저장</Button>
      </section>
      <Link to="/licenses" className="flex min-h-14 items-center rounded-2xl bg-muted px-5 font-medium">
        <span className="flex-1">라이선스 및 출처</span><ChevronRight className="h-5 w-5 text-muted-foreground" aria-hidden />
      </Link>
      <Button size="lg" variant="outline" onClick={logout}>로그아웃</Button>
      <p className="pt-2 text-center text-xs text-muted-foreground">TOEIC은 ETS의 등록상표이며, 본 서비스는 ETS와 무관합니다.</p>
    </div>
  );
}
