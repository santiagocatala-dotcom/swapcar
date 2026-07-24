-- Remove unique constraint on vehicles.user_id to allow multiple vehicles per user
alter table public.vehicles drop constraint if exists vehicles_user_id_key;
create index if not exists idx_vehicles_user_id on public.vehicles (user_id);
