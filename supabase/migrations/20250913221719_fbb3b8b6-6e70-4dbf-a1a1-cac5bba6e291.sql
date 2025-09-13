-- Pre-reqs: current_org(), is_org_member(uuid) exist
create extension if not exists "pgcrypto";

-- 1) Dashboard metrics (counts + quick summaries)
create or replace function dashboard_metrics()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid := current_org();
  v jsonb := '{}'::jsonb;
begin
  if v_org is null then raise exception 'No org in session'; end if;

  -- Counts
  v := v || jsonb_build_object(
    'counts', jsonb_build_object(
      'prospects', (select count(*) from prospects where org_id = v_org),
      'locations', (select count(*) from locations where org_id = v_org),
      'machines',  (select count(*) from machines  where org_id = v_org),
      'products',  (select count(*) from products  where org_id = v_org),
      'suppliers', (select count(*) from suppliers where org_id = v_org),
      'open_purchase_orders', (
        select count(*) from purchase_orders
        where org_id = v_org and coalesce(status,'DRAFT') not in ('RECEIVED','CANCELLED')
      )
    )
  );

  -- Machines missing planogram
  v := v || jsonb_build_object(
    'machines_missing_planogram',
    (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb)
     from (
       select m.id, m.name
       from machines m
       where m.org_id = v_org
         and not exists (select 1 from machine_slots ms where ms.machine_id = m.id)
       order by m.name nulls last
       limit 10
     ) x)
  );

  -- Recent POs (last 5) with totals
  v := v || jsonb_build_object(
    'recent_purchase_orders',
    (with totals as (
       select
         po.id,
         po.status,
         po.created_at,
         po.supplier_id,
         (select name from suppliers s where s.id=po.supplier_id) as supplier_name,
         coalesce((
           select sum(poi.qty_ordered * poi.unit_cost)::numeric
           from purchase_order_items poi
           where poi.po_id = po.id
         ), 0)::numeric as total_amount
       from purchase_orders po
       where po.org_id = v_org
       order by po.created_at desc nulls last
       limit 5
     )
     select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from totals t)
  );

  -- Low-stock count (based on latest completed restock)
  v := v || jsonb_build_object(
    'low_stock_count',
    (
      with latest as (
        select distinct on (rl.slot_id)
          rl.slot_id, rl.new_qty, rs.completed_at
        from restock_lines rl
        join restock_sessions rs on rs.id = rl.session_id
        where rs.org_id = v_org and rs.completed_at is not null
        order by rl.slot_id, rs.completed_at desc
      )
      select count(*)
      from slot_assignments sa
      join machine_slots ms on ms.id = sa.slot_id
      left join latest l on l.slot_id = sa.slot_id
      where sa.org_id = v_org
        and sa.restock_threshold is not null
        and l.new_qty is not null
        and l.new_qty <= sa.restock_threshold
    )
  );

  return v;
end$$;

revoke all on function dashboard_metrics() from public;
grant execute on function dashboard_metrics() to authenticated;

-- 2) Low-stock detail list
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
language plpgsql
security definer
set search_path = public
as $$
declare v_org uuid := current_org();
begin
  if v_org is null then raise exception 'No org in session'; end if;

  return query
  with latest as (
    select distinct on (rl.slot_id)
      rl.slot_id, rl.new_qty, rs.completed_at
    from restock_lines rl
    join restock_sessions rs on rs.id = rl.session_id
    where rs.org_id = v_org and rs.completed_at is not null
    order by rl.slot_id, rs.completed_at desc
  )
  select
    ms.machine_id,
    (select name from machines m where m.id = ms.machine_id) as machine_name,
    ms.label as slot_label,
    sa.product_id,
    (select name from products p where p.id = sa.product_id) as product_name,
    l.new_qty as current_qty,
    sa.restock_threshold
  from slot_assignments sa
  join machine_slots ms on ms.id = sa.slot_id
  left join latest l on l.slot_id = sa.slot_id
  where sa.org_id = v_org
    and sa.restock_threshold is not null
    and l.new_qty is not null
    and l.new_qty <= sa.restock_threshold
  order by machine_name nulls last, slot_label;
end$$;

revoke all on function report_low_stock() from public;
grant execute on function report_low_stock() to authenticated;

-- 3) Restock history for a machine over N days
create or replace function report_restock_history(p_machine_id uuid, p_days int default 30)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_org uuid := current_org();
declare v jsonb;
begin
  if v_org is null then raise exception 'No org in session'; end if;

  if not exists (select 1 from machines where id = p_machine_id and org_id = v_org) then
    raise exception 'Machine not found or not authorized';
  end if;

  with sessions as (
    select rs.id, rs.started_at, rs.completed_at, rs.note
    from restock_sessions rs
    where rs.org_id = v_org
      and rs.machine_id = p_machine_id
      and rs.started_at >= now() - (p_days || ' days')::interval
    order by rs.started_at desc
    limit 100
  ), lines as (
    select
      rl.session_id,
      ms.label as slot_label,
      rl.product_id,
      (select name from products p where p.id = rl.product_id) as product_name,
      rl.prev_qty, rl.added_qty, rl.new_qty
    from restock_lines rl
    join machine_slots ms on ms.id = rl.slot_id
    where rl.org_id = v_org
      and rl.session_id in (select id from sessions)
  )
  select jsonb_agg(
    jsonb_build_object(
      'session', to_jsonb(s),
      'lines', coalesce((
        select jsonb_agg(to_jsonb(l))
        from lines l
        where l.session_id = s.id
      ), '[]'::jsonb)
    )
  ) into v
  from sessions s;

  return coalesce(v, '[]'::jsonb);
end$$;

revoke all on function report_restock_history(uuid, int) from public;
grant execute on function report_restock_history(uuid, int) to authenticated;

-- 4) Purchase orders (filter by status, default last 90 days)
create or replace function report_purchase_orders(p_status text default null, p_days int default 90)
returns table(
  po_id uuid,
  created_at timestamptz,
  status text,
  supplier_id uuid,
  supplier_name text,
  total_amount numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare v_org uuid := current_org();
begin
  if v_org is null then raise exception 'No org in session'; end if;

  return query
  with base as (
    select po.id, po.created_at, po.status, po.supplier_id
    from purchase_orders po
    where po.org_id = v_org
      and po.created_at >= now() - (p_days || ' days')::interval
      and (p_status is null or po.status = p_status)
  ), totals as (
    select
      b.id as po_id,
      b.created_at,
      b.status,
      b.supplier_id,
      (select name from suppliers s where s.id = b.supplier_id) as supplier_name,
      coalesce((
        select sum(poi.qty_ordered * poi.unit_cost)::numeric
        from purchase_order_items poi
        where poi.po_id = b.id
      ), 0)::numeric as total_amount
    from base b
  )
  select * from totals order by created_at desc;
end$$;

revoke all on function report_purchase_orders(text, int) from public;
grant execute on function report_purchase_orders(text, int) to authenticated;