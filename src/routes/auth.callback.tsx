import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { errorMessage } from "@/components/useErrorToast";
import { completeAuthCallback } from "@/lib/api";

/** Google 로그인·이메일 인증 링크가 돌아오는 페이지. 세션을 확인한 뒤 온보딩 또는 원래 페이지로 보낸다. */
export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({ meta: [{ title: "로그인 중 | 단어루틴" }] }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const started = useRef(false);

  useEffect(() => {
    // 개발 모드의 StrictMode에서 두 번 실행되지 않게 막는다
    if (started.current) return;
    started.current = true;
    completeAuthCallback()
      .then(({ profile, redirect }) => {
        if (!profile.onboarded) navigate({ to: "/onboarding", replace: true });
        else if (redirect) navigate({ href: redirect, replace: true });
        else navigate({ to: "/home", replace: true });
      })
      .catch((e) => navigate({ to: "/login", search: { redirect: undefined, error: errorMessage(e) }, replace: true }));
  }, [navigate]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 text-muted-foreground" role="status">
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
      <p className="text-sm">로그인 중이에요...</p>
    </div>
  );
}
