import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/AuthLayout";
import { AuthDivider, GoogleSignInButton } from "@/components/GoogleSignInButton";
import { useRedirectIfAuthed } from "@/components/ProtectedRoute";
import { errorMessage } from "@/components/useErrorToast";
import { signIn } from "@/lib/api";

export const Route = createFileRoute("/login")({
  // error: Google 로그인·인증 링크 처리(/auth/callback)에서 실패했을 때 보여줄 문구
  validateSearch: (s: Record<string, unknown>): { redirect?: string | undefined; error?: string | undefined } => {
    const r = s["redirect"];
    const e = s["error"];
    return {
      redirect: typeof r === "string" && r.startsWith("/") ? r : undefined,
      error: typeof e === "string" ? e.slice(0, 200) : undefined,
    };
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
  const { redirect, error: callbackError } = Route.useSearch();
  useRedirectIfAuthed(!callbackError);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(callbackError ?? "");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) return setError("이메일과 비밀번호를 입력해 주세요.");
    setLoading(true);
    setError("");
    try {
      const p = await signIn(email, password);
      if (!p.onboarded) navigate({ to: "/onboarding", replace: true });
      else if (redirect) navigate({ href: redirect, replace: true });
      else navigate({ to: "/home", replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="다시 만나 반가워요" description="오늘의 루틴을 이어가볼까요?">
      <form onSubmit={submit} className="grid gap-5" noValidate>
        <div className="grid gap-2">
          <Label htmlFor="email">이메일</Label>
          <Input id="email" type="email" autoComplete="email" className="h-[54px]" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">비밀번호</Label>
          <Input id="password" type="password" autoComplete="current-password" className="h-[54px]" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p role="alert" className="flex items-center gap-2 rounded-lg bg-danger-soft p-3 text-sm font-medium text-destructive"><AlertCircle className="h-4 w-4 shrink-0" aria-hidden />{error}</p>}
        <Button type="submit" size="xl" disabled={loading}>{loading ? "로그인 중..." : "로그인"}</Button>
        <AuthDivider />
        <GoogleSignInButton redirect={redirect} onError={setError} />
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        처음이신가요? <Link to="/signup" className="font-semibold text-primary">회원가입</Link>
      </p>
    </AuthLayout>
  );
}
