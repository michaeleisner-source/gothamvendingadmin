-- ===== Advanced Analytics and Reporting Functions =====
create extension if not exists "pgcrypto";

-- 1) Ensure sales has user_id (who recorded the sale)
alter table if exists sales
  add column if not exists user_id uuid;

-- keep record_sale() signature; just populate user_id internally
create or replace function record_sale(
  p_machine_id uuid,
  p_product_id uuid,
  p_qty int,
  p_unit_price_cents int,
  p_unit_cost_cents int default null,
  p_occurred_at timestamptz default now(),
  p_source text default 'manual'
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_org uuid; v_id uuid; v_user uuid := auth.uid();
begin
  select org_id into v_org from machines where id = p_machine_id;
  if v_org is null or not is_org_member(v_org) then
    raise exception 'Machine not found or not authorized';
  end if;

  if p_qty is null or p_qty <= 0 then raise exception 'qty must be > 0'; end if;
  if p_unit_price_cents is null or p_unit_price_cents < 0 then
    raise exception 'unit_price_cents must be >= 0';
  end if;

  insert into sales (org_id, machine_id, product_id, qty, unit_price_cents, unit_cost_cents, occurred_at, source, user_id)
  values (
    v_org, p_machine_id, p_product_id, p_qty,
    p_unit_price_cents, p_unit_cost_cents, p_occurred_at, p_source, v_user
  )
  returning id into v_id;

  return v_id;
end$$;

revoke all on function record_sale(uuid,uuid,int,int,int,timestamptz,text) from public;
grant execute on function record_sale(uuid,uuid,int,int,int,timestamptz,text) to authenticated;

-- 2) Drop and recreate date-range helper with proper defaults
drop function if exists _normalize_range(timestamptz, timestamptz);

create function _normalize_range(p_start timestamptz default null, p_end timestamptz default null)
returns table(start_at timestamptz, end_at timestamptz)
language sql as $$
  select
    coalesce(p_start, now() - interval '30 days') as start_at,
    coalesce(p_end, now()) as end_at
$$;

-- 3) Cash flow: daily sales (cash in) vs received POs (cash out)
create or replace function report_cash_flow(p_start timestamptz default null, p_end timestamptz default null)
returns table(
  day date,
  cash_in_cents bigint,
  cash_out_cents bigint,
  net_cents bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare v_org uuid := current_org();
declare s timestamptz; declare e timestamptz;
begin
  if v_org is null then raise exception 'No org in session'; end if;
  select start_at, end_at into s, e from _normalize_range(p_start, p_end);

  return query
  with
  sales_day as (
    select (occurred_at at time zone 'UTC')::date as day,
           sum(qty * unit_price_cents)::bigint as cash_in_cents
    from sales
    where org_id = v_org and occurred_at >= s and occurred_at < e
    group by 1
  ),
  po_totals as (
    select po.id,
           (select coalesce(sum(poi.qty_ordered * poi.unit_cost)::numeric,0)
              from purchase_order_items poi where poi.po_id = po.id) as total_amount
    from purchase_orders po
    where po.org_id = v_org
      and coalesce(po.status,'DRAFT') = 'RECEIVED'
      and po.created_at >= s and po.created_at < e
  ),
  po_day as (
    select (po.created_at at time zone 'UTC')::date as day,
           sum(pt.total_amount)::bigint as cash_out_cents
    from purchase_orders po
    join po_totals pt on pt.id = po.id
    group by 1
  ),
  days as (
    select generate_series(date_trunc('day', s)::date, (date_trunc('day', e)::date), interval '1 day')::date as day
  )
  select
    d.day,
    coalesce(sd.cash_in_cents,0) as cash_in_cents,
    coalesce(pd.cash_out_cents,0) as cash_out_cents,
    coalesce(sd.cash_in_cents,0) - coalesce(pd.cash_out_cents,0) as net_cents
  from days d
  left join sales_day sd on sd.day = d.day
  left join po_day pd on pd.day = d.day
  order by d.day;
end$$;

revoke all on function report_cash_flow(timestamptz,timestamptz) from public;
grant execute on function report_cash_flow(timestamptz,timestamptz) to authenticated;

-- 4) Inventory: products with zero sales in range (dead stock)
create or replace function report_dead_stock(p_start timestamptz default null, p_end timestamptz default null)
returns table(product_id uuid, product_name text)
language plpgsql
security definer
set search_path = public
as $$
declare v_org uuid := current_org(); declare s timestamptz; declare e timestamptz;
begin
  if v_org is null then raise exception 'No org in session'; end if;
  select start_at, end_at into s, e from _normalize_range(p_start, p_end);

  return query
  select p.id, p.name
  from products p
  where p.org_id = v_org
    and not exists (
      select 1 from sales s1
      where s1.org_id = v_org
        and s1.product_id = p.id
        and s1.occurred_at >= s and s1.occurred_at < e
    )
  order by p.name nulls last;
