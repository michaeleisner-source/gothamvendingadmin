-- The table already exists, so let's just seed the data with proper org_id
-- Insert a default rule for Cantaloupe: 2.9% + $0.10 for each org that has Cantaloupe processor
insert into public.processor_fee_rules (org_id, processor_id, percent_bps, fixed_cents, effective_date)
select p.org_id, p.id, 290, 10, current_date
from public.payment_processors p
where p.name = 'Cantaloupe'
on conflict do nothing;