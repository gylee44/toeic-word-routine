-- Pro 이용권 결제 주문과 이용 기간 (PRD 11.10)
-- 쓰기는 정책을 만들지 않는다. 주문 생성·승인 반영은 security definer RPC로만 한다.

-- Pro 이용 기간 끝 시각. null이거나 지난 시각이면 Pro가 아니다.
alter table public.profiles add column pro_until timestamptz;

-- 결제 주문 (주문 1건 = 토스 결제 1건)
create table public.payment_orders (
  id           uuid primary key default gen_random_uuid(),
  -- 토스 orderId 규칙: 영문 대소문자·숫자·-·_, 6~64자
  order_id     text not null unique check (order_id ~ '^[A-Za-z0-9_-]{6,64}$'),
  -- 결제 기록은 보관해야 하므로 사용자가 삭제돼도 행을 지우지 않고 user_id만 비운다
  user_id      uuid references public.profiles (id) on delete set null,
  product_code text not null check (product_code in ('pro_pass')),
  order_name   text not null check (order_name <> ''),
  -- 금액과 이용 일수는 주문 생성 시점에 서버가 정해 저장한다 (클라이언트 값을 받지 않음)
  amount       integer not null check (amount > 0),
  pro_days     integer not null check (pro_days between 1 and 365),
  status       text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'canceled')),
  payment_key  text unique check (payment_key <> ''),
  method       text,
  approved_at  timestamptz,
  canceled_at  timestamptz,
  fail_code    text,
  fail_message text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- 상태별 필수 값
  check (status <> 'pending' or (payment_key is null and approved_at is null and canceled_at is null and fail_code is null)),
  check (status <> 'paid' or (payment_key is not null and approved_at is not null and canceled_at is null and fail_code is null)),
  check (status <> 'failed' or (fail_code is not null and approved_at is null)),
  check (status <> 'canceled' or canceled_at is not null)
);

-- 내 결제 내역(최신순), user_id FK(set null 처리)
create index payment_orders_user_created_idx on public.payment_orders (user_id, created_at desc);

-- 본인 주문만 조회
alter table public.payment_orders enable row level security;

create policy payment_orders_select_own on public.payment_orders
  for select to authenticated
  using (user_id = (select auth.uid()));

-- 정책 실수에 대비해 테이블 권한도 회수한다 (Supabase는 기본으로 부여함)
revoke all on public.payment_orders from anon;
revoke all on public.payment_orders from authenticated;
grant select on public.payment_orders to authenticated;
