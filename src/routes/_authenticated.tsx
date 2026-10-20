import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";
import { protectedRoute } from "@/components/ProtectedRoute";

const TAB_PATHS = ["/home", "/days", "/wrong-notes", "/more"];

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: ({ location }) => protectedRoute(location),
  component: AppLayout,
});

function AppLayout() {
  const { pathname } = useLocation();
  const showTabs = TAB_PATHS.includes(pathname.replace(/\/$/, ""));
  return (
    <div className={showTabs ? "pb-24" : ""}>
      <Outlet />
      {showTabs && <BottomNav />}
    </div>
  );
}
