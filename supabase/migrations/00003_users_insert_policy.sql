-- Add INSERT policy for public.users table
-- The signup/signin flow needs to create a profile row
create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);
