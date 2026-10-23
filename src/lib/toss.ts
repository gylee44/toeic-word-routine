import { ANONYMOUS, loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { logError, logInfo } from "@/lib/logger";

/**
 * 토스페이먼츠 결제창. api.ts에서만 사용한다.
 * Client 키만 쓴다. Secret 키는 승인 Edge Function(payments-confirm)에만 있다.
 */
const clientKey = import.meta.env["VITE_TOSS_CLIENT_KEY"] as string | undefined;

/** 테스트 키면 실제로 청구되지 않는다. 화면에 테스트 결제 안내를 띄울 때 쓴다. */
export const isTossTestMode = !clientKey || clientKey.startsWith("test_");

export interface TossOrder {
  orderId: string;
  amount: number;
  orderName: string;
}

/**
 * 카드 결제창을 연다. 결제를 마치면 토스가 /payments/success, 실패·취소하면 /payments/fail로 이동시킨다.
 * 구매자를 토스에 식별시킬 필요가 없어(브랜드페이·자동결제 미사용) customerKey는 비회원(ANONYMOUS)으로 둔다.
 */
export async function requestCardPayment(order: TossOrder): Promise<void> {
  if (!clientKey) {
    logError("toss", "client_key_missing", new Error("VITE_TOSS_CLIENT_KEY 환경변수 없음(Amplify 환경변수 확인)"), { orderId: order.orderId });
    throw new Error("결제 설정이 없어요. 잠시 후 다시 시도해 주세요.");
  }
  const loadStart = Date.now();
  let toss: Awaited<ReturnType<typeof loadTossPayments>>;
  try {
    toss = await loadTossPayments(clientKey);
  } catch (e) {
    // SDK 스크립트(js.tosspayments.com) 로드 실패: 네트워크, 광고 차단, CSP 등
    logError("toss", "sdk_load_failed", e, { orderId: order.orderId, durationMs: Date.now() - loadStart });
    throw e;
  }
  const payment = toss.payment({ customerKey: ANONYMOUS });
  logInfo("toss", "payment_window_open", {
    orderId: order.orderId,
    amount: order.amount,
    keyMode: isTossTestMode ? "test" : "live",
    sdkLoadMs: Date.now() - loadStart,
  });
  await payment.requestPayment({
    method: "CARD",
    amount: { currency: "KRW", value: order.amount },
    orderId: order.orderId,
    orderName: order.orderName,
    successUrl: `${window.location.origin}/payments/success`,
    failUrl: `${window.location.origin}/payments/fail`,
  });
}
