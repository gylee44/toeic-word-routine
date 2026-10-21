-- 퀴즈 정답의 단계 상승은 단어마다 하루 한 번만 (PRD v0.7, FR-06)
-- 같은 날 같은 단어를 다시 맞혀도 box, 다음 복습일, 연속 정답(correct_streak)은 바뀌지 않는다.
-- 정답 기록(study_events, correct_count)은 그대로 남기고, 오답은 언제든 box 0으로 초기화한다.
create or replace function public.record_quiz_answer(p_word_id uuid, p_choice_word_id uuid, p_mode text)
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
  v_already_up boolean;
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

  -- 진행 행을 먼저 잠가서 같은 단어의 동시 응답을 직렬화한 뒤 오늘 정답 여부를 확인한다
  select * into v_progress
    from public.user_word_progress
   where user_id = v_uid and word_id = p_word_id
     for update;
  if not found then
    raise exception '학습 기록이 없는 단어입니다' using errcode = 'P0002';
  end if;

  v_correct := (p_word_id = p_choice_word_id);

  if v_correct then
    select exists (
      select 1 from public.study_events
       where user_id = v_uid and word_id = p_word_id
         and activity = 'quiz' and result = 'correct' and study_date = v_today
    ) into v_already_up;

    if v_already_up then
      -- 오늘 이미 맞힌 단어: 단계·복습일·연속 정답은 그대로 두고 기록만 남긴다
      update public.user_word_progress
         set correct_count = correct_count + 1,
             last_studied_at = now()
       where user_id = v_uid and word_id = p_word_id;
    else
      v_box := least(v_progress.box + 1, 4);
      update public.user_word_progress
         set box = v_box,
             status = case when v_progress.box = 4 then 'mastered' else v_progress.status end,
             next_review_at = v_today + v_intervals[v_box + 1],
             correct_count = correct_count + 1,
             correct_streak = correct_streak + 1,
             last_studied_at = now()
       where user_id = v_uid and word_id = p_word_id;
    end if;
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
