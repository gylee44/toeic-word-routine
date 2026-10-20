import { redirect } from "@tanstack/react-router";
import { getProfile, getSession } from "@/lib/api";

/** Route guard used in beforeLoad of the protected layout. */
export async function protectedRoute(location: { href: string; pathname: string }) {
  const session = await getSession();
  if (!session) throw redirect({ to: "/login", search: { redirect: location.href } });
  const profile = await getProfile();
  if (!profile) throw redirect({ to: "/login", search: { redirect: location.href } });
  if (!profile.onboarded && location.pathname !== "/onboarding") throw redirect({ to: "/onboarding" });
  return { profile };
}

/** Public-only pages: send signed-in users to /home. */
export async function publicOnlyRoute() {
  if (typeof window === "undefined") return;
  if (await getSession()) throw redirect({ to: "/home" });
}
