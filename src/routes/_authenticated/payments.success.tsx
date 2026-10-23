import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/components/useErrorToast";
import { confirmProPayment } from "@/lib/api";
import { formatKSTDate } from "@/lib/date";
import { logError, logInfo } from "@/lib/logger";
import { maskKey } from "@/lib/log-shared";

interface S {
  paymentKey?: string | undefined;
  orderId?: string | undefined;
  amount?: number | undefined;
}

/** 토스 결제창이 결제 후 돌려보내는 페이지. 쿼리 값은 서버(payments-confirm)가 주문과 대조해 승인한다. */
export const Route = createFileRoute("/_authenticated/payments/success")({
  head: () => ({ meta: [{ title: "결제 확인 | 단어루틴" }] }),
  validateSearch: (s: Record<string, unknown>): S => ({
    paymentKey: typeof s["paymentKey"] === "string" ? s["paymentKey"] : undefined,
    orderId: typeof s["orderId"] === "string" ? s["orderId"] : undefined,
    amount: Number.isInteger(Number(s["amount"])) ? Number(s["amount"]) : undefined,
  }),
  component: PaymentSuccess,
});

type State = { kind: "pending" } | { kind: "done"; proUntil: string | null } | { kind: "error"; message: string };

function PaymentSuccess() {
  const { paymentKey, orderId, amount } = Route.useSearch();
  const qc = useQueryClient();
  const [state, setState] = useState<State>({ kind: "pending" });
  const started = useRef(false);

  const confirm = useCallback(() => {
    if (!paymentKey || !orderId || amount === undefined) {
      logError("toss", "success_page_missing_params", new Error("성공 URL에 결제 정보 없음"), {
        hasPaymentKey: !!paymentKey,
        orderId,
        amount,
      });
      setState({ kind: "error", message: "결제 정보가 없어요. 처음부터 다시 결제해 주세요." });
      return;
    }
    setState({ kind: "pending" });
    logInfo("toss", "success_page_confirm", { orderId, amount, paymentKey: maskKey(paymentKey) });
    confirmProPayment({ paymentKey, orderId, amount })
      .then(({ proUntil }) => {
        setState({ kind: "done", proUntil });
        // 프로필(이용 기간)과 홈 요약(하루 상한)을 새로 불러온다
        void qc.invalidateQueries();
      })
      .catch((e) => setState({ kind: "error", message: errorMessage(e) }));
  }, [paymentKey, orderId, amount, qc]);

  useEffect(() => {
    // 개발 모드의 StrictMode에서 두 번 요청하지 않게 막는다 (서버도 같은 결제는 한 번만 반영한다)
    if (started.current) return;
    started.current = true;
    confirm();
  }, [confirm]);

  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-[440px] flex-col items-center justify-center py-12 text-center">
      {state.kind === "pending" && (
        <div role="status" className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
          <p className="text-sm">결제를 확인하고 있어요. 이 화면을 닫지 마세요.</p>
        </div>
      )}

      {state.kind === "done" && (
        <div role="status" className="flex w-full flex-col items-center">
          <CheckCircle2 className="h-12 w-12 text-success" aria-hidden />
          <h1 className="mt-4 text-2xl font-bold">Pro 이용권이 적용됐어요</h1>
          <p className="mt-2 text-[15px] text-muted-foreground">
            {state.proUntil ? `${formatKSTDate(state.proUntil)}까지 ` : ""}하루 새 단어를 제한 없이 학습할 수 있어요.
          </p>
          <div className="mt-8 grid w-full gap-2">
            <Button asChild size="xl"><Link to="/home">홈으로</Link></Button>
            <Button asChild size="xl" variant="outline"><Link to="/more">더보기</Link></Button>
          </div>
        </div>
      )}

      {state.kind === "error" && (
        <div role="alert" className="flex w-full flex-col items-center">
          <AlertCircle className="h-12 w-12 text-destructive" aria-hidden />
          <h1 className="mt-4 text-2xl font-bold">결제를 확인하지 못했어요</h1>
          <p className="mt-2 text-[15px] text-muted-foreground">{state.message}</p>
          <div className="mt-8 grid w-full gap-2">
            <Button size="xl" onClick={confirm}>다시 확인하기</Button>
            <Button asChild size="xl" variant="outline"><Link to="/pro">Pro 이용권 화면으로</Link></Button>
          </div>
        </div>
      )}
    </div>
  );
}
