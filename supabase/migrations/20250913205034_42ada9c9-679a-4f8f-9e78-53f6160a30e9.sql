-- PRELUDE
create extension if not exists "pgcrypto";

-- Helpers expected from earlier steps:
--   current_org(), is_org_member(uuid), set_org_id()

/* -----------------------------------------------
   1) product_categories (missing in your schema)
------------------------------------------------ */
create table if not exists product_categories (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  unique(org_id, name)
);

alter table product_categories enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname='set_org_id_before_insert_product_categories'
  ) then
    create trigger set_org_id_before_insert_product_categories
    before insert on product_categories
    for each row execute function set_org_id();
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename='product_categories' and policyname='product_categories_all'
  ) then
    create policy product_categories_all on product_categories
      for all using (is_org_member(org_id)) with check (org_id = current_org());
  end if;
end$$;

/* -----------------------------------------------
   2) suppliers RLS (table already exists)
   (Only add policies if missing; we DO NOT drop yours)
------------------------------------------------ */
do $$
begin
  perform 1 from information_schema.tables
   where table_schema='public' and table_name='suppliers';
  if found then
    perform 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relname='suppliers'
        and relrowsecurity = true;
    if not found then
      execute 'alter table public.suppliers enable row level security';
    end if;

    if not exists (
      select 1 from pg_policies
      where tablename='suppliers' and policyname='suppliers_all'
    ) then
      execute $POL$
        create policy suppliers_all on suppliers
        for all using (is_org_member(org_id)) with check (org_id = current_org());
      $POL$;
    end if;

    if not exists (
      select 1 from pg_trigger where tgname='set_org_id_before_insert_suppliers'
    ) then
      execute $TRG$
        create trigger set_org_id_before_insert_suppliers
        before insert on suppliers
        for each row execute function set_org_id();
      $TRG$;
    end if;
  end if;
end$$;

/* -----------------------------------------------
   3) Ensure PO/POI needed columns exist (non-destructive)
   (We DO NOT rename; we adapt functions to your names.)
------------------------------------------------ */
-- If you ever want vendor_id in addition to supplier_id, uncomment:
-- alter table if exists purchase_orders add column if not exists vendor_id uuid;

-- Ensure helpful timestamps (if not present)
alter table if exists purchase_orders add column if not exists created_at timestamptz default now();

-- Your purchase_order_items uses qty_ordered (keep as-is) and unit_cost (numeric)
-- Make sure unit_cost is numeric and present
alter table if exists purchase_order_items
  add column if not exists unit_cost numeric;

-- Add index helpers (safe if they already exist)
create index if not exists idx_suppliers_org_name on suppliers(org_id, name);
create index if not exists idx_products_org_name  on products(org_id, name);

/* -----------------------------------------------
   4) RPCs aligned to your schema
------------------------------------------------ */

