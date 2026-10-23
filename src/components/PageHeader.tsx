import { useId, type ReactNode } from "react";
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

/** 브랜드 마크: 출발점(점)에서 한 바퀴 돌아오는 고리 + 세리프 이탤릭 w. 색은 currentColor */
export function LogoMark({ className }: { className?: string }) {
  // 헤더가 여러 번 렌더링돼도 마스크 id가 겹치지 않게 한다
  const maskId = useId();
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        {/* 고리 위쪽 틈을 잘라내는 마스크 */}
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
          <rect width="64" height="64" fill="white" />
          <polygon points="32,32 18.3,-5.6 57.7,1.4" fill="black" />
        </mask>
      </defs>
      <g transform="translate(32 32) scale(1.15) translate(-32 -32)" fill="currentColor">
        {/* 바깥 원과 살짝 위로 올린 안쪽 원의 차이: 위는 가늘고 아래는 도톰한 고리 */}
        <path
          mask={`url(#${maskId})`}
          fillRule="evenodd"
          d="M11 32a21 21 0 1 0 42 0a21 21 0 1 0-42 0ZM15.2 30.8a16.8 16.8 0 1 0 33.6 0a16.8 16.8 0 1 0-33.6 0Z"
        />
        <path d="M20.4 11.6L25.4 14L23.1 19" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="44.5" cy="17.1" r="4.2" opacity="0.55" />
        {/* Source Serif 4 Italic 600의 w를 도형으로 변환 */}
        <path d="M26 41.53Q25.95 39.96 25.84 38.51Q25.74 37.06 25.61 35.76Q25.48 34.45 25.34 33.22Q25.19 31.99 25.05 30.83Q24.93 30.1 24.76 29.91Q24.58 29.73 24.29 29.73Q23.95 29.73 23.57 30.06Q23.19 30.39 22.64 31.18L21.97 30.57Q22.93 28.88 23.92 28.04Q24.9 27.2 25.95 27.2Q26.96 27.2 27.45 27.75Q27.95 28.3 28.09 29.52Q28.3 30.86 28.43 32.5Q28.56 34.13 28.63 35.83Q28.7 37.53 28.73 39.15L28.06 39.09L28.3 38.72Q29.31 37.06 30.28 35.27Q31.25 33.47 32.18 31.58Q33.11 29.7 33.98 27.7H35.84Q35.92 29.15 36.04 30.58Q36.15 32.02 36.27 33.47Q36.39 34.92 36.49 36.34Q36.59 37.76 36.7 39.18L36.24 39.06L36.44 38.77Q37.37 37.61 38.14 36.51Q38.91 35.41 39.61 34.26Q40.3 33.12 41 31.84Q41.14 31.58 41.26 31.34Q41.37 31.09 41.49 30.86L41.17 33.41L40.53 31.15Q40.45 30.89 40.36 30.57Q40.27 30.25 40.21 29.93Q40.16 29.61 40.16 29.38Q40.16 28.22 40.79 27.68Q41.43 27.14 42.27 27.14Q42.62 27.14 42.93 27.26Q43.23 27.38 43.38 27.55Q43.55 27.75 43.62 28.04Q43.69 28.33 43.69 28.86Q43.69 29.2 43.59 29.67Q43.49 30.13 43.2 30.81Q42.91 31.49 42.3 32.6Q41.78 33.58 41.08 34.67Q40.39 35.76 39.52 36.92Q38.65 38.08 37.66 39.25Q36.68 40.43 35.57 41.59L34.09 41.73L33.83 41.53Q33.72 40.31 33.62 39.11Q33.52 37.9 33.41 36.69Q33.31 35.47 33.21 34.26Q33.11 33.06 33.02 31.84H33.6L33.37 32.28Q32.85 33.32 32.22 34.51Q31.6 35.7 30.89 36.93Q30.18 38.16 29.41 39.34Q28.64 40.51 27.89 41.59L26.27 41.73Z" />
      </g>
    </svg>
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <LogoMark className="h-[30px] w-[30px] shrink-0 text-primary" />
      <span className="font-brand text-[18px] font-bold tracking-tight lg:text-[19px]">단어루틴</span>
    </div>
  );
}
