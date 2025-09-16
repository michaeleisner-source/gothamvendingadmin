-- Remove SECURITY DEFINER from additional reporting and utility functions

-- Revenue per product report
CREATE OR REPLACE FUNCTION public.report_revenue_per_product(p_start timestamp with time zone DEFAULT NULL::timestamp with time zone, p_end timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS TABLE(product_id uuid, product_name text, orders integer, qty_sold integer, gross_revenue_cents bigint)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
end;
$function$;

-- Purchase orders report  
CREATE OR REPLACE FUNCTION public.report_purchase_orders(p_status text DEFAULT NULL::text, p_days integer DEFAULT 90)
 RETURNS TABLE(po_id uuid, created_at timestamp with time zone, status text, supplier_id uuid, supplier_name text, total_amount numeric)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
end;
$function$;

-- Revenue per machine report (referenced by profit per machine)
CREATE OR REPLACE FUNCTION public.report_revenue_per_machine(p_start timestamp with time zone DEFAULT NULL::timestamp with time zone, p_end timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS TABLE(machine_id uuid, machine_name text, orders integer, qty_sold integer, gross_revenue_cents bigint, cost_cents bigint, net_profit_cents bigint, profit_pct numeric)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
    case when b.gross_revenue_cents = 0 then 0
         else round(100.0 * (b.gross_revenue_cents - b.cost_cents)::numeric / nullif(b.gross_revenue_cents,0), 2)
    end as profit_pct
  from base b
  order by machine_name nulls last;
end;
$function$;

-- Profit per machine (can now use the updated revenue per machine function)
CREATE OR REPLACE FUNCTION public.report_profit_per_machine(p_start timestamp with time zone DEFAULT NULL::timestamp with time zone, p_end timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS TABLE(machine_id uuid, machine_name text, gross_revenue_cents bigint, cost_cents bigint, net_profit_cents bigint, profit_pct numeric)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  return query
  select machine_id, machine_name, gross_revenue_cents, cost_cents,
         (gross_revenue_cents - cost_cents) as net_profit_cents,
         case when gross_revenue_cents = 0 then 0
              else round(100.0 * (gross_revenue_cents - cost_cents)::numeric / nullif(gross_revenue_cents,0), 2)
         end as profit_pct
  from report_revenue_per_machine(p_start, p_end);
end;
$function$;