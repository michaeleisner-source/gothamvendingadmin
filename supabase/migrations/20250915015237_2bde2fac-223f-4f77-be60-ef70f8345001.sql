create table if not exists public.processor_fee_rules (
  id uuid primary key default gen_random_uuid(),
  processor_id uuid not null references public.payment_processors(id) on delete cascade,
  percent_bps integer not null default 0,   -- 290 = 2.90%
  fixed_cents integer not null default 0,   -- 10 = $0.10
  effective_date date not null,
  created_at timestamptz not null default now()
);

-- Seed a default rule for Cantaloupe: 2.9% + $0.10
insert into public.processor_fee_rules (processor_id, percent_bps, fixed_cents, effective_date)
select p.id, 290, 10, current_date
from public.payment_processors p
where p.name = 'Cantaloupe'
on conflict do nothing;