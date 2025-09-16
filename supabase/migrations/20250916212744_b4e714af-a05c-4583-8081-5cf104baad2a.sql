-- Fix critical RLS security issues by enabling proper Row Level Security
-- This addresses the critical security findings about publicly accessible data

-- Enable RLS on all critical tables that don't have it yet
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_processors ENABLE ROW LEVEL SECURITY;

-- Add comprehensive RLS policies for all critical business data tables

-- Sales data protection
CREATE POLICY "Users can view sales in their org" ON public.sales
FOR SELECT USING (org_id = get_current_user_org_id());

CREATE POLICY "Users can insert sales for their org" ON public.sales
FOR INSERT WITH CHECK (org_id = get_current_user_org_id());

CREATE POLICY "Users can update sales in their org" ON public.sales
FOR UPDATE USING (org_id = get_current_user_org_id());

-- Machine telemetry protection
CREATE POLICY "Users can view machine telemetry in their org" ON public.machine_telemetry
FOR SELECT USING (org_id = get_current_user_org_id());

CREATE POLICY "Users can insert machine telemetry for their org" ON public.machine_telemetry
FOR INSERT WITH CHECK (org_id = get_current_user_org_id());

-- Machine performance metrics protection
CREATE POLICY "Users can view machine performance in their org" ON public.machine_performance_metrics
FOR SELECT USING (org_id = get_current_user_org_id());

CREATE POLICY "Users can insert machine performance for their org" ON public.machine_performance_metrics
FOR INSERT WITH CHECK (org_id = get_current_user_org_id());

-- Payment processors protection
CREATE POLICY "Users can view payment processors in their org" ON public.payment_processors
FOR SELECT USING (org_id = get_current_user_org_id());

CREATE POLICY "Users can manage payment processors in their org" ON public.payment_processors
FOR ALL USING (org_id = get_current_user_org_id()) WITH CHECK (org_id = get_current_user_org_id());

-- Add missing RLS policies for other sensitive tables

-- Purchase orders protection (if not already covered)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'purchase_orders' 
    AND policyname = 'Users can view purchase orders in their org'
  ) THEN
    CREATE POLICY "Users can view purchase orders in their org" ON public.purchase_orders
    FOR SELECT USING (org_id = get_current_user_org_id());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'purchase_orders' 
    AND policyname = 'Users can manage purchase orders in their org'
  ) THEN
    CREATE POLICY "Users can manage purchase orders in their org" ON public.purchase_orders
    FOR ALL USING (org_id = get_current_user_org_id()) WITH CHECK (org_id = get_current_user_org_id());
  END IF;
END
$$;

-- Purchase order items protection
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'purchase_order_items'
  ) THEN
    ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view purchase order items in their org" ON public.purchase_order_items
    FOR SELECT USING (org_id = get_current_user_org_id());
    
    CREATE POLICY "Users can manage purchase order items in their org" ON public.purchase_order_items
    FOR ALL USING (org_id = get_current_user_org_id()) WITH CHECK (org_id = get_current_user_org_id());
  END IF;
END
$$;

-- Products protection (additional policies if needed)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'products' 
    AND policyname = 'Users can delete products in their org'
  ) THEN
    CREATE POLICY "Users can delete products in their org" ON public.products
    FOR DELETE USING (org_id = get_current_user_org_id());
  END IF;
END
$$;

-- Suppliers protection (additional policies if needed)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'suppliers'
  ) THEN
    ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view suppliers in their org" ON public.suppliers
    FOR SELECT USING (org_id = get_current_user_org_id());
    
    CREATE POLICY "Users can manage suppliers in their org" ON public.suppliers
    FOR ALL USING (org_id = get_current_user_org_id()) WITH CHECK (org_id = get_current_user_org_id());
  END IF;
END
$$;

-- Staff/profiles additional protection
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'staff'
  ) THEN
    -- Enable RLS on staff table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff') THEN
      ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "Users can view staff in their org" ON public.staff
      FOR SELECT USING (org_id = get_current_user_org_id());
      
      CREATE POLICY "Users can manage staff in their org" ON public.staff
      FOR ALL USING (org_id = get_current_user_org_id()) WITH CHECK (org_id = get_current_user_org_id());
    END IF;
  END IF;
END
$$;