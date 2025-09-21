-- Enable RLS and create secure policies for critical exposed tables
-- CRITICAL: Fix the publicly exposed data identified in the security audit

-- Enable RLS on exposed tables
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_finance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_policies ENABLE ROW LEVEL SECURITY;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow all operations on leads" ON public.leads;
DROP POLICY IF EXISTS "Allow all operations on locations" ON public.locations;
DROP POLICY IF EXISTS "Allow all operations on inventory" ON public.inventory;
DROP POLICY IF EXISTS "dev_open" ON public.machine_finance;
DROP POLICY IF EXISTS "dev_open" ON public.insurance_policies;

-- Create secure org-scoped policies for leads
CREATE POLICY "leads_select" ON public.leads FOR SELECT USING (org_id = public.current_org_id());
CREATE POLICY "leads_insert" ON public.leads FOR INSERT WITH CHECK (org_id = public.current_org_id());
CREATE POLICY "leads_update" ON public.leads FOR UPDATE USING (org_id = public.current_org_id()) WITH CHECK (org_id = public.current_org_id());
CREATE POLICY "leads_delete" ON public.leads FOR DELETE USING (org_id = public.current_org_id() AND public.is_org_admin());

-- Create secure org-scoped policies for locations
CREATE POLICY "locations_select" ON public.locations FOR SELECT USING (org_id = public.current_org_id());
CREATE POLICY "locations_insert" ON public.locations FOR INSERT WITH CHECK (org_id = public.current_org_id());
CREATE POLICY "locations_update" ON public.locations FOR UPDATE USING (org_id = public.current_org_id()) WITH CHECK (org_id = public.current_org_id());
CREATE POLICY "locations_delete" ON public.locations FOR DELETE USING (org_id = public.current_org_id() AND public.is_org_admin());

-- Create secure org-scoped policies for machines  
CREATE POLICY "machines_select" ON public.machines FOR SELECT USING (org_id = public.current_org_id());
CREATE POLICY "machines_insert" ON public.machines FOR INSERT WITH CHECK (org_id = public.current_org_id());
CREATE POLICY "machines_update" ON public.machines FOR UPDATE USING (org_id = public.current_org_id()) WITH CHECK (org_id = public.current_org_id());
CREATE POLICY "machines_delete" ON public.machines FOR DELETE USING (org_id = public.current_org_id() AND public.is_org_admin());