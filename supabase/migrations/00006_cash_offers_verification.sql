-- ============================================================
-- SwapCar — Migration 00006: Cash difference, offers, verification
-- ============================================================

-- 1. Cash adjustments per vehicle (stored from the owner's perspective)
-- positive = owner wants cash on top (buyer pays extra)
-- negative = owner is willing to add cash (owner pays extra)
-- null = owner did not specify
alter table public.vehicles add column if not exists cash_adjustment numeric;
alter table public.vehicles add column if not exists cash_currency text not null default 'USD';
alter table public.vehicles add column if not exists cash_adjustment_direction text check (cash_adjustment_direction in ('pay', 'receive', 'none'));
alter table public.vehicles add column if not exists only_hand_to_hand boolean not null default false;

-- 2. Structured offers (for chat)
create table if not exists public.offers (
  id                uuid primary key default gen_random_uuid(),
  match_id          uuid not null references public.matches(id) on delete cascade,
  sender_id         uuid not null references public.users(id) on delete cascade,
  receiver_id       uuid not null references public.users(id) on delete cascade,
  sender_vehicle_id uuid references public.vehicles(id) on delete set null,
  receiver_vehicle_id uuid references public.vehicles(id) on delete set null,
  cash_difference   numeric,
  cash_currency     text not null default 'USD',
  cash_direction    text check (cash_direction in ('sender_pays', 'receiver_pays', 'none')),
  message           text,
  status            text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'cancelled', 'countered')),
  is_counter        boolean not null default false,
  parent_offer_id   uuid references public.offers(id) on delete set null,
  expires_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.offers enable row level security;

create policy "Match participants can view offers"
  on public.offers for select
  using (
    exists (
      select 1 from public.matches
      where matches.id = offers.match_id
        and (matches.user1_id = auth.uid() or matches.user2_id = auth.uid())
    )
  );

create policy "Match participants can insert offers"
  on public.offers for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.matches
      where matches.id = match_id
        and (matches.user1_id = auth.uid() or matches.user2_id = auth.uid())
    )
  );

create policy "Match participants can update offers"
  on public.offers for update
  using (
    auth.uid() = sender_id
    and exists (
      select 1 from public.matches
      where matches.id = match_id
        and (matches.user1_id = auth.uid() or matches.user2_id = auth.uid())
    )
  );

-- 3. Photo verification log
create table if not exists public.photo_verifications (
  id              uuid primary key default gen_random_uuid(),
  photo_url       text not null,
  user_id         uuid not null references public.users(id) on delete cascade,
  vehicle_id      uuid references public.vehicles(id) on delete cascade,
  file_hash       text,
  perceptual_hash text,
  status          text not null default 'pending' check (status in ('pending', 'approved', 'manual_review', 'rejected')),
  rejection_reason text,
  ai_provider     text,
  ai_confidence   real,
  ai_result       jsonb,
  created_at      timestamptz not null default now(),
  reviewed_by     uuid references public.users(id) on delete set null,
  reviewed_at     timestamptz
);

alter table public.photo_verifications enable row level security;

create policy "Users can view own verifications"
  on public.photo_verifications for select
  using (auth.uid() = user_id);

create policy "Users can insert own verifications"
  on public.photo_verifications for insert
  with check (auth.uid() = user_id);

