import { Link } from "@tanstack/react-router";
import { BookOpen, Home, MoreHorizontal, NotebookPen } from "lucide-react";

const tabs = [
  { to: "/home", label: "홈", icon: Home },
  { to: "/days", label: "Day", icon: BookOpen },
  { to: "/wrong-notes", label: "오답노트", icon: NotebookPen },
  { to: "/more", label: "더보기", icon: MoreHorizontal },
] as const;

export function BottomNav() {
  return (
    <nav aria-label="주요 메뉴" className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur">
      <ul className="mx-auto grid max-w-[480px] grid-cols-4">
        {tabs.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <Link
              to={to}
              className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs text-muted-foreground"
              activeProps={{ className: "text-primary font-semibold", "aria-current": "page" }}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
