import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";
import { Container } from "@/components/Container";
import { protectedRoute } from "@/components/ProtectedRoute";
import { SiteHeader } from "@/components/SiteHeader";

const TAB_PATHS = ["/home", "/words", "/wrong-notes", "/more"];

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: ({ location }) => protectedRoute(location),
  component: AppLayout,
});

function AppLayout() {
  const { pathname } = useLocation();
  const showTabs = TAB_PATHS.includes(pathname.replace(/\/$/, ""));
  const isOnboarding = pathname.startsWith("/onboarding");
  return (
    <>
      <SiteHeader nav={!isOnboarding} mobile={false} />
      <Container className={showTabs ? "pb-24 lg:pb-20" : ""}>
        <Outlet />
      </Container>
      {showTabs && <BottomNav />}
    </>
  );
}
