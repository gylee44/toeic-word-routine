import type { ReactNode } from "react";

export function PageHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <header className="flex items-center justify-between pb-4 pt-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      {right}
    </header>
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">단</span>
      <span className="text-lg font-bold">단어루틴</span>
    </div>
  );
}
