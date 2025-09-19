-- Enhanced search function to include more data points for global search
CREATE OR REPLACE FUNCTION public.search_all(q text, limit_count integer DEFAULT 15)
RETURNS TABLE(entity text, id uuid, title text, subtitle text, url text, rank real)
LANGUAGE sql STABLE
SET search_path TO 'public', 'pg_temp'
AS $function$
  with query as (
    select websearch_to_tsquery('simple', unaccent(q)) as tsq
  )
  -- Locations
  select 'location'::text as entity, l.id, l.name as title,
         coalesce(l.city || ', ' || l.state, l.address_line1, 'Location') as subtitle,
         '/locations/' || l.id::text as url,
         ts_rank(l.search_tsv, (select tsq from query)) as rank
  from locations l, query
  where l.org_id = current_org() and l.search_tsv @@ (select tsq from query)
  
  union all
  -- Machines
  select 'machine', m.id, m.name as title,
         coalesce('Status: ' || m.status, 'Machine') as subtitle,
         '/machines/' || m.id::text as url,
         ts_rank(m.search_tsv, (select tsq from query)) as rank
  from machines m, query
  where m.org_id = current_org() and m.search_tsv @@ (select tsq from query)
  
  union all
  -- Products
  select 'product', p.id, p.name as title,
         coalesce(p.category || case when p.sku is not null then ' • '||p.sku else '' end, 'Product') as subtitle,
         '/products' as url,
         ts_rank(p.search_tsv, (select tsq from query)) as rank
  from products p, query
  where p.org_id = current_org() and p.search_tsv @@ (select tsq from query)
  
  union all
  -- Sales Records (search by product name, machine name)
  select 'sale', s.id, 'Sale: ' || coalesce(p.name, 'Unknown Product') as title,
         'Machine: ' || coalesce(m.name, 'Unknown') || ' • $' || ((s.qty * s.unit_price_cents)::decimal / 100)::text as subtitle,
         '/sales' as url,
         (case when p.name ilike '%'||q||'%' then 0.9 when m.name ilike '%'||q||'%' then 0.8 else 0.5 end) as rank
  from sales s
  left join products p on p.id = s.product_id
  left join machines m on m.id = s.machine_id
  where s.org_id = current_org() 
    and (p.name ilike '%'||q||'%' or m.name ilike '%'||q||'%' or s.occurred_at::text ilike '%'||q||'%')
  
  union all
  -- Purchase Orders
  select 'purchase_order', po.id, 'PO #' || po.id::text as title,
         coalesce('Supplier: ' || s.name, 'Purchase Order') || ' • Status: ' || coalesce(po.status, 'Draft') as subtitle,
         '/purchase-orders/' || po.id::text as url,
         (case when s.name ilike '%'||q||'%' then 0.9 when po.status ilike '%'||q||'%' then 0.7 else 0.5 end) as rank
  from purchase_orders po
  left join suppliers s on s.id = po.supplier_id
  where po.org_id = current_org() 
    and (s.name ilike '%'||q||'%' or po.status ilike '%'||q||'%' or po.id::text ilike '%'||q||'%')
  
  union all
  -- Prospects
  select 'prospect', pr.id, coalesce(pr.business_name, 'Prospect') as title,
         coalesce(pr.contact_name || ' • ', '') || coalesce(pr.stage, 'New') as subtitle,
         '/prospects/' || pr.id::text as url,
         (case when pr.business_name ilike '%'||q||'%' then 0.9 
               when pr.contact_name ilike '%'||q||'%' then 0.8 
               when pr.stage ilike '%'||q||'%' then 0.6 
               else 0.5 end) as rank
  from prospects pr
  where pr.org_id = current_org() 
    and (pr.business_name ilike '%'||q||'%' or pr.contact_name ilike '%'||q||'%' 
         or pr.stage ilike '%'||q||'%' or pr.city ilike '%'||q||'%')
  
  union all
  -- Suppliers
  select 'supplier', sup.id, sup.name as title,
         coalesce('Contact: ' || sup.contact, 'Supplier') as subtitle,
         '/suppliers' as url,
         (case when sup.name ilike '%'||q||'%' then 0.9 when sup.contact ilike '%'||q||'%' then 0.7 else 0.5 end) as rank
  from suppliers sup
  where sup.org_id = current_org() 
    and (sup.name ilike '%'||q||'%' or sup.contact ilike '%'||q||'%')
  
  order by rank desc nulls last
  limit limit_count;
$function$;