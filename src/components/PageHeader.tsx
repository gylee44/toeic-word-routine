import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** desktopOnly: 모바일에서는 제목을 시각적으로 숨기고(스크린리더용) 데스크톱에서만 보여준다 */
export function PageHeader({ title, right, desktopOnly }: { title: string; right?: ReactNode; desktopOnly?: boolean }) {
  return (
    <header className={cn("flex items-center justify-between pb-4 pt-6 lg:pb-8 lg:pt-16", desktopOnly && "sr-only lg:not-sr-only")}>
      <h1 className="text-[26px] font-bold leading-[1.3] tracking-tight lg:text-[34px]">{title}</h1>
      {right}
    </header>
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <span className="block h-2.5 w-2.5 rounded-[3px] bg-primary" aria-hidden />
      <span className="text-[17px] font-bold tracking-tight lg:text-lg">단어루틴</span>
    </div>
  );
}
