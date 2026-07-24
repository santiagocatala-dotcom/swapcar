-- Add phone/whatsapp fields to users
alter table public.users add column if not exists phone text;
alter table public.users add column if not exists whatsapp text;
