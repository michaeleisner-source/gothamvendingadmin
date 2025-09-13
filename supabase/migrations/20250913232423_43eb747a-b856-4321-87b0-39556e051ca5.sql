-- Pre-reqs: current_org(), is_org_member(uuid), set_org_id() exist
create extension if not exists "pgcrypto";

-- ============= 1) SALES TABLE (org-scoped) =============
create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  machine_id uuid not null references machines(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  qty int not null check (qty > 0),
  -- snapshot the price/cost at time of sale (cents). If unit_cost_cents is null,
  -- reports will fallback to products.cost_cents.
  unit_price_cents int not null check (unit_price_cents >= 0),
  unit_cost_cents int,
  occurred_at timestamptz not null default now(),
  source text -- e.g. 'manual','import','device'
);

-- RLS + triggers
alter table sales enable row level security;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname='set_org_id_before_insert_sales') then
    create trigger set_org_id_before_insert_sales
    before insert on sales
    for each row execute function set_org_id();
  end if;

  if not exists (select 1 from pg_policies where tablename='sales' and policyname='sales_all') then
    create policy sales_all on sales
      for all using (is_org_member(org_id)) with check (org_id = current_org());
  end if;
end$$;

-- Helpful indexes
create index if not exists idx_sales_org_time on sales(org_id, occurred_at desc);
create index if not exists idx_sales_org_machine on sales(org_id, machine_id);
create index if not exists idx_sales_org_product on sales(org_id, product_id);

-- ============= 2) HELPER RPC TO RECORD A SALE =============
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
declare v_org uuid; v_id uuid;
begin
  select org_id into v_org from machines where id = p_machine_id;
  if v_org is null or not is_org_member(v_org) then
    raise exception 'Machine not found or not authorized';
  end if;

  if p_qty is null or p_qty <= 0 then
    raise exception 'qty must be > 0';
  end if;
  if p_unit_price_cents is null or p_unit_price_cents < 0 then
    raise exception 'unit_price_cents must be >= 0';
  end if;

  insert into sales (org_id, machine_id, product_id, qty, unit_price_cents, unit_cost_cents, occurred_at, source)
  values (
    v_org, p_machine_id, p_product_id, p_qty, p_unit_price_cents, p_unit_cost_cents, p_occurred_at, p_source
  )
  returning id into v_id;

  return v_id;
end$$;

revoke all on function record_sale(uuid,uuid,int,int,int,timestamptz,text) from public;
grant execute on function record_sale(uuid,uuid,int,int,int,timestamptz,text) to authenticated;

-- ============= 3) DATE RANGE NORMALIZER =============
-- If p_start/p_end are null, default to last 30 days.
create or replace function _normalize_range(p_start timestamptz, p_end timestamptz)
returns table(start_at timestamptz, end_at timestamptz)
language sql
as $$
  with rng as (
    select
      coalesce(p_start, now() - interval '30 days') as s,
      coalesce(p_end, now()) as e
  )
  select s, e from rng
$$;

-- ============= 4) REVENUE / COST / PROFIT PER MACHINE =============
create or replace function report_revenue_per_machine(p_start timestamptz default null, p_end timestamptz default null)
returns table(
  machine_id uuid,
  machine_name text,
  orders int,
  qty_sold int,
  gross_revenue_cents bigint,
  cost_cents bigint,
  net_profit_cents bigint,
  profit_pct numeric
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
  with base as (
    select
      machine_id,
      count(*) as orders,
      sum(qty) as qty_sold,
      sum(qty * unit_price_cents)::bigint as gross_revenue_cents,
      sum(qty * coalesce(unit_cost_cents, (select cost_cents from products p where p.id = sales.product_id)))::bigint as cost_cents
    from sales
    where org_id = v_org
      and occurred_at >= s and occurred_at < e
    group by machine_id
  )
  select
    b.machine_id,
    (select name from machines m where m.id = b.machine_id) as machine_name,
    b.orders,
    b.qty_sold,
    b.gross_revenue_cents,
    b.cost_cents,
    (b.gross_revenue_cents - b.cost_cents) as net_profit_cents,
    case
      when b.gross_revenue_cents = 0 then 0
      else round(100.0 * (b.gross_revenue_cents - b.cost_cents)::numeric / nullif(b.gross_revenue_cents,0), 2)
    end as profit_pct
  from base b
  order by machine_name nulls last;
end$$;

revoke all on function report_revenue_per_machine(timestamptz,timestamptz) from public;
grant execute on function report_revenue_per_machine(timestamptz,timestamptz) to authenticated;

-- ============= 5) REVENUE PER PRODUCT =============
create or replace function report_revenue_per_product(p_start timestamptz default null, p_end timestamptz default null)
returns table(
  product_id uuid,
  product_name text,
  orders int,
  qty_sold int,
  gross_revenue_cents bigint
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
  select
    product_id,
    (select name from products p where p.id = s1.product_id) as product_name,
    count(*) as orders,
    sum(qty) as qty_sold,
    sum(qty * unit_price_cents)::bigint as gross_revenue_cents
  from sales s1
  where org_id = v_org
    and occurred_at >= s and occurred_at < e
  group by product_id
  order by product_name nulls last;
end$$;

revoke all on function report_revenue_per_product(timestamptz,timestamptz) from public;
grant execute on function report_revenue_per_product(timestamptz,timestamptz) to authenticated;

-- ============= 6) PROFIT PER MACHINE (explicit) =============
create or replace function report_profit_per_machine(p_start timestamptz default null, p_end timestamptz default null)
returns table(
  machine_id uuid,
  machine_name text,
  gross_revenue_cents bigint,
  cost_cents bigint,
  net_profit_cents bigint,
  profit_pct numeric
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select machine_id, machine_name, gross_revenue_cents, cost_cents,
         (gross_revenue_cents - cost_cents) as net_profit_cents,
         case when gross_revenue_cents = 0 then 0
              else round(100.0 * (gross_revenue_cents - cost_cents)::numeric / nullif(gross_revenue_cents,0), 2)
         end as profit_pct
  from report_revenue_per_machine(p_start, p_end);
end$$;

revoke all on function report_profit_per_machine(timestamptz,timestamptz) from public;
grant execute on function report_profit_per_machine(timestamptz,timestamptz) to authenticated;

-- ============= 7) ORDERS PER DAY / PRODUCTS SOLD PER DAY / PER MONTH =============
create or replace function report_orders_per_day(p_start timestamptz default null, p_end timestamptz default null)
returns table(day date, orders int)
language plpgsql
security definer
set search_path = public
as $$
declare v_org uuid := current_org(); declare s timestamptz; declare e timestamptz;
begin
  if v_org is null then raise exception 'No org in session'; end if;
  select start_at, end_at into s, e from _normalize_range(p_start, p_end);
  return query
  select (occurred_at at time zone 'UTC')::date as day, count(*) as orders
  from sales
  where org_id = v_org and occurred_at >= s and occurred_at < e
  group by day
  order by day;
