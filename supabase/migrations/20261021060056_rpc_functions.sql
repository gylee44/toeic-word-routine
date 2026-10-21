-- 서버 함수(RPC) (PRD 11.5)
-- 공통: auth.uid() 기준, NULL이면 예외, search_path 고정, authenticated에만 실행 권한 부여.
-- SRS 간격은 box 0~4 -> [0, 1, 3, 7, 14]일 (constants.ts의 SRS_INTERVALS와 같은 값 유지).

-- 온보딩 저장: 시작 tier는 서버가 목표 점수로 계산한다 (constants.ts의 START_TIER_BY_TARGET과 같은 값)
create function public.save_onboarding(p_target_score integer, p_daily_goal integer)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_start_tier integer;
  v_profile public.profiles;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다' using errcode = '28000';
  end if;
  if p_target_score is null or p_target_score not in (500, 600, 700, 800, 900) then
    raise exception '허용되지 않은 목표 점수입니다' using errcode = '22023';
  end if;
  if p_daily_goal is null or p_daily_goal not in (10, 20, 30) then
    raise exception '허용되지 않은 하루 학습 단어 수입니다' using errcode = '22023';
  end if;

  v_start_tier := case p_target_score
    when 500 then 500
    when 600 then 500
    when 700 then 600
    when 800 then 700
    else 800
  end;

  update public.profiles
     set target_score = p_target_score,
         start_tier   = v_start_tier,
         daily_goal   = p_daily_goal,
         onboarded_at = coalesce(onboarded_at, now())
   where id = v_uid
   returning * into v_profile;

  if not found then
    raise exception '프로필을 찾을 수 없습니다' using errcode = 'P0002';
  end if;
  return v_profile;
end;
$$;

-- 오늘의 학습 단어: 시작 tier 이상 오름차순 -> 그보다 낮은 tier -> day_no -> freq_rank
-- 개수: 기본은 하루 목표 - 오늘 학습량, p_extra는 하루 목표만큼
create function public.get_today_words(p_extra boolean default false)
returns setof public.words
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_today date := (now() at time zone 'Asia/Seoul')::date;
  v_start_tier integer;
  v_goal integer;
  v_count integer;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다' using errcode = '28000';
  end if;

  select start_tier, daily_goal into v_start_tier, v_goal
    from public.profiles where id = v_uid and onboarded_at is not null;
  if not found then
    raise exception '온보딩을 완료해야 합니다' using errcode = 'P0001';
  end if;

  if coalesce(p_extra, false) then
    v_count := v_goal;
  else
    select greatest(v_goal - count(*), 0) into v_count
      from public.user_word_progress
     where user_id = v_uid and first_studied_date = v_today;
  end if;

  return query
    select w.*
      from public.words w
     where not exists (
       select 1 from public.user_word_progress p
        where p.user_id = v_uid and p.word_id = w.id
     )
     order by (w.tier < v_start_tier), w.tier, w.day_no, w.freq_rank
     limit v_count;
end;
$$;

