import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/licenses")({
  head: () => ({
    meta: [
      { title: "라이선스 및 출처 | 단어루틴" },
      { name: "description", content: "단어루틴에서 사용한 데이터와 오픈소스 라이선스 안내." },
      { property: "og:title", content: "라이선스 및 출처 | 단어루틴" },
      { property: "og:description", content: "단어루틴에서 사용한 데이터와 오픈소스 라이선스 안내." },
    ],
  }),
  component: Licenses,
});

function Licenses() {
  const router = useRouter();
  const items = [
    ["단어 목록 및 예문", "단어루틴 자체 제작 샘플 데이터 (예문은 모두 창작)"],
    ["폰트", "Pretendard (SIL Open Font License 1.1), Noto Sans KR (SIL OFL 1.1)"],
    ["아이콘", "Lucide Icons (ISC License)"],
    ["UI 컴포넌트", "shadcn/ui, Radix UI (MIT License)"],
    ["프레임워크", "React, TanStack Router, Tailwind CSS (MIT License)"],
  ];
  return (
    <div className="py-4">
      <Button variant="ghost" size="icon" aria-label="뒤로" onClick={() => router.history.back()}><ChevronLeft className="h-6 w-6" /></Button>
      <h1 className="mt-2 text-2xl font-bold">라이선스 및 출처</h1>
      <ul className="mt-6 grid gap-3">
        {items.map(([t, d]) => (
          <li key={t} className="rounded-2xl bg-muted p-4"><p className="font-semibold">{t}</p><p className="mt-1 text-sm text-muted-foreground">{d}</p></li>
        ))}
      </ul>
      <p className="mt-8 text-xs text-muted-foreground">TOEIC은 ETS의 등록상표이며, 본 서비스는 ETS와 무관합니다.</p>
    </div>
  );
}
