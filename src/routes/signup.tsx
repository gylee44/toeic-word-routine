import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/PageHeader";
import { useRedirectIfAuthed } from "@/components/ProtectedRoute";
import { errorMessage } from "@/components/useErrorToast";
import { signUp } from "@/lib/api";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "회원가입 | 단어루틴" },
      { name: "description", content: "단어루틴에 가입하고 토익 단어 루틴을 시작하세요." },
      { property: "og:title", content: "회원가입 | 단어루틴" },
      { property: "og:description", content: "단어루틴에 가입하고 토익 단어 루틴을 시작하세요." },
    ],
  }),
  component: Signup,
});

function Signup() {
  useRedirectIfAuthed();
  const navigate = useNavigate();
  const [f, setF] = useState({ name: "", email: "", password: "", confirm: "" });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const errors: Partial<Record<keyof typeof f, string>> = {};
  if (!f.name.trim()) errors.name = "이름을 입력해 주세요.";
  if (!/^\S+@\S+\.\S+$/.test(f.email)) errors.email = "올바른 이메일 형식이 아니에요.";
  if (f.password.length < 8) errors.password = "비밀번호는 8자 이상이어야 해요.";
  if (f.confirm !== f.password || !f.confirm) errors.confirm = "비밀번호가 일치하지 않아요.";

  async function submit(e: FormEvent) {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true, confirm: true });
    if (Object.keys(errors).length) return;
    setLoading(true);
    setServerError("");
    try {
      await signUp(f.name, f.email, f.password);
      navigate({ to: "/onboarding" });
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const field = (key: keyof typeof f, label: string, type = "text", auto?: string) => (
    <div className="grid gap-2">
      <Label htmlFor={key}>{label}</Label>
      <Input
        id={key}
        type={type}
        autoComplete={auto}
        value={f[key]}
        className="h-12 rounded-xl text-base"
        aria-invalid={!!(touched[key] && errors[key])}
        aria-describedby={`${key}-err`}
        onChange={(e) => setF({ ...f, [key]: e.target.value })}
        onBlur={() => setTouched({ ...touched, [key]: true })}
      />
      {touched[key] && errors[key] && <p id={`${key}-err`} className="text-sm text-destructive">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="flex min-h-dvh flex-col py-6">
      <Link to="/"><Logo /></Link>
      <h1 className="mt-10 text-2xl font-bold">회원가입</h1>
      <p className="mt-1 text-muted-foreground">30초면 시작할 수 있어요.</p>
      <form onSubmit={submit} noValidate className="mt-8 grid gap-5">
        {field("name", "이름", "text", "name")}
        {field("email", "이메일", "email", "email")}
        {field("password", "비밀번호 (8자 이상)", "password", "new-password")}
        {field("confirm", "비밀번호 확인", "password", "new-password")}
        {serverError && <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-destructive">{serverError}</p>}
        <Button type="submit" size="xl" disabled={loading}>{loading ? "가입 중..." : "가입하기"}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        이미 계정이 있나요? <Link to="/login" search={{ redirect: undefined }} className="font-semibold text-primary">로그인</Link>
      </p>
    </div>
  );
}
