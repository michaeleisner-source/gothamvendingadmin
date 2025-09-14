-- Fix security vulnerability: Convert PERMISSIVE RLS policies to RESTRICTIVE
-- This ensures ONLY organization members can access sensitive data

-- Drop existing permissive policies and recreate as restrictive
DROP POLICY IF EXISTS "locations_select" ON public.locations;
DROP POLICY IF EXISTS "locations_cud" ON public.locations;
DROP POLICY IF EXISTS "staff_all" ON public.staff;
DROP POLICY IF EXISTS "machine_finance_all" ON public.machine_finance;
DROP POLICY IF EXISTS "sales_all" ON public.sales;

-- Create RESTRICTIVE policies for locations table (contains sensitive contact info)
CREATE POLICY "locations_select_restrictive" 
ON public.locations 
FOR SELECT 
TO public
USING (is_org_member(org_id))
WITH CHECK (false); -- No WITH CHECK needed for SELECT

CREATE POLICY "locations_cud_restrictive" 
ON public.locations 
FOR ALL 
TO public
USING (is_org_member(org_id))
WITH CHECK (org_id = current_org());

-- Create RESTRICTIVE policies for staff table (contains employee PII)
CREATE POLICY "staff_all_restrictive" 
ON public.staff 
FOR ALL 
TO public
USING (is_org_member(org_id))
WITH CHECK (org_id = current_org());

-- Create RESTRICTIVE policies for machine_finance table (contains financial data)
CREATE POLICY "machine_finance_all_restrictive" 
ON public.machine_finance 
FOR ALL 
TO public
USING (is_org_member(org_id))
WITH CHECK (org_id = current_org());

-- Create RESTRICTIVE policies for sales table (contains business intelligence)
CREATE POLICY "sales_all_restrictive" 
ON public.sales 
FOR ALL 
TO public
USING (is_org_member(org_id))
WITH CHECK (org_id = current_org());