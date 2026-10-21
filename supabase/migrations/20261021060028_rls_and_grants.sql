-- RLS 활성화, 조회 정책, 테이블 권한 회수 (PRD 11.8)
-- 쓰기는 정책을 만들지 않고, 트리거와 security definer RPC로만 한다.

alter table public.profiles enable row level security;
alter table public.words enable row level security;
alter table public.user_word_progress enable row level security;
alter table public.study_events enable row level security;

-- 본인 행만 조회
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy uwp_select_own on public.user_word_progress
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy study_events_select_own on public.study_events
  for select to authenticated
  using (user_id = (select auth.uid()));

-- 단어는 로그인 사용자 전체 읽기
create policy words_select_authenticated on public.words
  for select to authenticated
  using (true);

-- 정책 실수에 대비해 테이블 권한도 회수한다 (Supabase는 기본으로 부여함)
revoke all on public.profiles, public.words, public.user_word_progress, public.study_events from anon;
revoke all on public.profiles, public.words, public.user_word_progress, public.study_events from authenticated;
grant select on public.profiles, public.words, public.user_word_progress, public.study_events to authenticated;
