import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/Container";
import { useRedirectIfAuthed } from "@/components/ProtectedRoute";
import { SiteHeader } from "@/components/SiteHeader";
import { authErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  // Supabase는 인증 오류를 Site URL(/)로 돌려보낸다: ?error=...&error_code=...
  validateSearch: (s: Record<string, unknown>): { error?: string | undefined; error_code?: string | undefined } => ({
    error: typeof s["error"] === "string" ? s["error"] : undefined,
    error_code: typeof s["error_code"] === "string" ? s["error_code"] : undefined,
  }),
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

/** 앞 카드 뒤에 쌓인 카드. 앞 카드가 돌 때 드러나므로 빈 카드가 아니라 단어를 채워 둔다 */
const behind = "absolute flex h-[136px] flex-col justify-between rounded-[18px] border px-[22px] py-5 lg:inset-x-auto lg:h-60 lg:w-[380px] lg:rounded-[22px] lg:p-[30px]";

function BehindWord({ pos, word, meaning, tagClass }: { pos: string; word: string; meaning: string; tagClass: string }) {
  return (
    <>
      <span className={cn("self-start rounded-md px-2 py-[3px] text-xs font-medium text-primary lg:px-2.5 lg:py-1 lg:text-[13px]", tagClass)}>{pos}</span>
      <div>
        <p className="font-serif text-[38px] font-semibold leading-[1.1] tracking-tight lg:text-[58px]">{word}</p>
        <p className="mt-1.5 text-[15px] text-muted-foreground lg:mt-2.5 lg:text-lg">{meaning}</p>
      </div>
    </>
  );
}

const FLIP_INTERVAL_MS = 4000;
const FLIP_RESUME_MS = 8000;

/** 쌓인 단어 카드 샘플 (실제 데이터가 아닌 샘플 단어). 앞 카드는 자동으로 천천히 뒤집히고, 눌러서도 뒤집힌다 */
function CardStack() {
  const [flipped, setFlipped] = useState(false);
  const [held, setHeld] = useState(false); // 마우스를 올렸거나 포커스가 있는 동안 자동 뒤집기를 멈춘다
  const [peek, setPeek] = useState(false); // 마우스를 올렸을 때 살짝 기울여 뒤집을 수 있다는 힌트를 준다
  const [reduced, setReduced] = useState(false);
  const resumeAt = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduced || held) return;
    const id = setInterval(() => {
      if (Date.now() >= resumeAt.current) setFlipped((f) => !f);
    }, FLIP_INTERVAL_MS);
    return () => clearInterval(id);
  }, [reduced, held]);

  const flip = () => {
    resumeAt.current = Date.now() + FLIP_RESUME_MS;
    setFlipped((f) => !f);
  };

  // 모션 줄이기 설정이면 3D 회전 대신 앞뒤 면이 서로 페이드로 바뀐다
  const face = cn(
    "pointer-events-none absolute inset-0 flex flex-col rounded-[18px] border border-input bg-card px-[22px] py-5 lg:rounded-[22px] lg:p-[30px]",
    reduced ? "transition-opacity duration-300" : "backface-hidden",
  );
  const rotation = reduced ? undefined : flipped ? "rotateY(180deg)" : peek ? "rotateY(-8deg)" : undefined;

  return (
    <div className="relative mx-auto h-[168px] w-full max-w-[328px] lg:h-[320px] lg:max-w-none lg:w-[440px]">
      <div aria-hidden className={cn(behind, "inset-x-2.5 top-[18px] -rotate-[4deg] border-primary/20 bg-accent lg:left-11 lg:top-[30px]")}>
        <BehindWord pos="동사" word="conceal" meaning="숨기다, 감추다" tagClass="bg-card" />
      </div>
      <div aria-hidden className={cn(behind, "inset-x-3 top-3 rotate-[3deg] bg-card lg:left-[58px] lg:top-5")}>
        <BehindWord pos="형용사" word="hidden" meaning="숨겨진, 보이지 않는" tagClass="bg-accent" />
      </div>
      <div className="absolute inset-x-5 top-1 h-[148px] lg:inset-x-auto lg:left-[30px] lg:top-2 lg:h-[250px] lg:w-[400px]">
        {/* 뒤집기 버튼은 카드 뒤에 깔고, 카드 면은 클릭을 통과시킨다. 버튼은 움직이지 않는 바깥 영역에 둬서 카드가 떠올라도 hover가 풀리지 않는다 */}
        <button
          type="button"
          onClick={flip}
          onPointerEnter={(e) => {
            if (e.pointerType === "mouse") {
              setHeld(true);
              setPeek(true);
            }
          }}
          onPointerLeave={() => {
            setHeld(false);
            setPeek(false);
          }}
          onFocus={() => setHeld(true)}
          onBlur={() => setHeld(false)}
          aria-label={flipped ? "샘플 카드 앞면 보기" : "샘플 카드 뒤집어 뜻과 예문 보기"}
          className="absolute inset-0 cursor-pointer rounded-[18px] lg:rounded-[22px]"
        />
        <div
          className={cn(
            "perspective pointer-events-none relative h-full w-full transition-transform duration-200 ease-out",
            peek && !flipped && "-translate-y-1",
          )}
        >
        <div
          className={cn("preserve-3d relative h-full w-full", !reduced && "transition-transform duration-[800ms] ease-in-out")}
          style={{ transform: rotation }}
        >
          <div aria-hidden={flipped} className={cn(face, "justify-between", reduced && flipped && "opacity-0")}>
            <span className="self-start rounded-md bg-accent px-2 py-[3px] text-xs font-medium text-primary lg:px-2.5 lg:py-1 lg:text-[13px]">명사</span>
            <div>
              <p className="font-serif text-[38px] font-semibold leading-[1.1] tracking-tight lg:text-[58px]">schedule</p>
              <p className="mt-1.5 text-[15px] text-muted-foreground lg:mt-2.5 lg:text-lg">일정, 스케줄</p>
            </div>
            <span className="absolute right-4 top-4 flex items-center gap-1 text-xs text-muted-foreground lg:right-6 lg:top-6 lg:text-[13px]">
              <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />눌러서 뒤집기
            </span>
          </div>
          <div
            aria-hidden={!flipped}
            className={cn(face, "justify-center", !reduced && "rotate-y-180", reduced && !flipped && "opacity-0")}
          >
            <p className="text-xs text-muted-foreground lg:text-[13px]">schedule · 명사</p>
            <p className="mt-1.5 font-serif text-[17px] font-semibold leading-snug lg:mt-3 lg:text-[26px]">The meeting schedule has changed.</p>
            <p className="mt-1.5 text-sm text-muted-foreground lg:mt-3 lg:text-base">회의 일정이 바뀌었어요.</p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

function Landing() {
  const { error, error_code } = Route.useSearch();
  const navigate = useNavigate();
  useRedirectIfAuthed(!error);
  // 인증 오류로 돌아왔으면 로그인 화면에서 안내하고 다시 시도하게 한다
  useEffect(() => {
    if (error) navigate({ to: "/login", search: { redirect: undefined, error: authErrorMessage(error, error_code) }, replace: true });
  }, [error, error_code, navigate]);
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
