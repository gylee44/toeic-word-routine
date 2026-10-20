import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/Container";
import { useRedirectIfAuthed } from "@/components/ProtectedRoute";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "단어루틴 - 토익 빈출 단어, 하루 10분 자동 복습" },
      { name: "description", content: "목표 점수에 맞춘 토익 빈출 단어를 플래시카드와 퀴즈로 익히고, 망각곡선에 맞춰 자동 복습하세요." },
      { property: "og:title", content: "단어루틴 - 토익 단어 자동 복습" },
      { property: "og:description", content: "토익 빈출 단어, 하루 10분 자동 복습" },
    ],
  }),
  component: Landing,
});

const POINTS = [
  { t: "목표 점수 맞춤", d: "목표에 맞는 난이도로 구성돼요." },
  { t: "하루 10분 루틴", d: "플래시카드로 익히고 퀴즈로 확인해요." },
  { t: "자동 복습", d: "잊을 때쯤 다시 보여줘요." },
];

/** 쌓인 단어 카드 모양의 장식 (실제 데이터가 아닌 샘플 단어) */
function CardStack() {
  return (
    <div aria-hidden className="relative mx-auto h-[168px] w-full max-w-[328px] lg:h-[320px] lg:max-w-none lg:w-[440px]">
      <div className="absolute inset-x-2.5 top-[18px] h-[136px] -rotate-[4deg] rounded-[18px] border border-primary/20 bg-accent lg:inset-x-auto lg:left-11 lg:top-[30px] lg:h-60 lg:w-[380px] lg:rounded-[22px]" />
      <div className="absolute inset-x-3 top-3 h-[136px] rotate-[3deg] rounded-[18px] border bg-card lg:inset-x-auto lg:left-[58px] lg:top-5 lg:h-60 lg:w-[380px] lg:rounded-[22px]" />
      <div className="absolute inset-x-5 top-1 flex h-[148px] flex-col justify-between rounded-[18px] border border-input bg-card px-[22px] py-5 lg:inset-x-auto lg:left-[30px] lg:top-2 lg:h-[250px] lg:w-[400px] lg:rounded-[22px] lg:p-[30px]">
        <span className="self-start rounded-md bg-accent px-2 py-[3px] text-xs font-medium text-primary lg:px-2.5 lg:py-1 lg:text-[13px]">명사</span>
        <div>
          <p className="font-serif text-[38px] font-semibold leading-[1.1] tracking-tight lg:text-[58px]">schedule</p>
          <p className="mt-1.5 text-[15px] text-muted-foreground lg:mt-2.5 lg:text-lg">일정, 스케줄</p>
        </div>
      </div>
    </div>
  );
}

function Landing() {
  useRedirectIfAuthed();
  const cta = (
    <>
      <Button asChild size="xl" className="lg:w-auto lg:px-9"><Link to="/signup">시작하기</Link></Button>
      <Button asChild size="xl" variant="ghost" className="font-medium lg:border lg:border-input lg:bg-card lg:px-7 lg:font-bold">
        <Link to="/login" search={{ redirect: undefined }}>
          <span className="lg:hidden">이미 계정이 있어요 · 로그인</span>
          <span className="hidden lg:inline">로그인</span>
        </Link>
      </Button>
    </>
  );
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <Container className="flex flex-1 flex-col pb-6 pt-9 lg:pb-10 lg:pt-[88px]">
        <main className="flex flex-col gap-7 lg:flex-row lg:items-center lg:gap-20">
          <div className="lg:flex-1">
            <p className="text-[13px] font-medium tracking-wide text-muted-foreground lg:text-sm">TOEIC 단어 · 하루 10분</p>
            <h1 className="mt-2.5 text-4xl font-bold leading-[1.26] tracking-[-0.03em] lg:mt-3.5 lg:text-5xl lg:leading-[1.2] lg:tracking-[-0.035em] xl:text-[60px]">
              토익 빈출 단어,<br />하루 10분 자동 복습
            </h1>
            <p className="mt-5 hidden text-lg leading-[1.6] text-muted-foreground lg:block">
              목표 점수에 맞는 단어를 플래시카드와 퀴즈로 익히고,<br />잊을 때쯤 자동으로 다시 보여드려요.
            </p>
            <div className="mt-9 hidden gap-3 lg:flex">{cta}</div>
          </div>
          <div className="lg:flex-1"><CardStack /></div>
        </main>

        <ol className="mt-7 border-t lg:mt-[88px] lg:grid lg:grid-cols-3 lg:gap-8 lg:pt-7">
          {POINTS.map(({ t, d }, i) => (
            <li key={t} className="flex items-baseline gap-3.5 border-b py-3.5 lg:gap-4 lg:border-b-0 lg:py-0">
              <span className="w-[22px] font-serif text-[15px] font-semibold text-primary lg:text-lg">{String(i + 1).padStart(2, "0")}</span>
              <span className="lg:block">
                <span className="inline-block w-[104px] text-[15px] font-bold lg:block lg:w-auto lg:text-[17px]">{t}</span>
                <span className="text-sm text-muted-foreground lg:mt-1 lg:block lg:text-[15px] lg:leading-normal">{d}</span>
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-auto grid gap-1 pt-7 lg:hidden">{cta}</div>
        <p className="mt-2 text-center text-xs leading-normal text-muted-foreground lg:mt-[72px]">
          TOEIC은 ETS의 등록상표이며, 본 서비스는 ETS와 무관합니다.
        </p>
      </Container>
    </div>
  );
}
