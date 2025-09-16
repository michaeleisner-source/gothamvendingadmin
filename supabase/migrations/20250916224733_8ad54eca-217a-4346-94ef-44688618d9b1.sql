-- Fix RLS recursion on purchase order related tables
-- Replace recursive functions with our SECURITY DEFINER functions

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "po_all" ON public.purchase_orders;
DROP POLICY IF EXISTS "poi_all" ON public.purchase_order_items;  
DROP POLICY IF EXISTS "suppliers_all" ON public.suppliers;

-- Create new non-recursive policies for purchase_orders
CREATE POLICY "purchase_orders_org_read"
ON public.purchase_orders FOR SELECT
TO authenticated
USING (public.check_org_member(org_id));

CREATE POLICY "purchase_orders_org_write"
ON public.purchase_orders FOR INSERT
TO authenticated
WITH CHECK (org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "purchase_orders_org_update"
ON public.purchase_orders FOR UPDATE
TO authenticated
USING (public.check_org_member(org_id));

CREATE POLICY "purchase_orders_org_delete"
ON public.purchase_orders FOR DELETE
TO authenticated
USING (public.check_org_member(org_id));

-- Create new non-recursive policies for purchase_order_items
CREATE POLICY "purchase_order_items_org_read"
ON public.purchase_order_items FOR SELECT
TO authenticated
USING (public.check_org_member(org_id));

CREATE POLICY "purchase_order_items_org_write"
ON public.purchase_order_items FOR INSERT
TO authenticated
WITH CHECK (org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "purchase_order_items_org_update"
ON public.purchase_order_items FOR UPDATE
TO authenticated
USING (public.check_org_member(org_id));

CREATE POLICY "purchase_order_items_org_delete"
ON public.purchase_order_items FOR DELETE
TO authenticated
USING (public.check_org_member(org_id));

-- Create new non-recursive policies for suppliers
CREATE POLICY "suppliers_org_read"
ON public.suppliers FOR SELECT
TO authenticated
USING (public.check_org_member(org_id));

CREATE POLICY "suppliers_org_write"
ON public.suppliers FOR INSERT
TO authenticated
WITH CHECK (org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "suppliers_org_update"
ON public.suppliers FOR UPDATE
TO authenticated
USING (public.check_org_member(org_id));

CREATE POLICY "suppliers_org_delete"
ON public.suppliers FOR DELETE
TO authenticated
USING (public.check_org_member(org_id));