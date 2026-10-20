import type { ReactNode } from "react";

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-muted px-6 py-10 text-center lg:min-h-[368px] lg:justify-center lg:rounded-3xl lg:p-16">
      {icon && <div className="mb-3 text-muted-foreground">{icon}</div>}
      <p className="font-semibold lg:text-xl">{title}</p>
      {description && <p className="mt-1 text-sm text-muted-foreground lg:mt-2">{description}</p>}
      {action && <div className="mt-5 w-full lg:mt-7 lg:w-60">{action}</div>}
    </div>
  );
}
