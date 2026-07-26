-- Rate limit check RPC function
create or replace function check_rate_limit(
  p_user_id text,
  p_ip_address text,
  p_action_type text,
  p_max_requests int,
  p_window_seconds int
) returns boolean
language plpgsql
security definer
as $$
declare
  v_count int;
begin
  -- Clean old entries
  delete from public.rate_limits
  where created_at < now() - (p_window_seconds || ' seconds')::interval;

  -- Count recent attempts
  select count(*) into v_count
  from public.rate_limits
  where action_type = p_action_type
    and created_at > now() - (p_window_seconds || ' seconds')::interval
    and (user_id = p_user_id::uuid or ip_address = p_ip_address);

  -- Log this attempt
  insert into public.rate_limits (user_id, ip_address, action_type)
  values (nullif(p_user_id, 'unknown')::uuid, p_ip_address, p_action_type);

  return v_count < p_max_requests;
end;
$$;

-- Enable Realtime for messages (if not already)
alter publication supabase_realtime add table if not exists public.messages;
