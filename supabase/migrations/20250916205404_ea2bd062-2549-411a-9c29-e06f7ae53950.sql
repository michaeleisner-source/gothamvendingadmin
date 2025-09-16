-- Fix infinite recursion in profiles RLS policy and add proper security policies

-- 1. Create security definer function to get current user's org_id
CREATE OR REPLACE FUNCTION public.get_current_user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- 2. Drop the problematic RLS policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can view other profiles in their org" ON public.profiles;

-- 3. Create new policy using the security definer function
CREATE POLICY "Users can view other profiles in their org" ON public.profiles
  FOR SELECT USING (
    id <> auth.uid() AND org_id = public.get_current_user_org_id()
  );

-- 4. Add proper RLS policies for business-critical tables
-- Enable RLS on key tables if not already enabled
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_finance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_policies ENABLE ROW LEVEL SECURITY;

-- Create policies for locations table (customer contact information)
CREATE POLICY "Users can view locations in their org" ON public.locations
  FOR SELECT USING (org_id = public.get_current_user_org_id());

CREATE POLICY "Users can insert locations for their org" ON public.locations
  FOR INSERT WITH CHECK (org_id = public.get_current_user_org_id());

CREATE POLICY "Users can update locations in their org" ON public.locations
  FOR UPDATE USING (org_id = public.get_current_user_org_id());

CREATE POLICY "Users can delete locations in their org" ON public.locations
  FOR DELETE USING (org_id = public.get_current_user_org_id());

-- Create policies for machines table
CREATE POLICY "Users can view machines in their org" ON public.machines
  FOR SELECT USING (org_id = public.get_current_user_org_id());

CREATE POLICY "Users can insert machines for their org" ON public.machines
  FOR INSERT WITH CHECK (org_id = public.get_current_user_org_id());

CREATE POLICY "Users can update machines in their org" ON public.machines
  FOR UPDATE USING (org_id = public.get_current_user_org_id());

CREATE POLICY "Users can delete machines in their org" ON public.machines
  FOR DELETE USING (org_id = public.get_current_user_org_id());

-- Create policies for prospects table
CREATE POLICY "Users can view prospects in their org" ON public.prospects
  FOR SELECT USING (org_id = public.get_current_user_org_id());

CREATE POLICY "Users can insert prospects for their org" ON public.prospects
  FOR INSERT WITH CHECK (org_id = public.get_current_user_org_id());

CREATE POLICY "Users can update prospects in their org" ON public.prospects
  FOR UPDATE USING (org_id = public.get_current_user_org_id());

CREATE POLICY "Users can delete prospects in their org" ON public.prospects
  FOR DELETE USING (org_id = public.get_current_user_org_id());

-- Create policies for sales table (financial data)
CREATE POLICY "Users can view sales in their org" ON public.sales
  FOR SELECT USING (org_id = public.get_current_user_org_id());

CREATE POLICY "Users can insert sales for their org" ON public.sales
  FOR INSERT WITH CHECK (org_id = public.get_current_user_org_id());

CREATE POLICY "Users can update sales in their org" ON public.sales
  FOR UPDATE USING (org_id = public.get_current_user_org_id());

-- Create policies for purchase_orders table
CREATE POLICY "Users can view purchase orders in their org" ON public.purchase_orders
  FOR SELECT USING (org_id = public.get_current_user_org_id());

CREATE POLICY "Users can insert purchase orders for their org" ON public.purchase_orders
  FOR INSERT WITH CHECK (org_id = public.get_current_user_org_id());

CREATE POLICY "Users can update purchase orders in their org" ON public.purchase_orders
  FOR UPDATE USING (org_id = public.get_current_user_org_id());

-- Create policies for inventory_levels table
CREATE POLICY "Users can view inventory levels in their org" ON public.inventory_levels
  FOR SELECT USING (org_id = public.get_current_user_org_id());

CREATE POLICY "Users can insert inventory levels for their org" ON public.inventory_levels
  FOR INSERT WITH CHECK (org_id = public.get_current_user_org_id());

CREATE POLICY "Users can update inventory levels in their org" ON public.inventory_levels
  FOR UPDATE USING (org_id = public.get_current_user_org_id());

-- Create policies for machine_finance table (financial data)
CREATE POLICY "Users can view machine finance in their org" ON public.machine_finance
  FOR SELECT USING (org_id = public.get_current_user_org_id());

CREATE POLICY "Users can insert machine finance for their org" ON public.machine_finance
  FOR INSERT WITH CHECK (org_id = public.get_current_user_org_id());

CREATE POLICY "Users can update machine finance in their org" ON public.machine_finance
  FOR UPDATE USING (org_id = public.get_current_user_org_id());

-- Create policies for insurance_policies table (financial data)
CREATE POLICY "Users can view insurance policies in their org" ON public.insurance_policies
  FOR SELECT USING (org_id = public.get_current_user_org_id());

CREATE POLICY "Users can insert insurance policies for their org" ON public.insurance_policies
  FOR INSERT WITH CHECK (org_id = public.get_current_user_org_id());

CREATE POLICY "Users can update insurance policies in their org" ON public.insurance_policies
  FOR UPDATE USING (org_id = public.get_current_user_org_id());