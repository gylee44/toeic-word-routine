import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, Repeat, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/PageHeader";
import { useRedirectIfAuthed } from "@/components/ProtectedRoute";

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

function Landing() {
  useRedirectIfAuthed();
  const features = [
    { icon: Target, t: "목표 점수 맞춤", d: "내 구간부터 빈출 순서로" },
    { icon: CalendarCheck, t: "하루 10분 루틴", d: "플래시카드 + 퀴즈" },
    { icon: Repeat, t: "자동 복습", d: "잊을 때쯤 다시 보여줘요" },
  ];
  return (
    <div className="flex min-h-dvh flex-col py-6">
      <Logo />
      <main className="flex flex-1 flex-col justify-center py-10">
        <p className="text-sm font-semibold text-primary">TOEIC 단어 학습</p>
        <h1 className="mt-2 text-4xl font-bold leading-tight tracking-tight">
          토익 빈출 단어,<br />하루 10분 자동 복습
        </h1>
        <ul className="mt-8 grid gap-3">
          {features.map(({ icon: Icon, t, d }) => (
            <li key={t} className="flex items-center gap-4 rounded-2xl bg-muted p-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground"><Icon className="h-5 w-5" aria-hidden /></span>
              <div><p className="font-semibold">{t}</p><p className="text-sm text-muted-foreground">{d}</p></div>
            </li>
          ))}
        </ul>
      </main>
      <div className="grid gap-3">
        <Button asChild size="xl"><Link to="/signup">시작하기</Link></Button>
        <Button asChild size="xl" variant="ghost"><Link to="/login" search={{ redirect: undefined }}>로그인</Link></Button>
      </div>
      <footer className="mt-6 text-center text-xs text-muted-foreground">
        TOEIC은 ETS의 등록상표이며, 본 서비스는 ETS와 무관합니다.
      </footer>
    </div>
  );
}
