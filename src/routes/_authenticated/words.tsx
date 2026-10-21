import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Check, ChevronDown, RefreshCw, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/EmptyState";
import { SpeakButton } from "@/components/SpeakButton";
import { errorMessage } from "@/components/useErrorToast";
import { getLearnedWords } from "@/lib/api";
import { POS_KO, WRONG_NOTE_CLEAR_STREAK } from "@/lib/constants";
import { addDays, todayKST } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { LearnedWord } from "@/types";

export const Route = createFileRoute("/_authenticated/words")({
  head: () => ({ meta: [{ title: "단어장 | 단어루틴" }, { name: "description", content: "지금까지 학습한 단어 모아보기" }] }),
  component: Words,
});

type Filter = "all" | "due" | "wrong" | "mastered";
type Sort = "alpha" | "recent";

/** 한 번에 화면에 그리는 단어 수. 스크롤이 끝에 닿으면 이만큼씩 더 그린다. */
const PAGE = 60;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "due", label: "복습 필요" },
  { value: "wrong", label: "오답" },
  { value: "mastered", label: "익힘" },
];

const isDue = (w: LearnedWord, today: string) => w.nextReviewAt <= today;
// 오답노트와 같은 기준: 틀린 적이 있고 연속 정답이 아직 해제 기준에 못 미친 단어
const isWrong = (w: LearnedWord) => w.wrongCount > 0 && w.correctStreak < WRONG_NOTE_CLEAR_STREAK;
const isMastered = (w: LearnedWord) => w.status === "mastered";

/** YYYY-MM-DD → "10월 20일" */
const formatDay = (ymd: string) => `${Number(ymd.slice(5, 7))}월 ${Number(ymd.slice(8, 10))}일`;

function dayLabel(ymd: string, today: string) {
  if (ymd === today) return "오늘";
  if (ymd === addDays(today, -1)) return "어제";
  return formatDay(ymd);
}

interface Group {
  key: string;
  label: string;
  items: LearnedWord[];
}

/** 정렬된 목록을 알파벳 첫 글자(A–Z) 또는 학습일 기준으로 묶는다 */
function groupWords(list: LearnedWord[], sort: Sort, today: string): Group[] {
  const groups: Group[] = [];
  for (const w of list) {
    const first = w.headword.charAt(0).toUpperCase();
    const key = sort === "alpha" ? (/[A-Z]/.test(first) ? first : "#") : w.firstStudiedDate;
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(w);
    else groups.push({ key, label: sort === "alpha" ? key : dayLabel(key, today), items: [w] });
  }
  return groups;
}

/** 상태는 색만으로 구분하지 않고 아이콘과 문구를 함께 쓴다. 우선순위: 오답 > 복습 필요 > 익힘 */
function StatusBadge({ word, today }: { word: LearnedWord; today: string }) {
  if (isWrong(word))
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-danger-soft px-2 py-1 text-xs font-bold text-destructive">
        <X className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />오답 {word.wrongCount}회
      </span>
    );
  if (isDue(word, today))
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-xs font-bold text-accent-foreground">
        <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />복습 필요
      </span>
    );
  if (isMastered(word))
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-success-soft px-2 py-1 text-xs font-bold text-success">
        <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />익힘
      </span>
    );
  return null;
}

interface RowProps {
  word: LearnedWord;
  today: string;
  hideMeaning: boolean;
  open: boolean;
  onToggle: (id: string) => void;
}

