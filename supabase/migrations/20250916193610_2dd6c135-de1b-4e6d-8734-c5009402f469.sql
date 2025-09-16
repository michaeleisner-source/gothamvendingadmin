-- Remove SECURITY DEFINER from utility functions that don't need elevated privileges

-- Normalize help query - pure text processing, no sensitive data
CREATE OR REPLACE FUNCTION public.normalize_help_query(input_text text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE STRICT
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT lower(regexp_replace(input_text, '[^a-zA-Z0-9\s]', '', 'g'));
$function$;

-- Date range utility function - pure calculation, no data access
CREATE OR REPLACE FUNCTION public._normalize_range(p_start timestamp with time zone DEFAULT NULL::timestamp with time zone, p_end timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS TABLE(start_at timestamp with time zone, end_at timestamp with time zone)
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if p_start is null and p_end is null then
    -- Default to last 30 days
    return query select 
      (now() - interval '30 days')::timestamptz as start_at,
      now()::timestamptz as end_at;
  elsif p_start is null then
    -- End provided, start 30 days before end
    return query select 
      (p_end - interval '30 days')::timestamptz as start_at,
      p_end::timestamptz as end_at;
  elsif p_end is null then
    -- Start provided, end is now
    return query select 
      p_start::timestamptz as start_at,
      now()::timestamptz as end_at;
  else
    -- Both provided
    return query select 
      p_start::timestamptz as start_at,
      p_end::timestamptz as end_at;
  end if;
end;
$function$;

-- Get machine product price - uses existing RLS policies
CREATE OR REPLACE FUNCTION public.get_machine_product_price(p_machine_id uuid, p_product_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT price_cents 
  FROM machine_product_pricing 
  WHERE machine_id = p_machine_id 
    AND product_id = p_product_id
    AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
    AND effective_from <= CURRENT_DATE
  ORDER BY effective_from DESC 
  LIMIT 1;
$function$;

-- List functions can use regular RLS since they respect org membership
CREATE OR REPLACE FUNCTION public.list_products(p_search text DEFAULT NULL::text, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
 RETURNS SETOF products
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select *
  from products
  where org_id = current_org()
    and (p_search is null
         or name ilike '%'||p_search||'%'
         or coalesce(sku,'') ilike '%'||p_search||'%'
         or coalesce(category,'') ilike '%'||p_search||'%')
  order by name asc
  limit greatest(p_limit,1) offset greatest(p_offset,0);
$function$;

CREATE OR REPLACE FUNCTION public.list_suppliers(p_search text DEFAULT NULL::text, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
 RETURNS SETOF suppliers
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select *
  from suppliers
  where org_id = current_org()
    and (p_search is null or name ilike '%'||p_search||'%')
  order by name asc
  limit greatest(p_limit,1) offset greatest(p_offset,0);
$function$;