-- 플래시카드 응답: 첫 응답이면 진행 행 생성(box 결정), 이미 있으면 last_studied_at만 갱신
create function public.record_flashcard(p_word_id uuid, p_known boolean, p_mode text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_today date := (now() at time zone 'Asia/Seoul')::date;
  v_intervals integer[] := array[0, 1, 3, 7, 14];
  v_box integer;
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

  v_box := case when p_known then 1 else 0 end;

  insert into public.user_word_progress as p (
    user_id, word_id, status, box, next_review_at, first_studied_at, last_studied_at
  ) values (
    v_uid, p_word_id, 'learning', v_box, v_today + v_intervals[v_box + 1], now(), now()
  )
  on conflict (user_id, word_id) do update
    set last_studied_at = now();

  insert into public.study_events (user_id, word_id, activity, mode, result, study_date)
  values (v_uid, p_word_id, 'flashcard', p_mode,
          case when p_known then 'known' else 'unknown' end, v_today);
end;
$$;

-- 퀴즈 보기: 정답 1개 + 오답 3개(같은 품사 우선, 같은 뜻 제외), 정답 표시 없이 섞어서 반환
create function public.get_quiz_choices(p_word_id uuid)
returns table (id uuid, meaning_ko text)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_word public.words;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다' using errcode = '28000';
  end if;
  if p_word_id is null then
    raise exception '잘못된 요청입니다' using errcode = '22023';
  end if;

  select * into v_word from public.words w where w.id = p_word_id;
  if not found then
    raise exception '존재하지 않는 단어입니다' using errcode = 'P0002';
  end if;

  return query
    select c.id, c.meaning_ko
      from (
        select v_word.id, v_word.meaning_ko
        union all
        (select w.id, w.meaning_ko
           from public.words w
          where w.id <> v_word.id and w.meaning_ko <> v_word.meaning_ko
          order by (w.pos = v_word.pos) desc, random()
          limit 3)
      ) as c(id, meaning_ko)
     order by random();
end;
$$;

-- 퀴즈 채점: 서버에서 정답 판정, SRS 갱신, 이벤트 기록 (진행 정보가 없는 단어는 오류)
create function public.record_quiz_answer(p_word_id uuid, p_choice_word_id uuid, p_mode text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_today date := (now() at time zone 'Asia/Seoul')::date;
  v_intervals integer[] := array[0, 1, 3, 7, 14];
  v_progress public.user_word_progress;
  v_correct boolean;
  v_box integer;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다' using errcode = '28000';
  end if;
  if p_word_id is null or p_choice_word_id is null or p_mode is null
     or p_mode not in ('learn', 'review', 'wrong_note', 'repeat') then
    raise exception '잘못된 요청입니다' using errcode = '22023';
  end if;
  if not exists (select 1 from public.words where id = p_word_id)
     or not exists (select 1 from public.words where id = p_choice_word_id) then
    raise exception '존재하지 않는 단어입니다' using errcode = 'P0002';
  end if;

  select * into v_progress
    from public.user_word_progress
   where user_id = v_uid and word_id = p_word_id
     for update;
  if not found then
    raise exception '학습 기록이 없는 단어입니다' using errcode = 'P0002';
  end if;

  v_correct := (p_word_id = p_choice_word_id);

  if v_correct then
    v_box := least(v_progress.box + 1, 4);
    update public.user_word_progress
       set box = v_box,
           status = case when v_progress.box = 4 then 'mastered' else v_progress.status end,
           next_review_at = v_today + v_intervals[v_box + 1],
           correct_count = correct_count + 1,
           correct_streak = correct_streak + 1,
           last_studied_at = now()
     where user_id = v_uid and word_id = p_word_id;
  else
    update public.user_word_progress
       set box = 0,
           status = 'learning',
           next_review_at = v_today,
           wrong_count = wrong_count + 1,
           correct_streak = 0,
           last_wrong_at = now(),
           last_studied_at = now()
     where user_id = v_uid and word_id = p_word_id;
  end if;

  insert into public.study_events (user_id, word_id, activity, mode, result, study_date)
  values (v_uid, p_word_id, 'quiz', p_mode,
          case when v_correct then 'correct' else 'wrong' end, v_today);

  return v_correct;
end;
$$;

-- 홈 요약: 오늘 학습량, 하루 목표, 복습 대기 수, 연속 학습일, 최근 7일 학습 날짜
create function public.get_home_summary()
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_today date := (now() at time zone 'Asia/Seoul')::date;
  v_goal integer;
  v_learned integer;
  v_review integer;
  v_start date;
  v_streak integer := 0;
  v_dates date[];
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다' using errcode = '28000';
  end if;

  select daily_goal into v_goal from public.profiles where id = v_uid;

  select count(*) filter (where first_studied_date = v_today),
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
    'review_due', v_review,
    'streak', v_streak,
    'studied_dates', to_jsonb(v_dates)
  );
end;
$$;

-- 실행 권한: public, anon 회수 후 authenticated에만 부여
revoke execute on function public.save_onboarding(integer, integer) from public, anon;
revoke execute on function public.get_today_words(boolean) from public, anon;
revoke execute on function public.record_flashcard(uuid, boolean, text) from public, anon;
revoke execute on function public.get_quiz_choices(uuid) from public, anon;
revoke execute on function public.record_quiz_answer(uuid, uuid, text) from public, anon;
revoke execute on function public.get_home_summary() from public, anon;

grant execute on function public.save_onboarding(integer, integer) to authenticated;
grant execute on function public.get_today_words(boolean) to authenticated;
grant execute on function public.record_flashcard(uuid, boolean, text) to authenticated;
grant execute on function public.get_quiz_choices(uuid) to authenticated;
grant execute on function public.record_quiz_answer(uuid, uuid, text) to authenticated;
grant execute on function public.get_home_summary() to authenticated;
