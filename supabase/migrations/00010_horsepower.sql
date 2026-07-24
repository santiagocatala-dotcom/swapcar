-- Add horsepower to vehicles
alter table public.vehicles add column if not exists horsepower integer check (horsepower >= 0);

-- Add HP range to preferences
alter table public.preferences add column if not exists min_hp integer check (min_hp >= 0);
alter table public.preferences add column if not exists max_hp integer check (max_hp >= 0);