const WordRow = memo(function WordRow({ word, today, hideMeaning, open, onToggle }: RowProps) {
  const masked = hideMeaning && !open;
  const meaning = masked ? (
    <>
      <span aria-hidden className="inline-block h-5 w-24 rounded bg-muted align-middle" />
      <span className="sr-only">뜻이 가려져 있어요. 누르면 보여요</span>
    </>
  ) : (
    word.meaningKo
  );
  return (
    <li className="border-b last:border-b-0">
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => onToggle(word.id)}
          className="flex min-w-0 flex-1 items-center gap-3 py-3.5 pl-0.5 text-left lg:gap-4 lg:py-4"
        >
          <span className="min-w-0 flex-1 lg:flex-[1_1_220px]">
            <span className="flex items-baseline gap-2">
              <span className="truncate font-serif text-[22px] font-semibold leading-[1.2] lg:text-[26px]">{word.headword}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{POS_KO[word.pos]}</span>
            </span>
            <span className="mt-[3px] block text-sm text-muted-foreground lg:hidden">{meaning}</span>
            <span className="mt-1.5 block empty:hidden lg:hidden">
              <StatusBadge word={word} today={today} />
            </span>
          </span>
          <span className="hidden text-base lg:block lg:flex-[2_1_260px]">{meaning}</span>
          <span className="hidden w-[104px] shrink-0 justify-end lg:flex">
            <StatusBadge word={word} today={today} />
          </span>
          <span className="hidden w-[64px] shrink-0 text-right text-sm text-muted-foreground lg:block">{dayLabel(word.firstStudiedDate, today)}</span>
          <ChevronDown className={cn("h-[18px] w-[18px] shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none", open && "rotate-180")} aria-hidden />
        </button>
        <SpeakButton text={word.headword} label={`${word.headword} 발음 듣기`} rate={0.8} />
      </div>
      {open && (
        <div className="pb-4 pl-0.5 pr-2 lg:pb-5 lg:pr-12">
          <p className="mb-3 text-xs text-muted-foreground lg:hidden">{dayLabel(word.firstStudiedDate, today)} 학습</p>
          <div className="relative rounded-2xl border bg-card p-4 pr-12 lg:rounded-[18px] lg:px-6 lg:py-5 lg:pr-14">
            <SpeakButton text={word.exampleEn} label="예문 발음 듣기" className="absolute right-1.5 top-1.5 lg:right-3 lg:top-3" />
            <p className="font-serif text-base font-semibold leading-relaxed lg:text-xl lg:leading-normal">{word.exampleEn}</p>
            <p className="mt-2 text-sm text-muted-foreground lg:text-[15px]">{word.exampleKo}</p>
          </div>
        </div>
      )}
    </li>
  );
});

