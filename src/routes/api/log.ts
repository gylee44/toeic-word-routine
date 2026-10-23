import { createFileRoute } from "@tanstack/react-router";
import { LOG_AREAS, LOG_LEVELS, sanitize, type LogArea, type LogLevel } from "@/lib/log-shared";

/**
 * 브라우저 로그 수집 엔드포인트. 받은 로그를 한 줄 JSON으로 출력해 호스팅 로그(CloudWatch)에 남긴다.
 * 로그인 없이도 호출되므로 크기·횟수를 제한하고, 값은 한 번 더 가린다(sanitize).
 */
const MAX_BODY_BYTES = 8 * 1024;
const MAX_PER_MINUTE = 120;
const NAME_RE = /^[a-z0-9_.:-]{1,60}$/;

// 인스턴스별 메모리 제한이라 완벽하지 않지만 로그 폭주를 막는 데는 충분하다
const hits = new Map<string, { count: number; resetAt: number }>();

function allowed(key: string): boolean {
  const now = Date.now();
  const hit = hits.get(key);
  if (!hit || hit.resetAt < now) {
    if (hits.size > 5000) hits.clear();
    hits.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  hit.count += 1;
  return hit.count <= MAX_PER_MINUTE;
}

const noContent = (status: number) => new Response(null, { status });

export const Route = createFileRoute("/api/log")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // IP는 제한 판정에만 쓰고 로그에는 남기지 않는다
        const caller = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
        if (!allowed(caller)) return noContent(429);

        const text = await request.text().catch(() => "");
        if (text.length === 0 || text.length > MAX_BODY_BYTES) return noContent(413);

        let body: Record<string, unknown>;
        try {
          body = JSON.parse(text) as Record<string, unknown>;
        } catch {
          return noContent(400);
        }
        const { level, area, event, ...rest } = body;
        if (
          !LOG_LEVELS.includes(level as LogLevel) ||
          !LOG_AREAS.includes(area as LogArea) ||
          typeof event !== "string" ||
          !NAME_RE.test(event)
        ) {
          return noContent(400);
        }

        const line = JSON.stringify({
          ts: new Date().toISOString(),
          src: "client",
          level,
          area,
          event,
          ...(sanitize(rest) as Record<string, unknown>),
          ua: request.headers.get("user-agent")?.slice(0, 160),
        });
        (level === "error" ? console.error : level === "warn" ? console.warn : console.log)(line);
        return noContent(204);
      },
    },
  },
});
