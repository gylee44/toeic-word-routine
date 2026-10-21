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
  // 이메일 인증이 켜져 있으면 가입 직후 세션이 없다. 이때 인증 메일 안내를 보여준다.
  const [sentTo, setSentTo] = useState("");

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
      const profile = await signUp(f.name, f.email, f.password);
      if (profile) navigate({ to: "/onboarding", replace: true });
      else setSentTo(f.email.trim());
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
        aria-invalid={!!(touched[key] && errors[key])}
        aria-describedby={`${key}-err`}
        onChange={(e) => setF({ ...f, [key]: e.target.value })}
        onBlur={() => setTouched({ ...touched, [key]: true })}
      />
      {touched[key] && errors[key] && (
        <p id={`${key}-err`} className="flex items-center gap-1.5 text-[13px] text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          {errors[key]}
        </p>
      )}
    </div>
  );

  if (sentTo) {
    return (
      <AuthLayout title="메일함을 확인해 주세요" description={`${sentTo}로 인증 메일을 보냈어요.`}>
        <p className="text-sm leading-relaxed text-muted-foreground">메일의 링크를 누르면 인증이 끝나고 바로 시작할 수 있어요. 메일이 보이지 않으면 스팸함도 확인해 주세요.</p>
        <Button asChild size="xl" variant="outline" className="mt-6 w-full"><Link to="/login" search={{ redirect: undefined }}>로그인으로 이동</Link></Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="회원가입" description="30초면 시작할 수 있어요.">
      <form onSubmit={submit} noValidate className="grid gap-5">
        {field("name", "이름", "text", "name")}
        {field("email", "이메일", "email", "email")}
        {field("password", "비밀번호 (8자 이상)", "password", "new-password")}
        {field("confirm", "비밀번호 확인", "password", "new-password")}
        {serverError && <p role="alert" className="flex items-center gap-2 rounded-lg bg-danger-soft p-3 text-sm font-medium text-destructive"><AlertCircle className="h-4 w-4 shrink-0" aria-hidden />{serverError}</p>}
        <Button type="submit" size="xl" disabled={loading}>{loading ? "가입 중..." : "가입하기"}</Button>
        <AuthDivider />
        <GoogleSignInButton onError={setServerError} />
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        이미 계정이 있나요? <Link to="/login" search={{ redirect: undefined }} className="font-semibold text-primary">로그인</Link>
      </p>
    </AuthLayout>
  );
}
