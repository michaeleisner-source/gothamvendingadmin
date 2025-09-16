do $$
declare r record;
  target_tables text[] := array['products','locations','machines']; -- adjust to the tables that failed
begin
  -- disable all custom triggers on target tables
  for r in
    select c.relname as tbl, t.tgname as trg
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname='public' and c.relname = any(target_tables) and t.tgisinternal=false
  loop
    execute format('alter table public.%I disable trigger %I;', r.tbl, r.trg);
  end loop;

  -- drop all existing policies and add dev_open
  for r in
    select tablename as tbl, policyname as polname
    from pg_policies
    where schemaname='public' and tablename = any(target_tables)
  loop
    execute format('drop policy if exists %I on public.%I;', r.polname, r.tbl);
  end loop;

  -- ensure RLS enabled + dev_open policy per table
  foreach r in array target_tables loop
    execute format('alter table public.%I enable row level security;', r);
    execute format('create policy dev_open on public.%I for all using (true) with check (true);', r);
  end loop;
end $$;