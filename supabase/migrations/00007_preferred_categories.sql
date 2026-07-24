-- Add preferred_categories to preferences
alter table public.preferences add column if not exists preferred_categories text[] default '{}';
