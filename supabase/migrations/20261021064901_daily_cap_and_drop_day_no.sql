-- PRD v0.6: Day를 연속 학습일로 재정의 (words.day_no 삭제), 하루 신규 학습 상한 40개,
-- 목표 점수별 상한 집계(user_word_progress.target_score), 복습일 분산(+1/+2일)

-- 1. words.day_no 삭제 (day_no를 포함한 기존 인덱스도 함께 삭제된다)
alter table public.words drop column day_no;
create index words_tier_rank_idx on public.words (tier, freq_rank);

-- 2. 처음 학습한 시점의 목표 점수 (하루 상한을 목표 점수별로 세기 위함)
--    기존 학습 기록이 없을 때만 NOT NULL로 바로 추가할 수 있다.
alter table public.user_word_progress
  add column target_score integer not null check (target_score in (500, 600, 700, 800, 900));

-- 3. 하루 신규 학습 상한 (서버 SQL이 기준, constants.ts는 화면 표시용으로 같은 값 유지)
create function public.daily_new_word_limit()
returns integer
language sql
immutable
set search_path = public
as $$ select 40 $$;

revoke execute on function public.daily_new_word_limit() from public, anon;
grant execute on function public.daily_new_word_limit() to authenticated;

-- 4. 오늘의 학습 단어: 현재 목표 점수 기준 오늘 학습량과 하루 상한을 반영한다 (관리자는 상한 없음)
create or replace function public.get_today_words(p_extra boolean default false)
returns setof public.words
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_today date := (now() at time zone 'Asia/Seoul')::date;
  v_cap integer := public.daily_new_word_limit();
  v_role text;
  v_start_tier integer;
  v_goal integer;
  v_target integer;
  v_learned integer;
  v_count integer;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다' using errcode = '28000';
  end if;

  select role, start_tier, daily_goal, target_score
    into v_role, v_start_tier, v_goal, v_target
    from public.profiles where id = v_uid and onboarded_at is not null;
  if not found then
    raise exception '온보딩을 완료해야 합니다' using errcode = 'P0001';
  end if;

  select count(*) into v_learned
    from public.user_word_progress
   where user_id = v_uid and first_studied_date = v_today and target_score = v_target;

  if coalesce(p_extra, false) then
    v_count := v_goal;
  else
    v_count := greatest(v_goal - v_learned, 0);
  end if;
  if v_role <> 'admin' then
    v_count := least(v_count, greatest(v_cap - v_learned, 0));
  end if;

  return query
    select w.*
      from public.words w
     where not exists (
       select 1 from public.user_word_progress p
        where p.user_id = v_uid and p.word_id = w.id
     )
     order by (w.tier < v_start_tier), w.tier, w.freq_rank
     limit v_count;
end;
$$;

