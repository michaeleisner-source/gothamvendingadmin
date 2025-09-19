-- Enhanced search function that includes both database entities AND page navigation
CREATE OR REPLACE FUNCTION search_all(q text, limit_count integer DEFAULT 15)
RETURNS TABLE(entity text, id uuid, title text, subtitle text, url text, rank real)
LANGUAGE sql
STABLE
SET search_path TO 'public', 'pg_temp'
AS $function$
  -- Page/Route Navigation Results (highest priority)
  SELECT 'page'::text as entity, 
         gen_random_uuid() as id, -- Generate a UUID for consistency
         page_info.title,
         page_info.category as subtitle,
         page_info.url,
         1.0::real as rank
  FROM (VALUES
    ('Home Dashboard', 'Dashboard', '/'),
    ('Enhanced Dashboard', 'Dashboard', '/enhanced-dashboard'),
    ('Prospects', 'Sales & Pipeline', '/prospects'),
    ('Pipeline Analytics', 'Analytics', '/pipeline-analytics'),
    ('Locations', 'Sales & Operations', '/locations'),
    ('Sales Entry', 'Sales', '/sales'),
    ('Sales Dashboard', 'Analytics', '/sales-dashboard'),
    ('Machines', 'Operations', '/machines'),
    ('Machine Setup', 'Operations', '/machine-setup'),
    ('Inventory', 'Inventory & Stock', '/inventory'),
    ('Products', 'Catalog', '/products'),
    ('Suppliers', 'Purchasing', '/suppliers'),
    ('Purchase Orders', 'Purchasing', '/purchase-orders'),
    ('Contracts', 'Legal & Agreements', '/contracts'),
    ('Contract Management', 'Legal', '/contract-management'), 
    ('Insurance', 'Legal & Coverage', '/insurance'),
    ('Reports Hub', 'Analytics & Reports', '/reports'),
    ('Customer Analytics', 'Analytics', '/customer-analytics'),
    ('Commission Dashboard', 'Financial', '/commissions'),
    ('Finance Management', 'Financial', '/finance'),
    ('Admin Settings', 'Administration', '/admin/settings'),
    ('Staff Management', 'Administration', '/staff'),
    ('Help Center', 'Support', '/help'),
    ('Route Management', 'Operations', '/routes'),
    ('Delivery Routes', 'Operations', '/delivery-routes'),
    ('Maintenance', 'Operations', '/maintenance'),
    ('Machine Health', 'Monitoring', '/machine-health'),
    ('Daily Operations', 'Operations', '/daily-ops'),
    ('Cash Collection', 'Financial', '/cash-collection'),
    ('Cost Analysis', 'Financial', '/cost-analysis'),
    ('Audit Trail', 'Administration', '/audit'),
    ('Data Exports', 'Tools', '/exports'),
    ('Account Settings', 'Account', '/account')
  ) AS page_info(title, category, url)
  WHERE page_info.title ILIKE '%'||q||'%' 
     OR page_info.category ILIKE '%'||q||'%'
     OR page_info.url ILIKE '%'||q||'%'
     -- Enhanced matching for contracts
     OR (q ILIKE '%contract%' AND (page_info.title ILIKE '%contract%' OR page_info.category ILIKE '%legal%'))
     OR (q ILIKE '%legal%' AND page_info.category ILIKE '%legal%')
     OR (q ILIKE '%agreement%' AND page_info.category ILIKE '%legal%')
  
  UNION ALL
  -- Locations
  select 'location'::text as entity, l.id, l.name as title,
         coalesce(l.city || ', ' || l.state, l.address_line1, 'Location') as subtitle,
         '/location/' || l.id::text as url,
         (case when l.name ilike '%'||q||'%' then 0.9 
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
         '/machine/' || m.id::text as url,
         (case when m.name ilike '%'||q||'%' then 0.9 
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
         (case when p.name ilike '%'||q||'%' then 0.9 
               when p.sku ilike '%'||q||'%' then 0.8 
               when p.category ilike '%'||q||'%' then 0.7 
               else 0.5 end) as rank
  from products p
  where p.org_id = current_org() 
    and (p.name ilike '%'||q||'%' or p.sku ilike '%'||q||'%' or p.category ilike '%'||q||'%')
  
  union all
  -- Contracts (Database entities)
  select 'contract', c.id, 
         coalesce(c.title, 'Contract #' || c.contract_number, 'Contract') as title,
         coalesce('Status: ' || c.status || ' • ' || l.name, c.status || ' Contract') as subtitle,
         '/contract/' || c.id::text as url,
         (case when c.title ilike '%'||q||'%' then 0.9
               when c.contract_number ilike '%'||q||'%' then 0.8
               when c.status ilike '%'||q||'%' then 0.6
               else 0.5 end) as rank
  from contracts c
  left join locations l on l.id = c.location_id
  where c.org_id = current_org()
    and (c.title ilike '%'||q||'%' or c.contract_number ilike '%'||q||'%' 
         or c.status ilike '%'||q||'%' or l.name ilike '%'||q||'%')
  
  union all
  -- Sales Records 
  select 'sale', s.id, 'Sale: ' || coalesce(p.name, 'Product') as title,
         'Amount: $' || ((s.qty * s.unit_price_cents)::decimal / 100)::text || ' • ' || 
         coalesce(to_char(s.occurred_at, 'MM/DD/YYYY'), 'Unknown Date') as subtitle,
         '/sales' as url,
         (case when p.name ilike '%'||q||'%' then 0.8 
               when s.occurred_at::text ilike '%'||q||'%' then 0.6 
               else 0.4 end) as rank
  from sales s
  left join products p on p.id = s.product_id
  where s.org_id = current_org() 
    and (p.name ilike '%'||q||'%' or s.occurred_at::text ilike '%'||q||'%')
  
  union all
  -- Prospects
  select 'prospect', pr.id, coalesce(pr.business_name, 'Prospect') as title,
         coalesce(pr.contact_name || ' • ', '') || coalesce(pr.stage, 'New') as subtitle,
         '/prospect/' || pr.id::text as url,
         (case when pr.business_name ilike '%'||q||'%' then 0.8 
               when pr.contact_name ilike '%'||q||'%' then 0.7 
               when pr.stage ilike '%'||q||'%' then 0.6 
               else 0.4 end) as rank
  from prospects pr
  where pr.org_id = current_org() 
    and (pr.business_name ilike '%'||q||'%' or pr.contact_name ilike '%'||q||'%' 
         or pr.stage ilike '%'||q||'%' or pr.city ilike '%'||q||'%')
  
  union all
  -- Suppliers
  select 'supplier', sup.id, sup.name as title,
         coalesce('Contact: ' || sup.contact, 'Supplier') as subtitle,
         '/suppliers' as url,
         (case when sup.name ilike '%'||q||'%' then 0.8 when sup.contact ilike '%'||q||'%' then 0.7 else 0.4 end) as rank
  from suppliers sup
  where sup.org_id = current_org() 
    and (sup.name ilike '%'||q||'%' or sup.contact ilike '%'||q||'%')
  
  order by rank desc nulls last
  limit limit_count;
$function$;