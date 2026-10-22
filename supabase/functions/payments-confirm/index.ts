// 토스페이먼츠 결제 승인 (PRD FR-12)
// 결제 성공 페이지가 보낸 paymentKey, orderId, amount를 주문과 대조한 뒤 Secret 키로 토스 승인 API를 호출하고,
// 승인되면 complete_payment RPC로 주문을 paid로 바꾸고 Pro 기간을 연장한다.
//
// - 배포: verify_jwt = false. 새 API 키(sb_publishable_) 환경이라 게이트웨이 대신 함수 안에서 사용자 토큰을 검증한다.
// - Secret 키(TOSS_SECRET_KEY)는 Edge Function Secrets에만 둔다. 응답과 로그에 키·헤더·토스 원문 응답을 남기지 않는다.
// - 주문 조회는 사용자 토큰 클라이언트로 한다(RLS: 본인 주문만). 서버 키로는 complete_payment, fail_payment만 실행한다.
import { createClient } from "npm:@supabase/supabase-js@2.118.0";

const TOSS_API = "https://api.tosspayments.com/v1/payments";
const ORDER_ID_RE = /^[A-Za-z0-9_-]{6,64}$/;
// 결과를 알 수 없는 토스 오류. 주문을 pending으로 두고 다시 시도하게 한다(같은 Idempotency-Key라 중복 승인되지 않음)
const RETRYABLE_CODES = new Set([
  "PROVIDER_ERROR",
  "FAILED_INTERNAL_SYSTEM_PROCESSING",
  "FAILED_PAYMENT_INTERNAL_SYSTEM_PROCESSING",
  "UNKNOWN_PAYMENT_ERROR",
]);

// 쿠키가 아닌 Authorization 헤더의 사용자 토큰으로 인증하므로 모든 출처를 허용해도 다른 사이트가 대신 승인할 수 없다
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const fail = (status: number, code: string, message: string) => json(status, { code, message });

const RETRY_MESSAGE = "결제 확인이 늦어지고 있어요. 잠시 후 다시 시도해 주세요.";
const CONFIG_MESSAGE = "결제 설정에 문제가 있어요. 잠시 후 다시 시도해 주세요.";

/** Supabase가 넣어 주는 키. 새 키(JSON 사전)를 먼저 쓰고 없으면 레거시 키를 쓴다. */
function supabaseKey(newName: string, legacyName: string): string | undefined {
  const keys = Deno.env.get(newName);
  if (keys) {
    try {
      const key = JSON.parse(keys)["default"];
      if (typeof key === "string" && key) return key;
    } catch {
      // 형식이 다르면 레거시 키를 쓴다
    }
  }
  return Deno.env.get(legacyName);
}

interface TossPayment {
  paymentKey: string;
  orderId: string;
  status: string;
  totalAmount: number;
  method?: string;
  approvedAt?: string;
}

