-- 테이블 생성: profiles, words, user_word_progress, study_events (PRD 11.1 ~ 11.4)
-- RLS와 권한은 다음 마이그레이션(rls_and_grants)에서 적용한다.

-- 사용자 프로필 (auth.users 1:1)
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  name         text not null,
  role         text not null default 'user' check (role in ('user', 'admin')),
  target_score integer check (target_score in (500, 600, 700, 800, 900)),
  start_tier   integer check (start_tier in (500, 600, 700, 800, 900)),
  daily_goal   integer check (daily_goal in (10, 20, 30)),
  onboarded_at timestamptz,
  created_at   timestamptz not null default now()
);

-- 단어 마스터 (시드 스크립트가 service role로만 적재)
create table public.words (
  id         uuid primary key default gen_random_uuid(),
  headword   text not null check (headword = lower(btrim(headword)) and headword <> ''),
  pos        text not null check (pos <> ''),
  meaning_ko text not null,
  example_en text not null,
  example_ko text not null,
  tier       integer not null check (tier in (500, 600, 700, 800, 900)),
  day_no     integer not null check (day_no > 0),
  freq_rank  integer not null check (freq_rank > 0),
  source     text not null,
  created_at timestamptz not null default now(),
  unique (headword, pos)
);

-- 오늘의 학습 정렬 (tier -> day_no -> freq_rank), 퀴즈 오답 보기 추출(pos)
create index words_tier_day_rank_idx on public.words (tier, day_no, freq_rank);
create index words_pos_idx on public.words (pos);

-- 사용자별 단어 학습 진행 (행이 없으면 미학습 단어)
create table public.user_word_progress (
  user_id            uuid not null references public.profiles (id) on delete cascade,
  word_id            uuid not null references public.words (id) on delete restrict,
  status             text not null check (status in ('learning', 'mastered')),
  box                integer not null check (box between 0 and 4),
  next_review_at     date not null,
  correct_count      integer not null default 0 check (correct_count >= 0),
  wrong_count        integer not null default 0 check (wrong_count >= 0),
  correct_streak     integer not null default 0 check (correct_streak >= 0),
  first_studied_at   timestamptz not null,
  first_studied_date date generated always as ((first_studied_at at time zone 'Asia/Seoul')::date) stored,
  last_studied_at    timestamptz not null,
  last_wrong_at      timestamptz,
  primary key (user_id, word_id),
  check (status <> 'mastered' or box = 4)
);

-- 복습 대상, 오늘 학습량, 오답노트, word_id FK(restrict 검사)
create index uwp_user_review_idx on public.user_word_progress (user_id, next_review_at);
create index uwp_user_first_date_idx on public.user_word_progress (user_id, first_studied_date);
create index uwp_user_wrong_idx on public.user_word_progress (user_id) where wrong_count > 0;
create index uwp_word_idx on public.user_word_progress (word_id);

-- 학습 이벤트 로그 (플래시카드, 퀴즈 응답)
create table public.study_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  word_id    uuid not null references public.words (id) on delete restrict,
  activity   text not null check (activity in ('flashcard', 'quiz')),
  mode       text not null check (mode in ('learn', 'review', 'wrong_note', 'repeat')),
  result     text not null,
  study_date date not null,
  created_at timestamptz not null default now(),
  check (
    (activity = 'flashcard' and result in ('known', 'unknown'))
    or (activity = 'quiz' and result in ('correct', 'wrong'))
  )
);

-- 연속 학습일, 최근 7일 / (P1) Day별 정답률, word_id FK(restrict 검사)
create index study_events_user_date_idx on public.study_events (user_id, study_date);
create index study_events_user_activity_word_idx on public.study_events (user_id, activity, word_id);
create index study_events_word_idx on public.study_events (word_id);