-- 5. 플래시카드 응답: 새 단어면 하루 상한 검사(관리자 제외), target_score 저장, 알아요 복습일 +1/+2일 분산
create or replace function public.record_flashcard(p_word_id uuid, p_known boolean, p_mode text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_today date := (now() at time zone 'Asia/Seoul')::date;
  v_cap integer := public.daily_new_word_limit();
  v_role text;
  v_target integer;
  v_learned integer;
  v_known_today integer;
  v_box integer;
  v_days integer;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다' using errcode = '28000';
  end if;
  if p_word_id is null or p_known is null or p_mode is null
     or p_mode not in ('learn', 'review', 'wrong_note', 'repeat') then
    raise exception '잘못된 요청입니다' using errcode = '22023';
  end if;
  if not exists (select 1 from public.words where id = p_word_id) then
    raise exception '존재하지 않는 단어입니다' using errcode = 'P0002';
  end if;

  -- 같은 사용자의 동시 요청이 상한 검사를 우회하지 못하도록 프로필 행을 잠근다
  select role, target_score into v_role, v_target
    from public.profiles where id = v_uid and onboarded_at is not null
    for update;
  if not found then
    raise exception '온보딩을 완료해야 합니다' using errcode = 'P0001';
  end if;

  if exists (select 1 from public.user_word_progress where user_id = v_uid and word_id = p_word_id) then
    -- 이미 학습한 단어는 복습 단계와 복습일을 바꾸지 않고 기록만 남긴다
    update public.user_word_progress
       set last_studied_at = now()
     where user_id = v_uid and word_id = p_word_id;
  else
    if v_role <> 'admin' then
      select count(*) into v_learned
        from public.user_word_progress
       where user_id = v_uid and first_studied_date = v_today and target_score = v_target;
      if v_learned >= v_cap then
        raise exception '오늘 학습할 수 있는 단어를 모두 학습했습니다' using errcode = 'P0001';
      end if;
    end if;

    -- 복습일 분산: 오늘 "알아요"로 시작한 단어의 순서가 짝수면 +1일, 홀수면 +2일
    select count(*) into v_known_today
      from public.user_word_progress
     where user_id = v_uid and first_studied_date = v_today and next_review_at > v_today;
    v_box := case when p_known then 1 else 0 end;
    v_days := case when not p_known then 0 when v_known_today % 2 = 0 then 1 else 2 end;

    insert into public.user_word_progress (
      user_id, word_id, status, box, next_review_at, first_studied_at, last_studied_at, target_score
    ) values (
      v_uid, p_word_id, 'learning', v_box, v_today + v_days, now(), now(), v_target
    );
  end if;

  insert into public.study_events (user_id, word_id, activity, mode, result, study_date)
  values (v_uid, p_word_id, 'flashcard', p_mode,
          case when p_known then 'known' else 'unknown' end, v_today);
end;
$$;

-- 6. 홈 요약: 오늘 학습량을 현재 목표 점수 기준으로 세고, 하루 상한과 남은 학습 수를 함께 반환
create or replace function public.get_home_summary()
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_today date := (now() at time zone 'Asia/Seoul')::date;
  v_cap integer := public.daily_new_word_limit();
  v_role text;
  v_goal integer;
  v_target integer;
  v_learned integer;
  v_review integer;
  v_start date;
  v_streak integer := 0;
  v_dates date[];
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다' using errcode = '28000';
  end if;

  select role, daily_goal, target_score into v_role, v_goal, v_target
    from public.profiles where id = v_uid;

  select count(*) filter (where first_studied_date = v_today and target_score = v_target),
         count(*) filter (where next_review_at <= v_today)
    into v_learned, v_review
    from public.user_word_progress
   where user_id = v_uid;

  -- 연속 학습일: 오늘 기록이 있으면 오늘부터, 없으면 어제부터 센다
  select case
           when bool_or(study_date = v_today) then v_today
           when bool_or(study_date = v_today - 1) then v_today - 1
         end
    into v_start
    from public.study_events
   where user_id = v_uid and study_date >= v_today - 1;

  if v_start is not null then
    with d as (
      select distinct study_date
        from public.study_events
       where user_id = v_uid and study_date <= v_start
    ), r as (
      select study_date,
             study_date + (row_number() over (order by study_date desc))::integer as grp
        from d
    )
    select count(*) into v_streak
      from r
     where grp = (select grp from r where study_date = v_start);
  end if;

  select coalesce(array_agg(study_date order by study_date), '{}')
    into v_dates
    from (
      select distinct study_date
        from public.study_events
       where user_id = v_uid and study_date between v_today - 6 and v_today
    ) s;

  return jsonb_build_object(
    'today_learned', v_learned,
    'daily_goal', v_goal,
    'daily_cap', v_cap,
    'remaining_new', case when v_role = 'admin' then null else greatest(v_cap - v_learned, 0) end,
    'review_due', v_review,
    'streak', v_streak,
    'studied_dates', to_jsonb(v_dates)
  );
end;
$$;
