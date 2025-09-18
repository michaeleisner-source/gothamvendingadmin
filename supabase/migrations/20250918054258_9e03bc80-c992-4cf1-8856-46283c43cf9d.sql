-- 1) Trigger: auto-decrement slot qty when a sale is recorded
create or replace function _apply_sale_to_inventory()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_machine uuid := new.machine_id;
  v_product uuid := new.product_id;
  v_qty     int  := new.qty;
  v_slot_label text;
begin
  -- Pick the slot on this machine holding this product (highest qty first)
  select ms.label
    into v_slot_label
  from slot_assignments sa
  join machine_slots ms
    on ms.id = sa.slot_id
  where sa.slot_id in (
    select id from machine_slots where machine_id = v_machine
  )
    and sa.product_id = v_product
  order by ms.current_qty desc nulls last
  limit 1;

  if v_slot_label is null then
    -- no slot assigned for this product on this machine; nothing to decrement
    return new;
  end if;

  update machine_slots
     set current_qty = greatest(0, current_qty - v_qty)
   where machine_id = v_machine
     and label = v_slot_label;

  return new;
end
$$;

drop trigger if exists trg_sales_apply_inventory on sales;
create trigger trg_sales_apply_inventory
after insert on sales
for each row
execute function _apply_sale_to_inventory();

-- 2) RPC: set an absolute qty for a slot
create or replace function set_slot_qty(p_machine_id uuid, p_slot_label text, p_qty int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare v_org uuid; v_new int;
begin
  select org_id into v_org from machines where id = p_machine_id;
  if v_org is null or not is_org_member(v_org) then
    raise exception 'Not authorized or machine not found';
  end if;

  update machine_slots
     set current_qty = greatest(0, p_qty)
   where machine_id = p_machine_id
     and label = p_slot_label
     and org_id = v_org
  returning current_qty into v_new;

  if v_new is null then
    raise exception 'Slot % not found on machine %', p_slot_label, p_machine_id;
  end if;

  return v_new;
end
$$;

revoke all on function set_slot_qty(uuid,text,int) from public;
grant execute on function set_slot_qty(uuid,text,int) to authenticated;

-- 3) RPC: adjust qty by delta (+/-)
create or replace function adjust_slot_qty(p_machine_id uuid, p_slot_label text, p_delta int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare v_org uuid; v_new int;
begin
  select org_id into v_org from machines where id = p_machine_id;
  if v_org is null or not is_org_member(v_org) then
    raise exception 'Not authorized or machine not found';
  end if;

  update machine_slots
     set current_qty = greatest(0, current_qty + p_delta)
   where machine_id = p_machine_id
     and label = p_slot_label
     and org_id = v_org
  returning current_qty into v_new;

  if v_new is null then
    raise exception 'Slot % not found on machine %', p_slot_label, p_machine_id;
  end if;

  return v_new;
end
$$;

revoke all on function adjust_slot_qty(uuid,text,int) from public;
grant execute on function adjust_slot_qty(uuid,text,int) to authenticated;

-- 4) RPC: fetch machine inventory (for UI)
create or replace function get_machine_inventory(p_machine_id uuid)
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
  where ms.org_id = current_org() and ms.machine_id = p_machine_id
  order by ms.label
$$;

revoke all on function get_machine_inventory(uuid) from public;
grant execute on function get_machine_inventory(uuid) to authenticated;

-- 5) RPC: count low-stock (for sidebar badge)
create or replace function count_low_stock()
returns int
language sql
security definer
set search_path = public
as $$
  select count(*)::int
  from machine_slots ms
  where ms.org_id = current_org()
    and ms.current_qty <= ms.restock_threshold
$$;

revoke all on function count_low_stock() from public;
grant execute on function count_low_stock() to authenticated;