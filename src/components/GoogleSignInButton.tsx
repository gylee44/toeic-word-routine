import { useState } from "react";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/components/useErrorToast";
import { signInWithGoogle } from "@/lib/api";

/** Google 로그인 버튼. 누르면 Google 동의 화면으로 이동하고, 끝나면 /auth/callback으로 돌아온다. */
export function GoogleSignInButton({ redirect, onError }: { redirect?: string | undefined; onError: (message: string) => void }) {
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    try {
      await signInWithGoogle(redirect);
    } catch (e) {
      onError(errorMessage(e));
      setLoading(false);
    }
  }

  return (
    <Button type="button" size="xl" variant="outline" disabled={loading} onClick={start}>
      <GoogleMark />
      {loading ? "Google로 이동 중..." : "Google로 계속하기"}
    </Button>
  );
}

/** 구분선: "또는" */
export function AuthDivider() {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground" role="separator">
      <span className="h-px flex-1 bg-border" />
      또는
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

/** Google "G" 마크 (색상 토큰 규칙에 맞춰 단색 currentColor) */
function GoogleMark() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.7 4.1-5.35 4.1-3.22 0-5.85-2.67-5.85-5.96S8.78 6.26 12 6.26c1.83 0 3.06.78 3.76 1.45l2.57-2.47C16.68 3.7 14.55 2.75 12 2.75 6.9 2.75 2.75 6.9 2.75 12S6.9 21.25 12 21.25c5.34 0 8.88-3.75 8.88-9.04 0-.6-.07-1.06-.15-1.51z" />
    </svg>
  );
}