-- Upsert Product (works with existing products table/columns)
create or replace function upsert_product(p jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid; v_org uuid := current_org();
begin
  if v_org is null then raise exception 'No org in session'; end if;

  if (p->>'id') is null then
    insert into products (org_id, name, sku, category, cost, price)
    values (
      v_org,
      p->>'name',
      nullif(p->>'sku',''),
      nullif(p->>'category',''),
      nullif(p->>'cost','')::numeric,
      nullif(p->>'price','')::numeric
    )
    returning id into v_id;
  else
    if not exists (select 1 from products where id=(p->>'id')::uuid and org_id=v_org) then
      raise exception 'Product not found or not in your org';
    end if;

    update products set
      name        = coalesce(p->>'name', name),
      sku         = coalesce(nullif(p->>'sku',''), sku),
      category    = coalesce(nullif(p->>'category',''), category),
      cost        = coalesce(nullif(p->>'cost','')::numeric, cost),
      price       = coalesce(nullif(p->>'price','')::numeric, price)
    where id=(p->>'id')::uuid
    returning id into v_id;
  end if;

  return v_id;
end$$;

revoke all on function upsert_product(jsonb) from public;
grant execute on function upsert_product(jsonb) to authenticated;

-- Upsert Supplier (uses your suppliers table)
create or replace function upsert_supplier(p jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid; v_org uuid := current_org();
begin
  if v_org is null then raise exception 'No org in session'; end if;

  if (p->>'id') is null then
    insert into suppliers (org_id, name, contact)
    values (v_org, p->>'name', nullif(p->>'contact',''))
    returning id into v_id;
  else
    if not exists (select 1 from suppliers where id=(p->>'id')::uuid and org_id=v_org) then
      raise exception 'Supplier not found or not in your org';
    end if;
    update suppliers set
      name = coalesce(p->>'name', name),
      contact = coalesce(nullif(p->>'contact',''), contact)
    where id=(p->>'id')::uuid
    returning id into v_id;
  end if;

  return v_id;
end$$;

revoke all on function upsert_supplier(jsonb) from public;
grant execute on function upsert_supplier(jsonb) to authenticated;

-- List Products (search/pagination)
create or replace function list_products(p_search text default null, p_limit int default 50, p_offset int default 0)
returns setof products
language sql
security definer
set search_path = public
as $$
  select *
  from products
  where org_id = current_org()
    and (p_search is null
         or name ilike '%'||p_search||'%'
         or coalesce(sku,'') ilike '%'||p_search||'%'
         or coalesce(category,'') ilike '%'||p_search||'%')
  order by name asc
  limit greatest(p_limit,1) offset greatest(p_offset,0)
$$;

revoke all on function list_products(text,int,int) from public;
grant execute on function list_products(text,int,int) to authenticated;

-- List Suppliers (search/pagination)
create or replace function list_suppliers(p_search text default null, p_limit int default 50, p_offset int default 0)
returns setof suppliers
language sql
security definer
set search_path = public
as $$
  select *
  from suppliers
  where org_id = current_org()
    and (p_search is null or name ilike '%'||p_search||'%')
  order by name asc
  limit greatest(p_limit,1) offset greatest(p_offset,0)
$$;

revoke all on function list_suppliers(text,int,int) from public;
grant execute on function list_suppliers(text,int,int) to authenticated;

-- Transactional PO create aligned to supplier_id + qty_ordered + unit_cost (numeric)
create or replace function create_po_with_items(
  p_supplier_id uuid,
  p_items jsonb -- array of { product_id(uuid), qty(int), unit_cost(numeric) }
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_po_id uuid;
  v_len int;
begin
  -- Validate supplier belongs to caller's org
  if not exists (
    select 1 from suppliers s
    where s.id = p_supplier_id and is_org_member(s.org_id)
  ) then
    raise exception 'Invalid supplier or not authorized';
  end if;

  -- Validate items array
  if p_items is null then
    raise exception 'At least one item is required';
  end if;
  select jsonb_array_length(p_items) into v_len;
  if coalesce(v_len,0) < 1 then
    raise exception 'At least one item is required';
  end if;

  -- Validate each product belongs to org + fields sane
  if exists (
    select 1
    from jsonb_array_elements(p_items) as itm
    where (itm->>'product_id') is null
       or (itm->>'qty') is null
       or (itm->>'unit_cost') is null
       or (itm->>'qty')::int <= 0
       or (itm->>'unit_cost')::numeric < 0
  ) then
    raise exception 'Invalid line item(s): product_id/qty/unit_cost required and must be positive';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_items) as itm
    left join products p on p.id = (itm->>'product_id')::uuid
    where p.id is null or not is_org_member(p.org_id)
  ) then
    raise exception 'One or more products are invalid or not in your organization';
  end if;

  -- Create PO (uses supplier_id per your schema)
  insert into purchase_orders (org_id, supplier_id, status)
  values (current_org(), p_supplier_id, coalesce('DRAFT','DRAFT'))
  returning id into v_po_id;

  -- Insert items using qty_ordered + unit_cost (numeric)
  insert into purchase_order_items (org_id, po_id, product_id, qty_ordered, unit_cost)
  select
    current_org(),
    v_po_id,
    (itm->>'product_id')::uuid,
    (itm->>'qty')::int,
    (itm->>'unit_cost')::numeric
  from jsonb_array_elements(p_items) as itm;

  return v_po_id;
end
$$;

revoke all on function create_po_with_items(uuid, jsonb) from public;
grant execute on function create_po_with_items(uuid, jsonb) to authenticated;