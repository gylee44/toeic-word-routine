import { createClient } from "@supabase/supabase-js";

const url = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined;

if (!url || !key) {
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
