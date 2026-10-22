-- PRD v0.9: Pro 이용권 결제 RPC, 하루 신규 학습 상한 예외(관리자 + Pro) 판정 통합 (FR-05, FR-12, 11.10)

-- 1. 하루 신규 학습 상한 예외 판정: 관리자이거나 Pro 이용 기간 중이면 true
--    get_today_words, get_home_summary는 security invoker라 호출자 권한으로 실행된다.
--    본인 프로필만 조회하므로(RLS) 다른 사용자의 상태는 알 수 없다.
create function public.has_unlimited_learning()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
     where id = auth.uid()
       and (role = 'admin' or pro_until > now())
  )
$$;

revoke execute on function public.has_unlimited_learning() from public, anon;
grant execute on function public.has_unlimited_learning() to authenticated;

-- 2. 오늘의 학습 단어: 상한 예외 판정만 has_unlimited_learning()으로 바꾼다
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
  v_start_tier integer;
  v_goal integer;
  v_target integer;
  v_learned integer;
  v_count integer;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다' using errcode = '28000';
  end if;

  select start_tier, daily_goal, target_score
    into v_start_tier, v_goal, v_target
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
  if not public.has_unlimited_learning() then
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

-- 3. 플래시카드 응답: 상한 예외 판정만 has_unlimited_learning()으로 바꾼다
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
  select target_score into v_target
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
    if not public.has_unlimited_learning() then
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

-- 4. 홈 요약: 상한 예외(관리자 + Pro)면 remaining_new를 null로 반환
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

  select daily_goal, target_score into v_goal, v_target
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
    'remaining_new', case when public.has_unlimited_learning() then null else greatest(v_cap - v_learned, 0) end,
    'review_due', v_review,
    'streak', v_streak,
    'studied_dates', to_jsonb(v_dates)
  );
end;
$$;

-- 5. 결제 주문 생성: 가격·기간·주문명은 서버가 정한다 (클라이언트는 상품 코드만 보낸다)
create function public.create_payment_order(p_product_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_amount integer;
  v_days integer;
  v_name text;
  v_order_id text;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다' using errcode = '28000';
  end if;

  -- 상품 가격표 (서버 기준)
  case p_product_code
    when 'pro_pass' then
      v_amount := 1000;
      v_days := 30;
      v_name := 'Pro 이용권 30일';
    else
      raise exception '잘못된 요청입니다' using errcode = '22023';
  end case;

  -- 같은 사용자의 동시 요청이 아래 개수 검사를 우회하지 못하도록 프로필 행을 잠근다
  perform 1 from public.profiles where id = v_uid for update;
  if not found then
    raise exception '프로필이 없습니다' using errcode = 'P0001';
  end if;

  -- 주문 남발 방지: 최근 10분 안에 결제하지 않은 주문이 5건 이상이면 거부
  if (select count(*) from public.payment_orders
       where user_id = v_uid and status = 'pending' and created_at > now() - interval '10 minutes') >= 5 then
    raise exception '결제 요청이 많아요. 잠시 후 다시 시도해 주세요' using errcode = 'P0001';
  end if;

  -- 토스 orderId 규칙(영문·숫자·-·_, 6~64자)에 맞춘 추측할 수 없는 값
  v_order_id := 'pro_' || replace(gen_random_uuid()::text, '-', '');

  insert into public.payment_orders (order_id, user_id, product_code, order_name, amount, pro_days)
  values (v_order_id, v_uid, p_product_code, v_name, v_amount, v_days);

  return jsonb_build_object('order_id', v_order_id, 'amount', v_amount, 'order_name', v_name);
end;
$$;

revoke execute on function public.create_payment_order(text) from public, anon;
grant execute on function public.create_payment_order(text) to authenticated;

-- 6. 결제 승인 반영 (승인 Edge Function이 토스 승인 성공 후 service role로만 호출)
--    주문을 paid로 바꾸고 Pro 기간을 연장한다. 이미 처리한 주문이면 다시 연장하지 않는다.
create function public.complete_payment(
  p_order_id text, p_payment_key text, p_method text, p_approved_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.payment_orders%rowtype;
  v_until timestamptz;
begin
  if p_order_id is null or p_payment_key is null or p_payment_key = '' then
    raise exception '잘못된 요청입니다' using errcode = '22023';
  end if;

  -- 같은 주문의 동시 승인 반영을 막기 위해 주문 행을 잠근다
  select * into v_order from public.payment_orders where order_id = p_order_id for update;
  if not found then
    raise exception '존재하지 않는 주문입니다' using errcode = 'P0002';
  end if;

  if v_order.status = 'paid' then
    if v_order.payment_key <> p_payment_key then
      raise exception '이미 다른 결제로 처리된 주문입니다' using errcode = 'P0001';
    end if;
    select pro_until into v_until from public.profiles where id = v_order.user_id;
    return jsonb_build_object('status', 'paid', 'pro_until', v_until, 'already_processed', true);
  end if;

  if v_order.status <> 'pending' or v_order.user_id is null then
    raise exception '처리할 수 없는 주문입니다' using errcode = 'P0001';
  end if;

  update public.payment_orders
     set status = 'paid',
         payment_key = p_payment_key,
         method = p_method,
         approved_at = coalesce(p_approved_at, now()),
         updated_at = now()
   where id = v_order.id;

  -- 이용 중에 다시 사면 남은 기간 뒤로 이어 붙인다
  update public.profiles
     set pro_until = greatest(coalesce(pro_until, now()), now()) + make_interval(days => v_order.pro_days)
   where id = v_order.user_id
  returning pro_until into v_until;

  return jsonb_build_object('status', 'paid', 'pro_until', v_until, 'already_processed', false);
end;
$$;

revoke execute on function public.complete_payment(text, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.complete_payment(text, text, text, timestamptz) to service_role;

-- 7. 결제 승인 실패 기록 (승인 Edge Function이 service role로만 호출). pending 주문만 바꾼다
create function public.fail_payment(p_order_id text, p_code text, p_message text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.payment_orders
     set status = 'failed',
         fail_code = left(coalesce(nullif(p_code, ''), 'UNKNOWN'), 100),
         fail_message = left(p_message, 500),
         updated_at = now()
   where order_id = p_order_id and status = 'pending';
end;
$$;

revoke execute on function public.fail_payment(text, text, text) from public, anon, authenticated;
grant execute on function public.fail_payment(text, text, text) to service_role;