end$$;

revoke all on function report_dead_stock(timestamptz,timestamptz) from public;
grant execute on function report_dead_stock(timestamptz,timestamptz) to authenticated;

-- 5) Inventory: velocity (avg per day)
create or replace function report_inventory_velocity(p_start timestamptz default null, p_end timestamptz default null)
returns table(
  product_id uuid,
  product_name text,
  days int,
  qty_sold bigint,
  avg_per_day numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare v_org uuid := current_org(); declare s timestamptz; declare e timestamptz;
begin
  if v_org is null then raise exception 'No org in session'; end if;
  select start_at, end_at into s, e from _normalize_range(p_start, p_end);

  return query
  with agg as (
    select product_id, sum(qty)::bigint as qty_sold
    from sales
    where org_id = v_org and occurred_at >= s and occurred_at < e
    group by product_id
  )
  select
    a.product_id,
    (select name from products p where p.id = a.product_id) as product_name,
    greatest(1, (e::date - s::date))::int as days,
    a.qty_sold,
    round(a.qty_sold::numeric / greatest(1, (e::date - s::date)), 2) as avg_per_day
  from agg a
  order by a.qty_sold desc nulls last;
end$$;

revoke all on function report_inventory_velocity(timestamptz,timestamptz) from public;
grant execute on function report_inventory_velocity(timestamptz,timestamptz) to authenticated;

-- 6) Staff performance from sales.user_id
create or replace function report_staff_performance(p_start timestamptz default null, p_end timestamptz default null)
returns table(
  user_id uuid,
  email text,
  orders int,
  qty_sold bigint,
  gross_revenue_cents bigint,
  cost_cents bigint,
  net_profit_cents bigint,
  profit_pct numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare v_org uuid := current_org(); declare s timestamptz; declare e timestamptz;
begin
  if v_org is null then raise exception 'No org in session'; end if;
  select start_at, end_at into s, e from _normalize_range(p_start, p_end);

  return query
  with base as (
    select
      user_id,
      count(*) as orders,
      sum(qty)::bigint as qty_sold,
      sum(qty * unit_price_cents)::bigint as gross_revenue_cents,
      sum(qty * coalesce(unit_cost_cents, (select cost_cents from products p where p.id = sales.product_id)))::bigint as cost_cents
    from sales
    where org_id = v_org
      and occurred_at >= s and occurred_at < e
    group by user_id
  )
  select
    b.user_id,
    (select pr.email from profiles pr where pr.id = b.user_id) as email,
    b.orders,
    b.qty_sold,
    b.gross_revenue_cents,
    b.cost_cents,
    (b.gross_revenue_cents - b.cost_cents) as net_profit_cents,
    case when b.gross_revenue_cents = 0 then 0
      else round(100.0 * (b.gross_revenue_cents - b.cost_cents)::numeric / nullif(b.gross_revenue_cents,0), 2)
    end as profit_pct
  from base b
  order by b.gross_revenue_cents desc nulls last;
end$$;

revoke all on function report_staff_performance(timestamptz,timestamptz) from public;
grant execute on function report_staff_performance(timestamptz,timestamptz) to authenticated;