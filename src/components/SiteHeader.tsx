import { Link, useLocation } from "@tanstack/react-router";
import { Container } from "@/components/Container";
import { NAV_TABS } from "@/components/BottomNav";
import { Logo } from "@/components/PageHeader";
import { cn } from "@/lib/utils";

/** 학습·퀴즈 화면은 홈 탭을 활성으로 본다 */
function activeTabPath(pathname: string) {
  if (pathname.startsWith("/wrong-notes")) return "/wrong-notes";
  if (pathname.startsWith("/more")) return "/more";
  return "/home";
}

function DesktopNav() {
  const active = activeTabPath(useLocation().pathname);
  return (
    <nav aria-label="주요 메뉴" className="hidden lg:block">
      <ul className="flex gap-8">
        {NAV_TABS.map(({ to, label }) => {
          const isActive = active === to;
          return (
            <li key={to}>
              <Link
                to={to}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex h-[72px] items-center border-b-2 border-transparent pt-0.5 text-[15px] font-medium text-muted-foreground transition-colors hover:text-foreground",
                  isActive && "border-primary font-bold text-primary hover:text-primary",
                )}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * 상단 헤더. 데스크톱(lg)에서는 88px 높이 + 하단 선, 모바일에서는 로고만 보인다.
 * nav: 데스크톱 상단 메뉴 표시 / mobile: false면 모바일에서 헤더 전체를 숨긴다.
 */
export function SiteHeader({ nav = false, mobile = true }: { nav?: boolean; mobile?: boolean }) {
  return (
    <header className={cn("lg:block lg:border-b", !mobile && "hidden")}>
      <Container className="flex items-center justify-between pt-7 lg:h-[72px] lg:pt-0">
        <Link to={nav ? "/home" : "/"} aria-label="단어루틴 홈">
          <Logo />
        </Link>
        {nav && <DesktopNav />}
      </Container>
    </header>
  );
}
