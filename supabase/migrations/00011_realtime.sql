-- Enable Realtime for messages
alter publication supabase_realtime add table if not exists public.messages;

-- Ensure proper RLS for Realtime (select policy already exists in 00001)
-- The existing "Match participants can view messages" policy handles this.
-- But Realtime needs the select policy to work for the subscription filter.
-- Verify with: select * from pg_policies where tablename = 'messages';
