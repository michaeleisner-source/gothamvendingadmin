-- Fix the remaining search_all function security warning
create or replace function search_all(q text, limit_count int default 15)
returns table (
  entity text,
  id uuid,
  title text,
  subtitle text,
  url text,
  rank real
) language sql stable security definer
set search_path = public as $$
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
  union all
  select 'supplier', s.id, s.name as title, 
         coalesce(s.contact, 'Supplier') as subtitle, 
         '/suppliers' as url,
         ts_rank(s.search_tsv, (select tsq from query)) as rank
  from suppliers s, query
  where s.org_id = current_org() and s.search_tsv @@ (select tsq from query)
  union all
  select 'staff', st.id, st.full_name as title,
         coalesce(st.role, 'Staff Member') as subtitle,
         '/staff' as url,
         ts_rank(st.search_tsv, (select tsq from query)) as rank
  from staff st, query
  where st.org_id = current_org() and st.search_tsv @@ (select tsq from query)
  order by rank desc nulls last
  limit limit_count
$$;