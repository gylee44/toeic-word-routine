/**
 * 구조화 로그. 브라우저에서 일어난 Supabase·Google 로그인·토스 결제 이벤트를
 * /api/log로 보내 서버가 한 줄 JSON으로 출력하게 한다. 그러면 호스팅(Amplify) 로그에서 보인다.
 * 서버(SSR)에서 호출하면 바로 한 줄 JSON으로 출력한다.
 *
 * 호스팅 로그에서 찾는 법: area("auth", "google", "supabase", "toss", "app"), event, level, sid(탭 단위 세션 ID)로 검색한다.
 * 같은 sid의 로그를 시간순으로 보면 한 사용자의 흐름이 이어진다.
 */
import { describeError, sanitize, type LogArea, type LogLevel } from "@/lib/log-shared";

const ENDPOINT = "/api/log";

const isBrowser = typeof window !== "undefined";
const randomId = () => Math.random().toString(36).slice(2, 10);

/** 탭이 열려 있는 동안 같은 값. 한 사용자의 흐름을 묶어 볼 때 쓴다. */
const sessionId = randomId();
let userId: string | null = null;

/** 로그인한 사용자 ID 앞 8자리를 이후 로그에 붙인다. 로그아웃하면 null. */
export function setLogUser(id: string | null): void {
  userId = id ? id.slice(0, 8) : null;
}

/** 요청 하나를 따라가기 위한 짧은 ID. Edge Function 로그와 맞춰 볼 때 쓴다. */
export const newTraceId = randomId;

function send(entry: Record<string, unknown>): void {
  try {
    const body = JSON.stringify(entry);
    // 결제창 이동처럼 페이지가 곧 바뀌는 순간에도 전송되도록 sendBeacon을 먼저 쓴다
    if (navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: "application/json" }))) return;
    void fetch(ENDPOINT, { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => {});
  } catch {
    // 로그 전송 실패가 화면 동작을 막으면 안 된다
  }
}

export function log(level: LogLevel, area: LogArea, event: string, fields: Record<string, unknown> = {}): void {
  const entry = {
    level,
    area,
    event,
    ...(sanitize(fields) as Record<string, unknown>),
    sid: sessionId,
    uid: userId ?? undefined,
    path: isBrowser ? window.location.pathname : undefined,
  };

  if (!isBrowser) {
    // 서버에서는 그대로 호스팅 로그에 남는다
    const line = JSON.stringify({ ts: new Date().toISOString(), src: "server", ...entry });
    (level === "error" ? console.error : level === "warn" ? console.warn : console.log)(line);
    return;
  }

  // 브라우저 개발자 도구에서도 같은 내용을 볼 수 있게 한다
  const consoleFn = level === "error" ? console.error : level === "warn" ? console.warn : console.info;
  consoleFn(`[${area}] ${event}`, entry);
  if (level !== "debug") send({ ...entry, clientTs: new Date().toISOString() });
}

export const logInfo = (area: LogArea, event: string, fields?: Record<string, unknown>) => log("info", area, event, fields);
export const logWarn = (area: LogArea, event: string, fields?: Record<string, unknown>) => log("warn", area, event, fields);

/** 오류를 code·details·hint·status까지 펼쳐 error 레벨로 남긴다. */
export function logError(area: LogArea, event: string, error: unknown, fields: Record<string, unknown> = {}): void {
  log("error", area, event, { ...fields, ...describeError(error) });
}

let handlersInstalled = false;
/** 잡히지 않은 오류와 처리되지 않은 Promise 거부를 app 영역으로 남긴다. 한 번만 설치된다. */
export function installGlobalLogHandlers(): void {
  if (!isBrowser || handlersInstalled) return;
  handlersInstalled = true;
  window.addEventListener("error", (e) => {
    logError("app", "window_error", e.error ?? e.message, { filename: e.filename, line: e.lineno, col: e.colno });
  });
  window.addEventListener("unhandledrejection", (e) => {
    logError("app", "unhandled_rejection", e.reason);
  });
}
