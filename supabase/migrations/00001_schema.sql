-- ============================================================
-- SwapCar — Database Schema (Migration 00001)
-- Full schema: users, vehicles, preferences, swipes, matches,
-- messages, triggers, RLS policies, and performance indexes.
-- ============================================================

-- 0. Extensions
-- ============================================================
create extension if not exists "pgcrypto";

-- 1. Users
-- ============================================================
create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  name          text not null,
  avatar_url    text,
  province      text,
  city          text,
  created_at    timestamptz not null default now(),
  last_seen     timestamptz not null default now()
);

-- 2. Vehicles (1 per user)
-- ============================================================
create table if not exists public.vehicles (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null unique references public.users(id) on delete cascade,
  brand           text not null,
  model           text not null,
  version         text,
  year            integer not null check (year >= 1900 and year <= extract(year from now()) + 1),
  kilometers      integer check (kilometers >= 0),
  fuel_type       text,
  transmission    text,
  color           text,
  photos          text[] not null default '{}',
  video_url       text,
  description     text,
  estimated_value numeric check (estimated_value >= 0),
  license_plate   text,
  vin             text,
  created_at      timestamptz not null default now()
);

-- 3. Preferences (1 per user)
-- ============================================================
create table if not exists public.preferences (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null unique references public.users(id) on delete cascade,
  vehicle_types           text[] not null default '{}',
  preferred_brands        text[] not null default '{}',
  preferred_models        text[] not null default '{}',
  min_year                integer check (min_year >= 1900),
  max_kilometers          integer check (max_kilometers >= 0),
  fuel_types              text[] not null default '{}',
  transmission_types      text[] not null default '{}',
  max_distance_km         integer not null default 100 check (max_distance_km >= 0),
  min_value               numeric check (min_value >= 0),
  max_value               numeric check (max_value >= 0),
  max_difference_i_pay    numeric check (max_difference_i_pay >= 0),
  max_difference_i_receive numeric check (max_difference_i_receive >= 0),
  accept_multiple_vehicles boolean not null default false,
  accept_cash              boolean not null default false,
  accept_financing         boolean not null default false,
  only_in_person           boolean not null default false
);

-- 4. Swipes (directed edges: swiper_id -> target_user_id)
-- ============================================================
create type public.swipe_direction as enum ('like', 'dislike', 'favorite');

create table if not exists public.swipes (
  id              uuid primary key default gen_random_uuid(),
  swiper_id       uuid not null references public.users(id) on delete cascade,
  target_user_id  uuid not null references public.users(id) on delete cascade,
  direction       public.swipe_direction not null,
  created_at      timestamptz not null default now(),
  -- A user can swipe on another user only once
  unique (swiper_id, target_user_id)
);

-- 5. Matches (mutual likes)
-- ============================================================
create table if not exists public.matches (
  id                  uuid primary key default gen_random_uuid(),
  user1_id            uuid not null references public.users(id) on delete cascade,
  user2_id            uuid not null references public.users(id) on delete cascade,
  compatibility_score smallint check (compatibility_score >= 0 and compatibility_score <= 100),
  swapped_at          timestamptz,
  created_at          timestamptz not null default now(),
  -- Enforce consistent ordering: user1_id < user2_id to prevent duplicates
  constraint matches_users_check check (user1_id < user2_id),
  unique (user1_id, user2_id)
);

-- 6. Messages
-- ============================================================
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  match_id        uuid not null references public.matches(id) on delete cascade,
  sender_id       uuid not null references public.users(id) on delete cascade,
  content         text,
  image_url       text,
  location        jsonb,
  phone_shared    boolean not null default false,
  whatsapp_shared boolean not null default false,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- Triggers
-- ============================================================

-- Trigger function: auto-create match on reciprocal 'like' swipes
create or replace function public.handle_reciprocal_like()
returns trigger
language plpgsql
security definer
as $$
declare
  reverse_direction public.swipe_direction;
