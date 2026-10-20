import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/PageHeader";
import { useRedirectIfAuthed } from "@/components/ProtectedRoute";
import { errorMessage } from "@/components/useErrorToast";
import { signIn } from "@/lib/api";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string | undefined } => {
    const r = s["redirect"];
    return { redirect: typeof r === "string" && r.startsWith("/") ? r : undefined };
  },
  head: () => ({
    meta: [
      { title: "로그인 | 단어루틴" },
      { name: "description", content: "단어루틴에 로그인하고 오늘의 단어를 학습하세요." },
      { property: "og:title", content: "로그인 | 단어루틴" },
      { property: "og:description", content: "단어루틴에 로그인하고 오늘의 단어를 학습하세요." },
    ],
  }),
  component: Login,
});

function Login() {
  useRedirectIfAuthed();
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) return setError("이메일과 비밀번호를 입력해 주세요.");
    setLoading(true);
    setError("");
    try {
      const p = await signIn(email, password);
      if (!p.onboarded) navigate({ to: "/onboarding" });
      else if (redirect) navigate({ href: redirect, replace: true });
      else navigate({ to: "/home", replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col py-6">
      <Link to="/"><Logo /></Link>
      <h1 className="mt-10 text-2xl font-bold">다시 만나 반가워요</h1>
      <p className="mt-1 text-muted-foreground">오늘의 루틴을 이어가볼까요?</p>
      <form onSubmit={submit} className="mt-8 grid gap-5" noValidate>
        <div className="grid gap-2">
          <Label htmlFor="email">이메일</Label>
          <Input id="email" type="email" autoComplete="email" className="h-12 rounded-xl text-base" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">비밀번호</Label>
          <Input id="password" type="password" autoComplete="current-password" className="h-12 rounded-xl text-base" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-destructive">{error}</p>}
        <Button type="submit" size="xl" disabled={loading}>{loading ? "로그인 중..." : "로그인"}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        처음이신가요? <Link to="/signup" className="font-semibold text-primary">회원가입</Link>
      </p>
    </div>
  );
}
