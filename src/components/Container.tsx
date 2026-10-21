import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** 모바일은 최대 480px 단일 컬럼, 데스크톱(lg)은 최대 1120px 콘텐츠 영역 */
export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-[480px] px-5 lg:max-w-[1200px] lg:px-10", className)} {...props} />;
}
