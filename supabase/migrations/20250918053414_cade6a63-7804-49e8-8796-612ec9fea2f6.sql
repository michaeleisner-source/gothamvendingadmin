-- Ensure planogram tables have qty + threshold
alter table if exists machine_slots
  add column if not exists current_qty int not null default 0,
  add column if not exists restock_threshold int not null default 5;

-- Optional helpful index
create index if not exists idx_machine_slots_machine on machine_slots(machine_id);

-- Low stock report:
-- Lists slots where current_qty <= restock_threshold
-- Returns: machine_id, machine_name, slot_label, product_id, product_name, current_qty, restock_threshold
create or replace function report_low_stock()
returns table(
  machine_id uuid,
  machine_name text,
  slot_label text,
  product_id uuid,
  product_name text,
  current_qty int,
  restock_threshold int
)
language sql
security definer
set search_path = public
as $$
  select
    ms.machine_id,
    (select m.name from machines m where m.id = ms.machine_id) as machine_name,
    ms.label as slot_label,
    sa.product_id,
    (select p.name from products p where p.id = sa.product_id) as product_name,
    ms.current_qty,
    ms.restock_threshold
  from machine_slots ms
  left join slot_assignments sa
    on sa.slot_id = ms.id
  where ms.org_id = current_org()
    and is_org_member(ms.org_id)
    and ms.current_qty <= ms.restock_threshold
  order by machine_name nulls last, ms.label;
$$;

revoke all on function report_low_stock() from public;
grant execute on function report_low_stock() to authenticated;