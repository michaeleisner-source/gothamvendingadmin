-- Fix RLS recursion by removing duplicate policies and keeping only the safe ones

-- Drop old recursive policies on purchase_orders
DROP POLICY IF EXISTS "Users can insert purchase orders for their org" ON purchase_orders;
DROP POLICY IF EXISTS "Users can update purchase orders in their org" ON purchase_orders;
DROP POLICY IF EXISTS "Users can view purchase orders in their org" ON purchase_orders;

-- Drop old recursive policies on purchase_order_items  
DROP POLICY IF EXISTS "Users can manage purchase order items in their org" ON purchase_order_items;
DROP POLICY IF EXISTS "Users can view purchase order items in their org" ON purchase_order_items;

-- Drop old recursive policies on suppliers
DROP POLICY IF EXISTS "Users can manage suppliers in their org" ON suppliers;
DROP POLICY IF EXISTS "Users can view suppliers in their org" ON suppliers;

-- Verify the safe policies are still in place (these should remain)
-- po_all, poi_all, suppliers_all policies use is_org_member() and current_org() - they're safe

-- Let's also check if get_current_user_org_id function exists and is potentially problematic
SELECT proname, prosrc FROM pg_proc WHERE proname = 'get_current_user_org_id';