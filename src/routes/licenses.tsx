import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/Container";

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
    ["NGSL 1.2 (New General Service List)", "Browne, C., Culligan, B., & Phillips, J. www.newgeneralservicelist.com, CC BY-SA 4.0. 학습 단어를 고르는 빈출 순위 기준으로 참고했습니다."],
    ["TSL 1.2 (TOEIC Service List)", "Browne, C. & Culligan, B. www.newgeneralservicelist.com, CC BY-SA 4.0. 학습 단어를 고르는 빈출 순위 기준으로 참고했습니다."],
    ["뜻과 예문", "한국어 뜻과 예문은 단어루틴이 직접 작성했습니다. AI로 만든 초안을 검수하며 다듬는 중이며, 기출 문제나 교재 문장은 사용하지 않았습니다."],
  ];
  return (
    <Container>
      <div className="mx-auto max-w-[480px] py-4">
        <Button variant="ghost" size="icon" aria-label="뒤로" onClick={() => router.history.back()}><ChevronLeft className="h-6 w-6" /></Button>
        <h1 className="mt-2 text-2xl font-bold">라이선스 및 출처</h1>
        <ul className="mt-6 grid gap-3">
          {items.map(([t, d]) => (
            <li key={t} className="rounded-2xl bg-muted p-4"><p className="font-semibold">{t}</p><p className="mt-1 text-sm text-muted-foreground">{d}</p></li>
          ))}
        </ul>
        <p className="mt-8 text-xs text-muted-foreground">TOEIC은 ETS의 등록상표이며, 본 서비스는 ETS와 무관합니다.</p>
      </div>
    </Container>
  );
}
