-- TEMP DEV POLICY: allow all on core tables
do $$
declare
  tbl text;
begin
  foreach tbl in array array['products','locations','machines'] loop
    execute format('alter table public.%I enable row level security;', tbl);
    -- drop any existing dev-open policy to avoid duplicates
    begin execute format('drop policy if exists dev_open on public.%I;', tbl); exception when others then null; end;
    execute format('create policy dev_open on public.%I for all using (true) with check (true);', tbl);
  end loop;
end $$;

-- If you plan to run the Advanced seed, open these too (optional, same idea)
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'payment_processors','machine_processor_mappings','machine_finance',
    'insurance_policies','insurance_allocations','ticket_sla_policies',
    'tickets','inventory_transactions','sales','processor_settlements'
  ] loop
    execute format('alter table public.%I enable row level security;', tbl);
    begin execute format('drop policy if exists dev_open on public.%I;', tbl); exception when others then null; end;
    execute format('create policy dev_open on public.%I for all using (true) with check (true);', tbl);
  end loop;
end $$;