function Words() {
  const q = useQuery({ queryKey: ["learned"], queryFn: getLearnedWords });
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("alpha");
  const [hideMeaning, setHideMeaning] = useState(false);
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const [limit, setLimit] = useState(PAGE);
  const sentinel = useRef<HTMLDivElement>(null);
  const today = todayKST();

  const toggle = useCallback((id: string) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const all = q.data ?? [];
  const counts = useMemo(
    () => ({
      all: all.length,
      due: all.filter((w) => isDue(w, today)).length,
      wrong: all.filter(isWrong).length,
      mastered: all.filter(isMastered).length,
    }),
    [all, today],
  );

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = all.filter((w) => {
      if (filter === "due" && !isDue(w, today)) return false;
      if (filter === "wrong" && !isWrong(w)) return false;
      if (filter === "mastered" && !isMastered(w)) return false;
      return !needle || w.headword.toLowerCase().includes(needle) || w.meaningKo.toLowerCase().includes(needle);
    });
    if (sort === "alpha") return list.sort((a, b) => a.headword.localeCompare(b.headword, "en", { sensitivity: "base" }));
    // 최근 학습순: 같은 날 안에서는 알파벳순
    return list.sort((a, b) => b.firstStudiedDate.localeCompare(a.firstStudiedDate) || a.headword.localeCompare(b.headword, "en", { sensitivity: "base" }));
  }, [all, filter, query, sort, today]);

  // 검색·필터·정렬이 바뀌면 처음부터 다시 그린다
  useEffect(() => setLimit(PAGE), [filter, query, sort]);

  const visible = useMemo(() => shown.slice(0, limit), [shown, limit]);
  const hasMore = shown.length > limit;
  const groups = useMemo(() => groupWords(visible, sort, today), [visible, sort, today]);

  // 스크롤이 목록 끝 근처에 오면 단어를 더 그린다 (단어가 아무리 늘어도 처음엔 PAGE개만 그린다)
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver((entries) => entries[0]?.isIntersecting && setLimit((l) => l + PAGE), { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, limit]);

  const filtering = query.trim() !== "" || filter !== "all";

  return (
    <div className="pt-9 lg:pt-14">
      <header>
        <h1 className="text-[26px] font-bold leading-[1.3] tracking-[-0.03em] lg:text-[34px]">단어장</h1>
        <p className="mt-1.5 text-sm text-muted-foreground lg:mt-2 lg:text-base">
          {q.data ? `지금까지 학습한 단어 ${all.length}개` : "학습한 단어를 모아봐요."}
        </p>
      </header>

      <div className="mt-5 lg:mt-8">
        {q.isError ? (
          <div role="alert" className="card-surface px-6 py-10 text-center">
            <p className="text-lg font-bold">단어장을 불러오지 못했어요</p>
            <p className="mt-2 text-sm text-muted-foreground">{errorMessage(q.error)}</p>
            <Button className="mt-6" size="lg" onClick={() => q.refetch()}>다시 시도</Button>
          </div>
        ) : !q.data ? (
          <div role="status" aria-busy="true" aria-label="단어장을 불러오는 중" className="grid gap-2">
            <Skeleton className="h-[52px] rounded-lg" />
            {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
          </div>
        ) : all.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-10 w-10" />}
            title="아직 학습한 단어가 없어요"
            description="오늘의 학습을 시작하면 단어가 여기에 쌓여요."
            action={<Button asChild size="lg" className="w-full"><Link to="/learn" search={{}}>오늘의 학습 시작</Link></Button>}
          />
        ) : (
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                type="text"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                aria-label="단어나 뜻 검색"
                placeholder="단어나 뜻으로 검색"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-11 pr-11"
              />
              {query && (
                <button
                  type="button"
                  aria-label="검색어 지우기"
                  onClick={() => setQuery("")}
                  className="absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                >
                  <X className="h-[18px] w-[18px]" aria-hidden />
                </button>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5 lg:gap-2" role="group" aria-label="보기 필터">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  aria-pressed={filter === f.value}
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    "h-10 rounded-full border px-3 text-sm font-medium transition-colors lg:px-4",
                    filter === f.value ? "border-primary bg-accent font-bold text-accent-foreground" : "border-input bg-card text-muted-foreground hover:border-primary",
                  )}
                >
                  {f.label} <span className="tabular-nums">{counts[f.value]}</span>
                </button>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <div className="inline-flex rounded-lg bg-muted p-1" role="group" aria-label="정렬">
                {(
                  [
                    { value: "alpha", label: "A–Z" },
                    { value: "recent", label: "최근 학습순" },
                  ] as const
                ).map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    aria-pressed={sort === s.value}
                    onClick={() => setSort(s.value)}
                    className={cn("h-9 rounded-md px-3.5 text-sm transition-colors", sort === s.value ? "bg-card font-bold shadow-card" : "font-medium text-muted-foreground")}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium">
                뜻 가리기
                <Switch checked={hideMeaning} onCheckedChange={setHideMeaning} aria-label="뜻 가리기" />
              </label>
            </div>

            <p aria-live="polite" className="mb-1 mt-5 text-[13px] text-muted-foreground">
              {filtering ? `${shown.length}개를 찾았어요` : hideMeaning ? "단어를 누르면 뜻과 예문이 보여요" : "단어를 누르면 예문이 보여요"}
            </p>

            {shown.length === 0 ? (
              <EmptyState
                icon={<Search className="h-10 w-10" />}
                title="조건에 맞는 단어가 없어요"
                description={query.trim() ? `‘${query.trim()}’에 맞는 단어가 없어요.` : "이 조건에 해당하는 단어가 아직 없어요."}
                action={<Button size="lg" variant="secondary" className="w-full" onClick={() => { setQuery(""); setFilter("all"); }}>검색·필터 초기화</Button>}
              />
            ) : (
              <>
                {groups.map((g) => (
                  <section key={g.key} aria-label={sort === "alpha" ? `${g.label}로 시작하는 단어` : g.label}>
                    <h2 className="mt-5 flex items-baseline gap-2 border-b border-foreground pb-2 lg:mt-7">
                      <span className="font-serif text-xl font-semibold text-primary">{g.label}</span>
                      <span className="text-[13px] text-muted-foreground">{g.items.length}개</span>
                    </h2>
                    <ul>
                      {g.items.map((w) => (
                        <WordRow key={w.id} word={w} today={today} hideMeaning={hideMeaning} open={open.has(w.id)} onToggle={toggle} />
                      ))}
                    </ul>
                  </section>
                ))}
                {hasMore && (
                  <div ref={sentinel} className="pt-6 text-center">
                    <Button variant="secondary" size="lg" onClick={() => setLimit((l) => l + PAGE)}>
                      더 보기 ({shown.length - limit}개 남음)
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
