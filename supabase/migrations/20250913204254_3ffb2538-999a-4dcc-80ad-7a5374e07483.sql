-- Fix the RLS policies migration by properly dropping all existing policies

-- Prospects - drop all existing policies
drop policy if exists "prospects_allow_all" on prospects;
drop policy if exists "Allow all operations on locations" on prospects;
drop policy if exists "locations_allow_all" on prospects;
drop policy if exists "prospects_select" on prospects;
drop policy if exists "prospects_insert" on prospects;
drop policy if exists "prospects_update" on prospects;
drop policy if exists "prospects_delete" on prospects;

-- Create new org-scoped policies for prospects
create policy prospects_select on prospects for select
  using (is_org_member(org_id));
create policy prospects_insert on prospects for insert
  with check (org_id = current_org());
create policy prospects_update on prospects for update
  using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy prospects_delete on prospects for delete
  using (is_org_member(org_id));

-- Locations - drop all existing policies
drop policy if exists "locations_allow_all" on locations;
drop policy if exists "locations_select" on locations;
drop policy if exists "locations_cud" on locations;

-- Create new org-scoped policies for locations
create policy locations_select on locations for select
  using (is_org_member(org_id));
create policy locations_cud on locations for all
  using (is_org_member(org_id)) with check (org_id = current_org());

-- Machines - drop all existing policies
drop policy if exists "machines_allow_all" on machines;
drop policy if exists "Allow all operations on machines" on machines;
drop policy if exists "machines_all" on machines;

-- Create new org-scoped policy for machines
create policy machines_all on machines for all
  using (is_org_member(org_id)) with check (org_id = current_org());

-- Location types - drop all existing policies
drop policy if exists "location_types_allow_all" on location_types;
drop policy if exists "location_types_select" on location_types;
drop policy if exists "location_types_cud" on location_types;

-- Create new policies for location types (allow global rows if org_id is NULL)
create policy location_types_select on location_types for select
  using (org_id is null or is_org_member(org_id));
create policy location_types_cud on location_types for all
  using (is_org_member(org_id)) with check (org_id = current_org());

-- Purchase orders - drop all existing policies
drop policy if exists "purchase_orders_allow_all" on purchase_orders;
drop policy if exists "Allow all operations on purchase_orders" on purchase_orders;
drop policy if exists "po_all" on purchase_orders;

-- Create new org-scoped policy for purchase orders
create policy po_all on purchase_orders for all
  using (is_org_member(org_id)) with check (org_id = current_org());

-- Purchase order items - drop all existing policies
drop policy if exists "purchase_order_items_allow_all" on purchase_order_items;
drop policy if exists "Allow all operations on purchase_order_items" on purchase_order_items;
drop policy if exists "poi_all" on purchase_order_items;

-- Create new org-scoped policy for purchase order items
create policy poi_all on purchase_order_items for all
  using (is_org_member(org_id)) with check (org_id = current_org());

-- Products - drop all existing policies
drop policy if exists "Allow all operations on products" on products;
drop policy if exists "products_all" on products;

-- Create new org-scoped policy for products
create policy products_all on products for all
  using (is_org_member(org_id)) with check (org_id = current_org());

-- Suppliers - drop all existing policies
drop policy if exists "Allow all operations on suppliers" on suppliers;
drop policy if exists "suppliers_all" on suppliers;

-- Create new org-scoped policy for suppliers
create policy suppliers_all on suppliers for all
  using (is_org_member(org_id)) with check (org_id = current_org());