begin
  -- If this is a 'like' we need to check if the reverse swipe also exists as 'like'
  if new.direction = 'like' then
    select direction into reverse_direction
    from public.swipes
    where swiper_id = new.target_user_id
      and target_user_id = new.swiper_id
      and direction = 'like';

    if found then
      -- Both users liked each other — create a match
      -- Normalise IDs so user1_id < user2_id
      insert into public.matches (user1_id, user2_id)
      values (
        least(new.swiper_id, new.target_user_id),
        greatest(new.swiper_id, new.target_user_id)
      )
      on conflict (user1_id, user2_id) do nothing;
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_after_swipe_insert
  after insert on public.swipes
  for each row
  execute function public.handle_reciprocal_like();

-- Trigger function: update last_seen on user activity
create or replace function public.update_last_seen()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.users
  set last_seen = now()
  where id = new.sender_id;
  return new;
end;
$$;

create trigger trg_after_message_insert
  after insert on public.messages
  for each row
  execute function public.update_last_seen();

-- ============================================================
-- Row-Level Security (RLS)
-- ============================================================

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.vehicles enable row level security;
alter table public.preferences enable row level security;
alter table public.swipes enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;

-- ---- users ----
-- Anyone can view other users' basic info (needed for swiping)
create policy "Users can view all users"
  on public.users for select
  using (true);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- ---- vehicles ----
-- Anyone can view vehicles (needed for swiping)
create policy "Anyone can view vehicles"
  on public.vehicles for select
  using (true);

-- Users can insert/update/delete their own vehicle
create policy "Users manage own vehicle"
  on public.vehicles for insert
  with check (auth.uid() = user_id);

create policy "Users update own vehicle"
  on public.vehicles for update
  using (auth.uid() = user_id);

create policy "Users delete own vehicle"
  on public.vehicles for delete
  using (auth.uid() = user_id);

-- ---- preferences ----
-- Anyone can view preferences (needed for compatibility calc)
create policy "Anyone can view preferences"
  on public.preferences for select
  using (true);

-- Users can manage their own preferences
create policy "Users manage own preferences"
  on public.preferences for insert
  with check (auth.uid() = user_id);

create policy "Users update own preferences"
  on public.preferences for update
  using (auth.uid() = user_id);

create policy "Users delete own preferences"
  on public.preferences for delete
  using (auth.uid() = user_id);

-- ---- swipes ----
-- Users can see their own outgoing swipes
create policy "Users view own swipes"
  on public.swipes for select
  using (auth.uid() = swiper_id);

-- Users can see swipes directed at them (to know if they've been liked)
create policy "Users view swipes directed at them"
  on public.swipes for select
  using (auth.uid() = target_user_id);

-- Users can insert their own swipes
create policy "Users insert own swipes"
  on public.swipes for insert
  with check (auth.uid() = swiper_id);

-- ---- matches ----
-- Both participants can view their matches
create policy "Participants view matches"
  on public.matches for select
  using (auth.uid() = user1_id or auth.uid() = user2_id);

-- ---- messages ----
-- Match participants can view messages in their matches
create policy "Match participants view messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.matches
      where matches.id = messages.match_id
        and (matches.user1_id = auth.uid() or matches.user2_id = auth.uid())
    )
  );

-- Match participants can send messages in their matches
create policy "Match participants send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.matches
      where matches.id = match_id
        and (matches.user1_id = auth.uid() or matches.user2_id = auth.uid())
    )
  );

-- ============================================================
-- Performance Indexes
-- ============================================================

-- Users
create index idx_users_province_city on public.users (province, city);
create index idx_users_created_at on public.users (created_at);

-- Vehicles
create index idx_vehicles_user_id on public.vehicles (user_id);
create index idx_vehicles_brand_model on public.vehicles (brand, model);
create index idx_vehicles_year on public.vehicles (year);
create index idx_vehicles_estimated_value on public.vehicles (estimated_value);

-- Preferences
create index idx_preferences_user_id on public.preferences (user_id);

-- Swipes: fast lookup for "has user X swiped on user Y?"
create index idx_swipes_swiper_target on public.swipes (swiper_id, target_user_id);
create index idx_swipes_target_direction on public.swipes (target_user_id, direction);

-- Matches: fast lookup for a user's matches
create index idx_matches_user1 on public.matches (user1_id, created_at desc);
create index idx_matches_user2 on public.matches (user2_id, created_at desc);

-- Messages: chronological order per match
create index idx_messages_match_id on public.messages (match_id, created_at asc);
create index idx_messages_sender on public.messages (sender_id);
