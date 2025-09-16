-- Fix remaining RLS security issues by adding missing policies for sensitive tables
-- Only add policies that don't already exist

-- Check and add RLS for tables that might not have it yet
DO $$
BEGIN
  -- Enable RLS on suppliers table if not already enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    WHERE t.tablename = 'suppliers' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
  END IF;
  
  -- Enable RLS on purchase_order_items if not already enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    WHERE t.tablename = 'purchase_order_items' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
  END IF;
END
$$;

-- Add missing RLS policies for suppliers if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'suppliers' 
    AND policyname = 'Users can view suppliers in their org'
  ) THEN
    CREATE POLICY "Users can view suppliers in their org" ON public.suppliers
    FOR SELECT USING (org_id = get_current_user_org_id());
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'suppliers' 
    AND policyname = 'Users can manage suppliers in their org'
  ) THEN
    CREATE POLICY "Users can manage suppliers in their org" ON public.suppliers
    FOR ALL USING (org_id = get_current_user_org_id()) WITH CHECK (org_id = get_current_user_org_id());
  END IF;
END
$$;

-- Add missing RLS policies for purchase_order_items if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'purchase_order_items' 
    AND policyname = 'Users can view purchase order items in their org'
  ) THEN
    CREATE POLICY "Users can view purchase order items in their org" ON public.purchase_order_items
    FOR SELECT USING (org_id = get_current_user_org_id());
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'purchase_order_items' 
    AND policyname = 'Users can manage purchase order items in their org'
  ) THEN
    CREATE POLICY "Users can manage purchase order items in their org" ON public.purchase_order_items
    FOR ALL USING (org_id = get_current_user_org_id()) WITH CHECK (org_id = get_current_user_org_id());
  END IF;
END
$$;

-- Check if we need to add missing policies for machine_health_alerts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'machine_health_alerts' 
    AND policyname = 'Users can view machine health alerts in their org'
  ) THEN
    CREATE POLICY "Users can view machine health alerts in their org" ON public.machine_health_alerts
    FOR SELECT USING (org_id = get_current_user_org_id());
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'machine_health_alerts' 
    AND policyname = 'Users can manage machine health alerts in their org'
  ) THEN
    CREATE POLICY "Users can manage machine health alerts in their org" ON public.machine_health_alerts
    FOR ALL USING (org_id = get_current_user_org_id()) WITH CHECK (org_id = get_current_user_org_id());
  END IF;
END
$$;