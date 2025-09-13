-- Fix the _normalize_range function to include proper search_path for security
create or replace function _normalize_range(p_start timestamptz, p_end timestamptz)
returns table(start_at timestamptz, end_at timestamptz)
language sql
security definer
set search_path = public
as $$
  with rng as (
    select
      coalesce(p_start, now() - interval '30 days') as s,
      coalesce(p_end, now()) as e
  )
  select s, e from rng
$$;