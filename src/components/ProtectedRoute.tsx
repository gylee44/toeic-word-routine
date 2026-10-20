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

/** Public-only pages: send signed-in users to /home. */
export function useRedirectIfAuthed() {
  const navigate = useNavigate();
  useEffect(() => {
    getSession().then((s) => {
      if (s) navigate({ to: "/home", replace: true });
    });
  }, [navigate]);
}