-- 4. User verification levels
create table if not exists public.user_verifications (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null unique references public.users(id) on delete cascade,
  email_verified    boolean not null default false,
  phone_verified    boolean not null default false,
  identity_verified boolean not null default false,
  vehicle_verified  boolean not null default false,
  identity_provider text,
  identity_ref_id   text,
  identity_verified_at timestamptz,
  phone             text,
  phone_verified_at timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.user_verifications enable row level security;

create policy "Users can view own verification"
  on public.user_verifications for select
  using (auth.uid() = user_id);

create policy "Users can upsert own verification"
  on public.user_verifications for insert
  with check (auth.uid() = user_id);

create policy "Users can update own verification"
  on public.user_verifications for update
  using (auth.uid() = user_id);

-- 5. Trust score
create table if not exists public.trust_scores (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null unique references public.users(id) on delete cascade,
  score                 smallint not null default 50 check (score >= 0 and score <= 100),
  account_age_days      int not null default 0,
  email_verified        boolean not null default false,
  phone_verified        boolean not null default false,
  identity_verified     boolean not null default false,
  vehicle_verified      boolean not null default false,
  photos_verified       int not null default 0,
  reports_received      int not null default 0,
  rejected_photos       int not null default 0,
  suspicious_activity   int not null default 0,
  failed_auth_attempts  int not null default 0,
  completed_ops         int not null default 0,
  updated_at            timestamptz not null default now()
);

alter table public.trust_scores enable row level security;

create policy "Users can view own trust score"
  on public.trust_scores for select
  using (auth.uid() = user_id);

-- 6. Session log (for suspicious activity detection)
create table if not exists public.session_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  ip_address  text,
  user_agent  text,
  action      text not null,
  metadata    jsonb default '{}',
  created_at  timestamptz not null default now()
);

alter table public.session_log enable row level security;

create policy "Users can view own session log"
  on public.session_log for select
  using (auth.uid() = user_id);

-- 7. Add verification fields to vehicles
alter table public.vehicles add column if not exists verification_status text default 'unverified'
  check (verification_status in ('unverified', 'pending', 'verified', 'rejected'));
alter table public.vehicles add column if not exists verification_reason text;
alter table public.vehicles add column if not exists photo_hashes jsonb default '[]';

-- 8. Function to calculate cash difference between two users' vehicles
-- Returns { amount, currency, from_perspective_of } where positive = "you receive cash"
create or replace function public.calculate_cash_difference(
  viewer_vehicle_id uuid,
  target_vehicle_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_value numeric;
  t_value numeric;
  v_cash_adj numeric;
  t_cash_adj numeric;
  v_cash_dir text;
  t_cash_dir text;
  diff numeric;
begin
  -- Get viewer vehicle
  select estimated_value, cash_adjustment, cash_adjustment_direction
  into v_value, v_cash_adj, v_cash_dir
  from public.vehicles where id = viewer_vehicle_id;

  -- Get target vehicle
  select estimated_value, cash_adjustment, cash_adjustment_direction
  into t_value, t_cash_adj, t_cash_dir
  from public.vehicles where id = target_vehicle_id;

  if v_value is null or t_value is null then
    return jsonb_build_object('amount', null, 'currency', 'USD', 'can_compute', false);
  end if;

  -- Base difference: target value minus viewer value
  diff := t_value - v_value;

  -- Apply cash adjustments if both have them
  if v_cash_adj is not null and v_cash_dir = 'pay' then
    diff := diff - v_cash_adj; -- viewer is willing to add cash
  elsif v_cash_adj is not null and v_cash_dir = 'receive' then
    diff := diff + v_cash_adj; -- viewer wants cash on top
  end if;

  if t_cash_adj is not null and t_cash_dir = 'pay' then
    diff := diff + t_cash_adj; -- target owner is willing to add cash
  elsif t_cash_adj is not null and t_cash_dir = 'receive' then
    diff := diff - t_cash_adj; -- target owner wants cash on top
  end if;

  -- From viewer's perspective:
  -- positive = viewer receives cash + the target vehicle
  -- negative = viewer must add cash + their vehicle
  return jsonb_build_object(
    'amount', diff,
    'currency', 'USD',
    'can_compute', true
  );
end;
$$;

-- Index for duplicate photo detection
create index if not exists idx_vehicles_hash on public.vehicles using gin (photo_hashes);
create index if not exists idx_photo_verifications_hash on public.photo_verifications (file_hash);
create index if not exists idx_photo_verifications_status on public.photo_verifications (status);
create index if not exists idx_session_log_user on public.session_log (user_id, created_at desc);
