import type { ReactNode } from "react";
import { Container } from "@/components/Container";
import { SiteHeader } from "@/components/SiteHeader";

/** 로그인·회원가입 공용 레이아웃. 데스크톱에서는 소개 패널과 폼을 나란히 둔다. */
export function AuthLayout({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <Container className="flex flex-1 flex-col pb-6 pt-10 lg:pb-16 lg:pt-24">
        <main className="lg:mx-auto lg:flex lg:w-full lg:max-w-[1040px] lg:flex-wrap lg:gap-5 lg:rounded-3xl lg:border lg:bg-card lg:p-5">
          <div className="lg:flex lg:min-h-[420px] lg:flex-[1_1_400px] lg:flex-col lg:justify-between lg:rounded-2xl lg:bg-muted lg:p-11">
            <div>
              <h1 className="text-[30px] font-bold leading-[1.3] tracking-[-0.03em] lg:text-4xl">{title}</h1>
              <p className="mt-2.5 text-[15px] text-muted-foreground lg:mt-3 lg:text-base">{description}</p>
            </div>
            <p aria-hidden className="hidden font-serif text-3xl font-semibold leading-normal text-input lg:block">
              schedule<br />negotiate<br />attendee
            </p>
          </div>
          <div className="mt-7 lg:mt-0 lg:flex lg:flex-[1_1_400px] lg:flex-col lg:justify-center lg:px-7 lg:py-5">{children}</div>
        </main>
        <p className="mt-auto pt-8 text-center text-xs leading-normal text-muted-foreground lg:pt-10">
          TOEIC은 ETS의 등록상표이며, 본 서비스는 ETS와 무관합니다.
        </p>
      </Container>
    </div>
  );
}
