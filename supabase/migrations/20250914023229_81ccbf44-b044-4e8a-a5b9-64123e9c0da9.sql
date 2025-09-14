-- Add extensions for full-text search
create extension if not exists pg_trgm;
create extension if not exists unaccent;

-- Add search tsvector columns and indexes for locations
alter table locations add column if not exists search_tsv tsvector;
update locations set search_tsv = to_tsvector('simple', unaccent(coalesce(name,'') || ' ' || coalesce(address_line1,'') || ' ' || coalesce(city,'') || ' ' || coalesce(state,'')));
create index if not exists idx_locations_search on locations using gin (search_tsv);

create or replace function locations_search_tsv_trigger() returns trigger language plpgsql as $$
begin
  new.search_tsv := to_tsvector('simple', unaccent(coalesce(new.name,'') || ' ' || coalesce(new.address_line1,'') || ' ' || coalesce(new.city,'') || ' ' || coalesce(new.state,'')));
  return new;
end; $$;

drop trigger if exists trg_locations_search on locations;
create trigger trg_locations_search before insert or update on locations
for each row execute procedure locations_search_tsv_trigger();

-- Add search tsvector columns and indexes for machines
alter table machines add column if not exists search_tsv tsvector;
update machines set search_tsv = to_tsvector('simple', unaccent(coalesce(name,'') || ' ' || coalesce(location,'') || ' ' || coalesce(status,'')));
create index if not exists idx_machines_search on machines using gin (search_tsv);

create or replace function machines_search_tsv_trigger() returns trigger language plpgsql as $$
begin
  new.search_tsv := to_tsvector('simple', unaccent(coalesce(new.name,'') || ' ' || coalesce(new.location,'') || ' ' || coalesce(new.status,'')));
  return new;
end; $$;

drop trigger if exists trg_machines_search on machines;
create trigger trg_machines_search before insert or update on machines
for each row execute procedure machines_search_tsv_trigger();

-- Add search tsvector columns and indexes for products
alter table products add column if not exists search_tsv tsvector;
update products set search_tsv = to_tsvector('simple', unaccent(coalesce(sku,'') || ' ' || coalesce(name,'') || ' ' || coalesce(category,'') || ' ' || coalesce(manufacturer,'')));
create index if not exists idx_products_search on products using gin (search_tsv);

create or replace function products_search_tsv_trigger() returns trigger language plpgsql as $$
begin
  new.search_tsv := to_tsvector('simple', unaccent(coalesce(new.sku,'') || ' ' || coalesce(new.name,'') || ' ' || coalesce(new.category,'') || ' ' || coalesce(new.manufacturer,'')));
  return new;
end; $$;

drop trigger if exists trg_products_search on products;
create trigger trg_products_search before insert or update on products
for each row execute procedure products_search_tsv_trigger();

-- Add search tsvector columns and indexes for suppliers
alter table suppliers add column if not exists search_tsv tsvector;
update suppliers set search_tsv = to_tsvector('simple', unaccent(coalesce(name,'') || ' ' || coalesce(contact,'')));
create index if not exists idx_suppliers_search on suppliers using gin (search_tsv);

create or replace function suppliers_search_tsv_trigger() returns trigger language plpgsql as $$
begin
  new.search_tsv := to_tsvector('simple', unaccent(coalesce(new.name,'') || ' ' || coalesce(new.contact,'')));
  return new;
end; $$;

drop trigger if exists trg_suppliers_search on suppliers;
create trigger trg_suppliers_search before insert or update on suppliers
for each row execute procedure suppliers_search_tsv_trigger();

-- Add search tsvector columns and indexes for staff
alter table staff add column if not exists search_tsv tsvector;
update staff set search_tsv = to_tsvector('simple', unaccent(coalesce(full_name,'') || ' ' || coalesce(email,'') || ' ' || coalesce(role,'')));
create index if not exists idx_staff_search on staff using gin (search_tsv);

create or replace function staff_search_tsv_trigger() returns trigger language plpgsql as $$
begin
  new.search_tsv := to_tsvector('simple', unaccent(coalesce(new.full_name,'') || ' ' || coalesce(new.email,'') || ' ' || coalesce(new.role,'')));
  return new;
end; $$;

drop trigger if exists trg_staff_search on staff;
create trigger trg_staff_search before insert or update on staff
for each row execute procedure staff_search_tsv_trigger();

-- Unified search function across all entities
create or replace function search_all(q text, limit_count int default 15)
returns table (
  entity text,
  id uuid,
  title text,
  subtitle text,
  url text,
  rank real
) language sql stable security definer as $$
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