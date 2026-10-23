import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logWarn } from "@/lib/logger";

/** 토스 결제창이 실패·취소 시 돌려보내는 페이지. 결제가 일어나지 않았으므로 DB는 바꾸지 않는다. */
export const Route = createFileRoute("/_authenticated/payments/fail")({
  head: () => ({ meta: [{ title: "결제 실패 | 단어루틴" }] }),
  validateSearch: (s: Record<string, unknown>): { code?: string | undefined; message?: string | undefined; orderId?: string | undefined } => ({
    code: typeof s["code"] === "string" ? s["code"] : undefined,
    message: typeof s["message"] === "string" ? s["message"] : undefined,
    orderId: typeof s["orderId"] === "string" ? s["orderId"] : undefined,
  }),
  component: PaymentFail,
});

/**
 * 토스 오류 코드 → 안내 문구. URL의 message는 누구나 바꿔 링크를 만들 수 있어 그대로 보여주지 않는다.
 */
const FAIL_MESSAGES: Record<string, { title: string; description: string }> = {
  PAY_PROCESS_CANCELED: { title: "결제를 취소했어요", description: "결제가 진행되지 않았어요. 언제든 다시 결제할 수 있어요." },
  USER_CANCEL: { title: "결제를 취소했어요", description: "결제가 진행되지 않았어요. 언제든 다시 결제할 수 있어요." },
  PAY_PROCESS_ABORTED: { title: "결제가 중단됐어요", description: "결제가 진행되지 않았어요. 다시 시도해 주세요." },
  REJECT_CARD_COMPANY: { title: "카드 결제가 거절됐어요", description: "카드 정보나 한도를 확인하거나 다른 카드로 다시 시도해 주세요." },
  INVALID_CARD_EXPIRATION: { title: "카드 유효기간이 올바르지 않아요", description: "카드 정보를 확인하고 다시 시도해 주세요." },
  EXCEED_MAX_AMOUNT: { title: "결제 한도를 넘었어요", description: "다른 카드로 다시 시도해 주세요." },
};
const DEFAULT_MESSAGE = { title: "결제에 실패했어요", description: "결제가 진행되지 않았어요. 잠시 후 다시 시도해 주세요." };

function PaymentFail() {
  const { code, message, orderId } = Route.useSearch();
  // 화면에는 안내 문구만 보이므로, 토스가 준 원인(code·message)은 로그로 남긴다
  useEffect(() => {
    logWarn("toss", "payment_fail_page", { code, message, orderId });
  }, [code, message, orderId]);
  const { title, description } = (code && FAIL_MESSAGES[code]) || DEFAULT_MESSAGE;

  return (
    <div role="alert" className="mx-auto flex min-h-[60dvh] max-w-[440px] flex-col items-center justify-center py-12 text-center">
      <XCircle className="h-12 w-12 text-muted-foreground" aria-hidden />
      <h1 className="mt-4 text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-[15px] text-muted-foreground">{description}</p>
      {code && <p className="mt-1 text-xs text-muted-foreground">오류 코드: {code.slice(0, 60)}</p>}
      <div className="mt-8 grid w-full gap-2">
        <Button asChild size="xl"><Link to="/pro">다시 결제하기</Link></Button>
        <Button asChild size="xl" variant="outline"><Link to="/more">더보기로</Link></Button>
      </div>
    </div>
  );
}
