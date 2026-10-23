import { createClient } from "@supabase/supabase-js";
import { logError, logInfo, setLogUser } from "@/lib/logger";

const url = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined;

if (!url || !key) {
  logError("supabase", "env_missing", new Error("Supabase 환경변수 없음"), { hasUrl: !!url, hasKey: !!key });
  throw new Error("VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY 환경변수가 필요합니다. .env.example을 참고하세요.");
}

/**
 * Supabase 클라이언트. UI에서 직접 쓰지 않고 src/lib/api.ts에서만 사용한다.
 * PKCE 흐름을 쓰며, OAuth·이메일 인증 후 /auth/callback URL의 code를 자동으로 세션으로 바꾼다.
 */
export const supabase = createClient(url, key, {
  auth: {
    flowType: "pkce",
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// 로그인 상태 변화를 기록한다. 콜백 안에서 supabase 메서드를 부르지 않는다(교착 방지).
if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event, session) => {
    setLogUser(session?.user.id ?? null);
    logInfo("auth", "auth_state_change", {
      authEvent: event,
      userId: session?.user.id,
      provider: session?.user.app_metadata?.["provider"],
      expiresAt: session?.expires_at,
    });
  });
}
