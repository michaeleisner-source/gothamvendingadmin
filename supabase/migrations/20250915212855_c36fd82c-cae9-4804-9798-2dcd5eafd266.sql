-- Add cost_cents column to products table
alter table public.products add column if not exists cost_cents integer check (cost_cents >= 0);

-- Optional one-time backfill if you used unit_cost_cents historically
update public.products
set cost_cents = coalesce(cost_cents, unit_cost_cents)
where cost_cents is null and unit_cost_cents is not null;