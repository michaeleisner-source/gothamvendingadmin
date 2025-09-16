do $$
declare r record;
begin
  for r in
    select c.relname as tbl, t.tgname as trg
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname='public'
      and c.relname in ('products','locations','machines')
      and t.tgisinternal = false
  loop
    execute format('alter table public.%I enable trigger %I;', r.tbl, r.trg);
  end loop;
end $$;