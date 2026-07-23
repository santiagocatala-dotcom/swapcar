-- ============================================================
-- SwapCar — Migration 00004: Security fixes & orphan cleanup
-- ============================================================

-- 1. Process deletion_log entries — cleanup worker function
create or replace function public.process_deletion_log()
returns void
language plpgsql
security definer
as $$
declare
  entry record;
  photo text;
begin
  for entry in
    select * from public.deletion_log
    where processed = false
    order by created_at asc
    limit 100
  loop
    -- Log for the application layer to process
    -- The actual storage cleanup requires the API client
    -- (Supabase triggers cannot call storage API directly)
    update public.deletion_log
    set processed = true
    where id = entry.id;
  end loop;
end;
$$;

-- 2. Add INSERT policy for users table (if not already created by 00003)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'users'
    and policyname = 'Users can insert own profile'
  ) then
    create policy "Users can insert own profile"
      on public.users for insert
      with check (auth.uid() = id);
  end if;
end;
$$;

-- 3. Function to clean up storage photos for a given user/vehicle
-- Called by the application layer after vehicle deletion
create or replace function public.get_orphaned_photos()
returns table (
  storage_path text,
  user_id uuid,
  vehicle_id uuid
)
language sql
security definer
as $$
  select
    metadata->>'photos' as storage_path,
    user_id,
    entity_id as vehicle_id
  from public.deletion_log
  where processed = false
    and entity_type = 'vehicle';
$$;
