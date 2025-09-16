-- Remove SECURITY DEFINER from reporting functions that work with existing RLS policies

-- Financial KPIs - works with sales data user already has access to
CREATE OR REPLACE FUNCTION public.report_financial_kpis(p_start timestamp with time zone DEFAULT NULL::timestamp with time zone, p_end timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS TABLE(gross_revenue_cents bigint, cost_cents bigint, net_profit_cents bigint, profit_pct numeric)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
end;
$function$;

-- Orders per day report
CREATE OR REPLACE FUNCTION public.report_orders_per_day(p_start timestamp with time zone DEFAULT NULL::timestamp with time zone, p_end timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS TABLE(day date, orders integer)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
end;
$function$;

-- Products sold per day report
CREATE OR REPLACE FUNCTION public.report_products_sold_per_day(p_start timestamp with time zone DEFAULT NULL::timestamp with time zone, p_end timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS TABLE(day date, qty_sold bigint)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
end;
$function$;

-- Products sold per month report  
CREATE OR REPLACE FUNCTION public.report_products_sold_per_month(p_start timestamp with time zone DEFAULT NULL::timestamp with time zone, p_end timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS TABLE(month text, qty_sold bigint)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
end;
$function$;