end$$;

revoke all on function report_orders_per_day(timestamptz,timestamptz) from public;
grant execute on function report_orders_per_day(timestamptz,timestamptz) to authenticated;

create or replace function report_products_sold_per_day(p_start timestamptz default null, p_end timestamptz default null)
returns table(day date, qty_sold bigint)
language plpgsql
security definer
set search_path = public
as $$
declare v_org uuid := current_org(); declare s timestamptz; declare e timestamptz;
begin
  if v_org is null then raise exception 'No org in session'; end if;
  select start_at, end_at into s, e from _normalize_range(p_start, p_end);
  return query
  select (occurred_at at time zone 'UTC')::date as day, sum(qty)::bigint as qty_sold
  from sales
  where org_id = v_org and occurred_at >= s and occurred_at < e
  group by day
  order by day;
end$$;

revoke all on function report_products_sold_per_day(timestamptz,timestamptz) from public;
grant execute on function report_products_sold_per_day(timestamptz,timestamptz) to authenticated;

create or replace function report_products_sold_per_month(p_start timestamptz default null, p_end timestamptz default null)
returns table(month text, qty_sold bigint)
language plpgsql
security definer
set search_path = public
as $$
declare v_org uuid := current_org(); declare s timestamptz; declare e timestamptz;
begin
  if v_org is null then raise exception 'No org in session'; end if;
  select start_at, end_at into s, e from _normalize_range(p_start, p_end);
  return query
  select to_char(date_trunc('month', occurred_at), 'YYYY-MM') as month,
         sum(qty)::bigint as qty_sold
  from sales
  where org_id = v_org and occurred_at >= s and occurred_at < e
  group by 1
  order by 1;
end$$;

revoke all on function report_products_sold_per_month(timestamptz,timestamptz) from public;
grant execute on function report_products_sold_per_month(timestamptz,timestamptz) to authenticated;

-- ============= 8) OVERALL KPIs (gross, net, profit %) =============
create or replace function report_financial_kpis(p_start timestamptz default null, p_end timestamptz default null)
returns table(
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
  with agg as (
    select
      sum(qty * unit_price_cents)::bigint as gross_revenue_cents,
      sum(qty * coalesce(unit_cost_cents, (select cost_cents from products p where p.id = sales.product_id)))::bigint as cost_cents
    from sales
    where org_id = v_org and occurred_at >= s and occurred_at < e
  )
  select
    coalesce(a.gross_revenue_cents,0),
    coalesce(a.cost_cents,0),
    coalesce(a.gross_revenue_cents,0) - coalesce(a.cost_cents,0) as net_profit_cents,
    case when coalesce(a.gross_revenue_cents,0)=0 then 0
         else round(100.0 * (coalesce(a.gross_revenue_cents,0) - coalesce(a.cost_cents,0))::numeric / nullif(coalesce(a.gross_revenue_cents,0),0), 2)
    end as profit_pct
  from agg a;
end$$;

revoke all on function report_financial_kpis(timestamptz,timestamptz) from public;
grant execute on function report_financial_kpis(timestamptz,timestamptz) to authenticated;