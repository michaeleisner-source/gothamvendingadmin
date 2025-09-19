-- Enhanced search function to include more data points for global search  
CREATE OR REPLACE FUNCTION public.search_all(q text, limit_count integer DEFAULT 15)
RETURNS TABLE(entity text, id uuid, title text, subtitle text, url text, rank real)
LANGUAGE sql STABLE
SET search_path TO 'public', 'pg_temp'
AS $function$
  -- Locations
  select 'location'::text as entity, l.id, l.name as title,
         coalesce(l.city || ', ' || l.state, l.address_line1, 'Location') as subtitle,
         '/locations/' || l.id::text as url,
         (case when l.name ilike '%'||q||'%' then 1.0 
               when l.city ilike '%'||q||'%' then 0.8 
               when l.state ilike '%'||q||'%' then 0.6 
               else 0.4 end) as rank
  from locations l
  where l.org_id = current_org() 
    and (l.name ilike '%'||q||'%' or l.city ilike '%'||q||'%' or l.state ilike '%'||q||'%' 
         or l.address_line1 ilike '%'||q||'%' or l.contact_name ilike '%'||q||'%')
  
  union all
  -- Machines
  select 'machine', m.id, m.name as title,
         coalesce('Status: ' || m.status, 'Machine') as subtitle,
         '/machines/' || m.id::text as url,
         (case when m.name ilike '%'||q||'%' then 1.0 
               when m.status ilike '%'||q||'%' then 0.7 
               else 0.5 end) as rank
  from machines m
  where m.org_id = current_org() 
    and (m.name ilike '%'||q||'%' or m.status ilike '%'||q||'%')
  
  union all
  -- Products
  select 'product', p.id, p.name as title,
         coalesce(p.category || case when p.sku is not null then ' • '||p.sku else '' end, 'Product') as subtitle,
         '/products' as url,
         (case when p.name ilike '%'||q||'%' then 1.0 
               when p.sku ilike '%'||q||'%' then 0.9 
               when p.category ilike '%'||q||'%' then 0.7 
               else 0.5 end) as rank
  from products p
  where p.org_id = current_org() 
    and (p.name ilike '%'||q||'%' or p.sku ilike '%'||q||'%' or p.category ilike '%'||q||'%')
  
  union all
  -- Sales Records 
  select 'sale', s.id, 'Sale: ' || coalesce(p.name, 'Product') as title,
         'Amount: $' || ((s.qty * s.unit_price_cents)::decimal / 100)::text || ' • ' || 
         coalesce(to_char(s.occurred_at, 'MM/DD/YYYY'), 'Unknown Date') as subtitle,
         '/sales' as url,
         (case when p.name ilike '%'||q||'%' then 0.9 
               when s.occurred_at::text ilike '%'||q||'%' then 0.6 
               else 0.5 end) as rank
  from sales s
  left join products p on p.id = s.product_id
  where s.org_id = current_org() 
    and (p.name ilike '%'||q||'%' or s.occurred_at::text ilike '%'||q||'%')
  
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