/** 토스 API 호출. 네트워크 오류·시간 초과는 null(결과 모름)을 돌려준다. */
async function toss(path: string, secretKey: string, init: { method: string; body?: unknown; idempotencyKey?: string }) {
  const headers: Record<string, string> = {
    Authorization: `Basic ${btoa(`${secretKey}:`)}`,
    "Content-Type": "application/json",
  };
  if (init.idempotencyKey) headers["Idempotency-Key"] = init.idempotencyKey;
  try {
    const res = await fetch(`${TOSS_API}${path}`, {
      method: init.method,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: AbortSignal.timeout(20_000),
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return fail(405, "METHOD_NOT_ALLOWED", "허용하지 않는 요청이에요.");

  const url = Deno.env.get("SUPABASE_URL");
  const publishableKey = supabaseKey("SUPABASE_PUBLISHABLE_KEYS", "SUPABASE_ANON_KEY");
  const serverKey = supabaseKey("SUPABASE_SECRET_KEYS", "SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !publishableKey || !serverKey) {
    console.error("config_missing_supabase");
    return fail(500, "CONFIG_ERROR", CONFIG_MESSAGE);
  }

  // 1. 로그인 사용자 확인
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return fail(401, "UNAUTHORIZED", "로그인이 필요해요.");
  const userClient = createClient(url, publishableKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser(token);
  if (userError || !userData.user) return fail(401, "UNAUTHORIZED", "로그인이 필요해요.");

  // 2. 요청 값 검증
  const body = await req.json().catch(() => null);
  const paymentKey = body?.paymentKey;
  const orderId = body?.orderId;
  const amount = body?.amount;
  if (
    typeof paymentKey !== "string" || paymentKey.length < 1 || paymentKey.length > 200 ||
    typeof orderId !== "string" || !ORDER_ID_RE.test(orderId) ||
    !Number.isInteger(amount) || amount <= 0
  ) {
    return fail(400, "INVALID_REQUEST", "잘못된 결제 정보예요.");
  }

  // 3. 주문 대조 (RLS로 본인 주문만 조회된다)
  const { data: order, error: orderError } = await userClient
    .from("payment_orders")
    .select("order_id, amount, status, payment_key")
    .eq("order_id", orderId)
    .maybeSingle();
  if (orderError) {
    console.error("order_lookup_failed", orderError.code);
    return fail(500, "ORDER_LOOKUP_FAILED", "주문을 확인하지 못했어요. 다시 시도해 주세요.");
  }
  if (!order) return fail(404, "ORDER_NOT_FOUND", "주문을 찾을 수 없어요.");

  if (order.status === "paid") {
    if (order.payment_key !== paymentKey) return fail(409, "ORDER_ALREADY_PAID", "이미 처리된 주문이에요.");
    // 새로고침 등으로 같은 승인이 다시 오면 토스를 다시 호출하지 않고 현재 이용 기간을 돌려준다
    const { data: profile } = await userClient.from("profiles").select("pro_until").eq("id", userData.user.id).single();
    return json(200, { status: "paid", proUntil: profile?.pro_until ?? null });
  }
  if (order.status !== "pending") return fail(409, "ORDER_NOT_PENDING", "이미 처리된 주문이에요. 처음부터 다시 결제해 주세요.");
  if (order.amount !== amount) return fail(400, "AMOUNT_MISMATCH", "결제 금액이 주문과 달라요.");

  const admin = createClient(url, serverKey, { auth: { persistSession: false, autoRefreshToken: false } });

  // 4. 토스 승인
  const tossSecretKey = Deno.env.get("TOSS_SECRET_KEY");
  if (!tossSecretKey) {
    console.error("config_missing_toss");
    return fail(500, "CONFIG_ERROR", CONFIG_MESSAGE);
  }
  const confirm = await toss("/confirm", tossSecretKey, {
    method: "POST",
    body: { paymentKey, orderId, amount },
    idempotencyKey: orderId,
  });
  if (!confirm) {
    console.error("toss_confirm_unreachable", orderId);
    return fail(502, "CONFIRM_PENDING", RETRY_MESSAGE);
  }

  let payment: TossPayment | null = confirm.ok ? (confirm.data as TossPayment) : null;
  if (!confirm.ok) {
    const code: string = typeof confirm.data?.code === "string" ? confirm.data.code : "UNKNOWN";
    if (code === "ALREADY_PROCESSED_PAYMENT") {
      // 이미 승인된 결제면 결제 정보를 조회해 반영한다
      const lookup = await toss(`/${encodeURIComponent(paymentKey)}`, tossSecretKey, { method: "GET" });
      if (!lookup?.ok) {
        console.error("toss_lookup_failed", orderId, lookup?.status);
        return fail(502, "CONFIRM_PENDING", RETRY_MESSAGE);
      }
      payment = lookup.data as TossPayment;
    } else if (confirm.status >= 500 || RETRYABLE_CODES.has(code)) {
      console.error("toss_confirm_retryable", orderId, code);
      return fail(502, "CONFIRM_PENDING", RETRY_MESSAGE);
    } else {
      const message = typeof confirm.data?.message === "string" ? confirm.data.message.slice(0, 300) : "결제를 승인하지 못했어요.";
      console.error("toss_confirm_rejected", orderId, code);
      const { error } = await admin.rpc("fail_payment", { p_order_id: orderId, p_code: code, p_message: message });
      if (error) console.error("fail_payment_failed", orderId, error.code);
      return fail(400, code, message);
    }
  }

  // 5. 토스 응답 대조 후 반영
  if (
    !payment || payment.status !== "DONE" || payment.orderId !== orderId ||
    payment.paymentKey !== paymentKey || payment.totalAmount !== order.amount
  ) {
    console.error("toss_payment_mismatch", orderId, payment?.status);
    return fail(500, "PAYMENT_MISMATCH", "결제 정보가 주문과 맞지 않아 이용권을 반영하지 않았어요.");
  }

  const { data: result, error: completeError } = await admin.rpc("complete_payment", {
    p_order_id: orderId,
    p_payment_key: paymentKey,
    p_method: payment.method ?? null,
    p_approved_at: payment.approvedAt ?? null,
  });
  if (completeError) {
    // 토스 승인은 끝났지만 DB 반영이 실패한 경우. 다시 요청하면 같은 Idempotency-Key로 같은 승인 결과를 받아 반영한다
    console.error("complete_payment_failed", orderId, completeError.code);
    return fail(500, "COMPLETE_FAILED", "결제는 승인됐지만 이용권 반영이 늦어지고 있어요. 다시 시도해 주세요.");
  }

  return json(200, { status: "paid", proUntil: (result as { pro_until: string | null }).pro_until });
});
