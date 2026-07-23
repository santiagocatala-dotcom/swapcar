-- ============================================================
-- SwapCar — Migration 00005: Rate limiting & orphan cleanup
-- ============================================================

-- 1. Rate limiting table
create table if not exists public.rate_limits (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.users(id) on delete cascade,
  ip_address    text,
  action_type   text not null,
  created_at    timestamptz not null default now()
);

create index if not exists idx_rate_limits_lookup
  on public.rate_limits (action_type, coalesce(user_id::text, ip_address), created_at desc);

alter table public.rate_limits enable row level security;

-- Only service_role can write (API routes will use service_role client)
create policy "Service role can manage rate_limits"
  on public.rate_limits
  using (true);

-- 2. RPC: check rate limit
create or replace function public.check_rate_limit(
  p_user_id uuid,
  p_ip_address text,
  p_action_type text,
  p_max_requests int,
  p_window_seconds int
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  identifier text;
  current_count int;
begin
  identifier := coalesce(p_user_id::text, p_ip_address, 'unknown');

  -- Clean old entries
  delete from public.rate_limits
  where action_type = p_action_type
    and coalesce(user_id::text, ip_address) = identifier
    and created_at < now() - (p_window_seconds || ' seconds')::interval;

  -- Count recent entries
  select count(*) into current_count
  from public.rate_limits
  where action_type = p_action_type
    and coalesce(user_id::text, ip_address) = identifier;

  if current_count >= p_max_requests then
    return false; -- rate limited
  end if;

  -- Log this action
  insert into public.rate_limits (user_id, ip_address, action_type)
  values (p_user_id, p_ip_address, p_action_type);

  return true; -- allowed
end;
$$;

-- 3. Procedure: clean up old rate limit entries (run daily)
create or replace function public.cleanup_rate_limits()
returns void
language plpgsql
security definer
as $$
begin
  delete from public.rate_limits
  where created_at < now() - interval '24 hours';
end;
$$;

-- 4. Orphan cleanup: actually delete photos from storage
-- Call this from a cron job periodically
create or replace function public.get_pending_deletions()
returns table (
  log_id uuid,
  storage_paths text[],
  vehicle_id uuid,
  user_id uuid
)
language plpgsql
security definer
as $$
begin
  return query
  select
    dl.id as log_id,
    array(select jsonb_array_elements_text(dl.metadata->'photos')) as storage_paths,
    dl.entity_id as vehicle_id,
    dl.user_id
  from public.deletion_log dl
  where dl.processed = false
    and dl.entity_type = 'vehicle'
  limit 50;
end;
$$;

-- 5. Mark deletion_log as processed
create or replace function public.mark_deletions_processed(p_log_ids uuid[])
returns void
language plpgsql
security definer
as $$
begin
  update public.deletion_log
  set processed = true
  where id = any(p_log_ids);
end;
$$;
