-- Remove SECURITY DEFINER from reporting functions that can use regular RLS
-- These functions should respect user permissions and only show data from the user's org

-- Reporting functions - remove SECURITY DEFINER, they should use current_org() via RLS
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

CREATE OR REPLACE FUNCTION public.dashboard_metrics()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
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

  return v;
end;
$function$;

-- Search functions - remove SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.search_all(q text, limit_count integer DEFAULT 15)
 RETURNS TABLE(entity text, id uuid, title text, subtitle text, url text, rank real)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  with query as (
    select websearch_to_tsquery('simple', unaccent(q)) as tsq
  )
  select 'location'::text as entity, l.id, l.name as title,
         coalesce(l.city || ', ' || l.state, l.address_line1, 'Location') as subtitle,
         '/locations/' || l.id::text as url,
         ts_rank(l.search_tsv, (select tsq from query)) as rank
  from locations l, query
  where l.org_id = current_org() and l.search_tsv @@ (select tsq from query)
  union all
  select 'machine', m.id, m.name as title,
         coalesce('Status: ' || m.status, 'Machine') as subtitle,
         '/machines/' || m.id::text as url,
         ts_rank(m.search_tsv, (select tsq from query)) as rank
  from machines m, query
  where m.org_id = current_org() and m.search_tsv @@ (select tsq from query)
  union all
  select 'product', p.id, p.name as title,
         coalesce(p.category || case when p.sku is not null then ' • '||p.sku else '' end, 'Product') as subtitle,
         '/products' as url,
         ts_rank(p.search_tsv, (select tsq from query)) as rank
  from products p, query
  where p.org_id = current_org() and p.search_tsv @@ (select tsq from query)
  order by rank desc nulls last
  limit limit_count;
$function$;