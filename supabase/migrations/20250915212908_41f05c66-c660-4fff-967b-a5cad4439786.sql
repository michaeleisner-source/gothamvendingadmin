-- Add cost_cents column to products table
alter table public.products add column if not exists cost_cents integer check (cost_cents >= 0);