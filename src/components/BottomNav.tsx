import { Link } from "@tanstack/react-router";
import { Home, MoreHorizontal, NotebookPen } from "lucide-react";

export const NAV_TABS = [
  { to: "/home", label: "홈", icon: Home },
  { to: "/wrong-notes", label: "오답노트", icon: NotebookPen },
  { to: "/more", label: "더보기", icon: MoreHorizontal },
] as const;

/** 모바일 전용 하단 탭. 데스크톱은 SiteHeader의 상단 메뉴를 쓴다. */
export function BottomNav() {
  return (
    <nav aria-label="주요 메뉴" className="fixed inset-x-0 bottom-0 z-40 border-t bg-card lg:hidden">
      <ul className="mx-auto grid max-w-[480px] grid-cols-3">
        {NAV_TABS.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <Link
              to={to}
              className="relative flex h-[68px] flex-col items-center justify-center gap-[3px] text-xs font-medium text-muted-foreground"
              activeProps={{ className: "text-primary font-bold", "aria-current": "page" }}
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute -top-px h-0.5 w-6 bg-primary" aria-hidden />}
                  <Icon className="h-[22px] w-[22px]" strokeWidth={1.75} aria-hidden />
                  {label}
                </>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
