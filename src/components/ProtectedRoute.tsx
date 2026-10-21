import { redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { getProfile, getSession } from "@/lib/api";

/** Route guard used in beforeLoad of the protected (client-only) layout. */
export async function protectedRoute(location: { href: string; pathname: string }) {
  const session = await getSession();
  const profile = session ? await getProfile() : null;
  if (!session || !profile) throw redirect({ to: "/login", search: { redirect: location.href } });
  if (!profile.onboarded && location.pathname !== "/onboarding") throw redirect({ to: "/onboarding" });
  return { profile };
}

/**
 * Public-only pages: send signed-in users to /home. 프로필이 없는 세션은 보내지 않는다(리다이렉트 반복 방지).
 * enabled=false: 로그인 오류를 보여주는 중에는 이동하지 않고, 다른 계정으로 다시 로그인할 수 있게 둔다.
 */
export function useRedirectIfAuthed(enabled = true) {
  const navigate = useNavigate();
  useEffect(() => {
    if (!enabled) return;
    getProfile()
      .then((p) => {
        if (p) navigate({ to: "/home", replace: true });
      })
      .catch(() => {});
  }, [navigate, enabled]);
}
