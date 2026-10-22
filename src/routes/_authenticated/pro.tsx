import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Check, ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { errorMessage, useErrorToast } from "@/components/useErrorToast";
import { getProfile, isProActive, startProPayment } from "@/lib/api";
import { formatKSTDate } from "@/lib/date";
import { isTossTestMode } from "@/lib/toss";

export const Route = createFileRoute("/_authenticated/pro")({
  head: () => ({ meta: [{ title: "Pro 이용권 | 단어루틴" }, { name: "description", content: "하루 새 단어 학습 제한을 없애는 Pro 이용권" }] }),
  component: Pro,
});

const BENEFITS = ["하루 새 단어 40개 제한 없이 학습", "복습·퀴즈·오답노트는 지금처럼 그대로", "자동 결제 없음. 기간이 끝나면 무료로 돌아가요"];

function Pro() {
  const profile = useQuery({ queryKey: ["profile"], queryFn: getProfile });
  useErrorToast(profile.error, profile.refetch);
  const [paying, setPaying] = useState(false);

  async function pay() {
    setPaying(true);
    try {
      // 결제창으로 이동하면 이 페이지를 떠난다. 결제창을 닫으면 그대로 돌아온다
      await startProPayment();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setPaying(false);
    }
  }

  const proUntil = profile.data?.proUntil ?? null;
  const active = isProActive(proUntil);

  return (
    <div className="mx-auto max-w-[560px]">
      <Button asChild variant="ghost" size="icon" className="mt-4 -ml-2 lg:mt-8" aria-label="더보기로 돌아가기">
        <Link to="/more"><ChevronLeft className="h-6 w-6" /></Link>
      </Button>
      <PageHeader title="Pro 이용권" />

      <section className="rounded-[18px] border bg-card p-[18px] lg:rounded-[22px] lg:p-9" aria-busy={profile.isPending}>
        <p className="text-sm font-semibold text-primary">30일 이용권</p>
        <p className="mt-1 flex items-baseline gap-1">
          <span className="font-serif text-[40px] font-semibold leading-none tabular-nums lg:text-5xl">1,000</span>
          <span className="text-base font-medium">원</span>
        </p>

        <ul className="mt-6 grid gap-3">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-start gap-2.5 break-keep text-[15px] leading-normal">
              <Check className="mt-0.5 h-[18px] w-[18px] shrink-0 text-primary" aria-hidden />
              {b}
            </li>
          ))}
        </ul>

        <div className="mt-6 break-keep rounded-xl bg-muted px-4 py-3 text-sm" role="status">
          {profile.isPending ? (
            <span className="text-muted-foreground">이용 상태를 확인하고 있어요...</span>
          ) : profile.isError ? (
            <span className="text-muted-foreground">이용 상태를 불러오지 못했어요.</span>
          ) : active && proUntil ? (
            <span><span className="font-semibold">Pro 이용 중</span> · {formatKSTDate(proUntil)}까지</span>
          ) : (
            <span className="text-muted-foreground">지금은 무료로 이용 중이에요. 하루 새 단어는 40개까지예요.</span>
          )}
        </div>

        <Button size="xl" className="mt-6 w-full" disabled={paying || profile.isPending} onClick={pay}>
          {paying && <Loader2 className="animate-spin" aria-hidden />}
          {active ? "30일 연장하기 · 1,000원" : "1,000원 결제하기"}
        </Button>
        {active && <p className="mt-2 text-center text-[13px] text-muted-foreground">남은 기간 뒤로 30일이 이어져요.</p>}
        {isTossTestMode && (
          <p className="mt-3 text-center text-[13px] text-muted-foreground">테스트 결제예요. 실제로 돈이 나가지 않아요.</p>
        )}
      </section>

      <p className="mt-4 text-center text-xs leading-normal text-muted-foreground">결제는 토스페이먼츠로 안전하게 처리돼요.</p>
    </div>
  );
}
