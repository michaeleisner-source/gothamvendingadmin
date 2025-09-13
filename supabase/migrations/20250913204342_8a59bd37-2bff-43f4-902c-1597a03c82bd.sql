-- Add org_id columns that don't exist yet
alter table if exists prospects             add column if not exists org_id uuid references organizations(id) on delete cascade;
alter table if exists locations             add column if not exists org_id uuid references organizations(id) on delete cascade;
alter table if exists machines              add column if not exists org_id uuid references organizations(id) on delete cascade;
alter table if exists location_types        add column if not exists org_id uuid references organizations(id) on delete cascade;
alter table if exists purchase_orders       add column if not exists org_id uuid references organizations(id) on delete cascade;
alter table if exists purchase_order_items  add column if not exists org_id uuid references organizations(id) on delete cascade;
alter table if exists products              add column if not exists org_id uuid references organizations(id) on delete cascade;
alter table if exists suppliers             add column if not exists org_id uuid references organizations(id) on delete cascade;

-- Backfill existing rows (only those without org_id)
update prospects             set org_id = current_org() where org_id is null;
update locations             set org_id = current_org() where org_id is null;
update machines              set org_id = current_org() where org_id is null;
update location_types        set org_id = current_org() where org_id is null;
update purchase_orders       set org_id = current_org() where org_id is null;
update purchase_order_items  set org_id = current_org() where org_id is null;
update products              set org_id = current_org() where org_id is null;
update suppliers             set org_id = current_org() where org_id is null;

-- Create triggers if they don't exist
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_org_id_before_insert_prospects') then
    create trigger set_org_id_before_insert_prospects before insert on prospects
    for each row execute function set_org_id();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'set_org_id_before_insert_locations') then
    create trigger set_org_id_before_insert_locations before insert on locations
    for each row execute function set_org_id();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'set_org_id_before_insert_machines') then
    create trigger set_org_id_before_insert_machines before insert on machines
    for each row execute function set_org_id();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'set_org_id_before_insert_location_types') then
    create trigger set_org_id_before_insert_location_types before insert on location_types
    for each row execute function set_org_id();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'set_org_id_before_insert_po') then
    create trigger set_org_id_before_insert_po before insert on purchase_orders
    for each row execute function set_org_id();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'set_org_id_before_insert_poi') then
    create trigger set_org_id_before_insert_poi before insert on purchase_order_items
    for each row execute function set_org_id();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'set_org_id_before_insert_products') then
    create trigger set_org_id_before_insert_products before insert on products
    for each row execute function set_org_id();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'set_org_id_before_insert_suppliers') then
    create trigger set_org_id_before_insert_suppliers before insert on suppliers
    for each row execute function set_org_id();
  end if;
end$$;

-- Drop all existing policies first to make this idempotent
drop policy if exists "prospects_allow_all" on prospects;
drop policy if exists "Allow all operations on locations" on prospects;
drop policy if exists "locations_allow_all" on prospects;
drop policy if exists "prospects_select" on prospects;
drop policy if exists "prospects_insert" on prospects;
drop policy if exists "prospects_update" on prospects;
drop policy if exists "prospects_delete" on prospects;

drop policy if exists "locations_allow_all" on locations;
drop policy if exists "locations_select" on locations;
drop policy if exists "locations_cud" on locations;

drop policy if exists "machines_allow_all" on machines;
drop policy if exists "Allow all operations on machines" on machines;
drop policy if exists "machines_all" on machines;

drop policy if exists "location_types_allow_all" on location_types;
drop policy if exists "location_types_select" on location_types;
drop policy if exists "location_types_cud" on location_types;

drop policy if exists "purchase_orders_allow_all" on purchase_orders;
drop policy if exists "Allow all operations on purchase_orders" on purchase_orders;
drop policy if exists "po_all" on purchase_orders;

drop policy if exists "purchase_order_items_allow_all" on purchase_order_items;
drop policy if exists "Allow all operations on purchase_order_items" on purchase_order_items;
drop policy if exists "poi_all" on purchase_order_items;

drop policy if exists "Allow all operations on products" on products;
drop policy if exists "products_all" on products;

drop policy if exists "Allow all operations on suppliers" on suppliers;
drop policy if exists "suppliers_all" on suppliers;

-- Create new org-scoped policies
create policy prospects_select on prospects for select
  using (is_org_member(org_id));
create policy prospects_insert on prospects for insert
  with check (org_id = current_org());
create policy prospects_update on prospects for update
  using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy prospects_delete on prospects for delete
  using (is_org_member(org_id));

create policy locations_select on locations for select
  using (is_org_member(org_id));
create policy locations_cud on locations for all
  using (is_org_member(org_id)) with check (org_id = current_org());

create policy machines_all on machines for all
  using (is_org_member(org_id)) with check (org_id = current_org());

create policy location_types_select on location_types for select
  using (org_id is null or is_org_member(org_id));
create policy location_types_cud on location_types for all
  using (is_org_member(org_id)) with check (org_id = current_org());

create policy po_all on purchase_orders for all
  using (is_org_member(org_id)) with check (org_id = current_org());

create policy poi_all on purchase_order_items for all
  using (is_org_member(org_id)) with check (org_id = current_org());

create policy products_all on products for all
  using (is_org_member(org_id)) with check (org_id = current_org());

create policy suppliers_all on suppliers for all
  using (is_org_member(org_id)) with check (org_id = current_org());

-- Create indexes
create index if not exists idx_prospects_org on prospects(org_id);
create index if not exists idx_locations_org on locations(org_id);
create index if not exists idx_machines_org on machines(org_id);
create index if not exists idx_po_org on purchase_orders(org_id);
create index if not exists idx_poi_po on purchase_order_items(po_id);
create index if not exists idx_products_org on products(org_id);
create index if not exists idx_suppliers_org on suppliers(org_id);

-- Update the convert function
create or replace function convert_prospect_to_location(p_prospect_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_location_id uuid;
  v_org uuid;
begin
  select org_id into v_org from prospects where id = p_prospect_id;
  if v_org is null or not is_org_member(v_org) then
    raise exception 'Not authorized or prospect not found';
  end if;

  insert into locations (
    name, location_type_id,
    contact_name, contact_email, contact_phone,
    address_line1, address_line2, city, state, postal_code,
    traffic_daily_est, traffic_monthly_est,
    from_prospect_id, org_id
  )
  select
    business_name, location_type_id,
    contact_name, contact_email, contact_phone,
    address_line1, address_line2, city, state, postal_code,
    traffic_daily_est, traffic_monthly_est,
    id, org_id
  from prospects
  where id = p_prospect_id
  returning id into new_location_id;

  update prospects set status = 'CONVERTED' where id = p_prospect_id;

  return new_location_id;
end
$$;