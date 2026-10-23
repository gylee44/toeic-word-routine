/**
 * 로그 공통 코드. 브라우저(logger.ts)와 서버(routes/api/log.ts)가 함께 쓴다.
 * 비밀번호·토큰·결제 키 같은 민감 값이 로그에 남지 않도록 여기서 가린다.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";
/** 로그를 기능별로 나누는 영역. 호스팅 로그에서 area로 검색한다. */
export type LogArea = "auth" | "google" | "supabase" | "toss" | "app";

export const LOG_LEVELS: readonly LogLevel[] = ["debug", "info", "warn", "error"];
export const LOG_AREAS: readonly LogArea[] = ["auth", "google", "supabase", "toss", "app"];

const MAX_STRING = 500;
const MAX_DEPTH = 4;
const SENSITIVE_KEY = /pass(word)?|token|secret|authorization|api[-_]?key|verifier|cookie|^code$|^jwt$/i;

export function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  return `${local.slice(0, 2)}***@${domain}`;
}

/** 결제 키처럼 길고 민감한 식별자는 앞 6자리와 뒤 4자리만 남긴다. */
export function maskKey(key: string | null | undefined): string | null {
  if (!key) return null;
  return key.length <= 12 ? "***" : `${key.slice(0, 6)}...${key.slice(-4)}`;
}

/** 로그에 넣을 값을 안전하게 바꾼다: 민감한 키는 가리고, 이메일은 일부만 남기고, 긴 문자열은 자른다. */
export function sanitize(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    const text = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? maskEmail(value) : value;
    return text.length > MAX_STRING ? `${text.slice(0, MAX_STRING)}...(${text.length}자)` : text;
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (depth >= MAX_DEPTH) return "[depth]";
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => sanitize(v, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>).slice(0, 30)) {
      out[k] = SENSITIVE_KEY.test(k) ? "[REDACTED]" : sanitize(v, depth + 1);
    }
    return out;
  }
  return String(value);
}

/**
 * 오류 객체를 로그 필드로 펼친다. Supabase 오류는 message 외에 code, details, hint, status가
 * 원인을 알려 주므로 모두 남긴다. (화면에는 한국어 안내만 보여주고 원인은 여기서 확인한다)
 */
export function describeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    const extra = error as Error & { code?: unknown; status?: unknown; details?: unknown; hint?: unknown };
    return {
      errorName: error.name,
      errorMessage: error.message,
      errorCode: extra.code,
      errorStatus: extra.status,
      errorDetails: extra.details,
      errorHint: extra.hint,
      stack: error.stack?.split("\n").slice(0, 6).join("\n"),
    };
  }
  if (error && typeof error === "object") {
    const e = error as Record<string, unknown>;
    return {
      errorMessage: e["message"],
      errorCode: e["code"],
      errorStatus: e["status"],
      errorDetails: e["details"],
      errorHint: e["hint"],
    };
  }
  return { errorMessage: String(error) };
}
