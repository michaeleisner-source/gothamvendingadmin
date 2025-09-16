do $$
declare r record;
begin
  -- Drop ALL existing policies on these tables
  for r in
    select polname, tablename
    from pg_policies
    where schemaname='public'
      and tablename in ('products','locations','machines')
  loop
    execute format('drop policy if exists %I on public.%I;', r.polname, r.tablename);
  end loop;

  -- Ensure RLS is enabled (Supabase usually enables it by default)
  alter table public.products  enable row level security;
  alter table public.locations enable row level security;
  alter table public.machines  enable row level security;

  -- Create single permissive policy for all commands
  create policy dev_open_products  on public.products  for all using (true) with check (true);
  create policy dev_open_locations on public.locations for all using (true) with check (true);
  create policy dev_open_machines  on public.machines  for all using (true) with check (true);
end $$;