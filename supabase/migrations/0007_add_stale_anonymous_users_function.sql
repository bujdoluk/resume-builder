create or replace function public.get_stale_anonymous_user_ids(retention_days int)
returns table (id uuid)
language sql
security definer
set search_path = public
as $$
  select id from auth.users
  where is_anonymous = true
    and created_at < now() - (retention_days || ' days')::interval;
$$;

grant execute on function public.get_stale_anonymous_user_ids(int) to service_role;
