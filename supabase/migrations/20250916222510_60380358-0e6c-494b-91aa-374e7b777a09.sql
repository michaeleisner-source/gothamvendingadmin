-- URGENT: Fix RLS recursion causing stack depth errors
-- The issue is circular references between organizations and memberships tables

-- First, let's remove the problematic policies that are causing recursion
DROP POLICY IF EXISTS "Org members can view their organization" ON public.organizations;
DROP POLICY IF EXISTS "Org owners can update their organization" ON public.organizations;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.memberships;
DROP POLICY IF EXISTS "Org owners can manage memberships" ON public.memberships;
DROP POLICY IF EXISTS "Org owners can create memberships" ON public.memberships;
DROP POLICY IF EXISTS "Org owners can delete memberships" ON public.memberships;

-- Create a SECURITY DEFINER function to safely check org membership without recursion
CREATE OR REPLACE FUNCTION public.check_org_member(target_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.memberships m
    WHERE m.org_id = target_org_id 
    AND m.user_id = auth.uid()
  );
$$;

-- Create a SECURITY DEFINER function to check if user is org owner
CREATE OR REPLACE FUNCTION public.check_org_owner(target_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.memberships m
    WHERE m.org_id = target_org_id 
    AND m.user_id = auth.uid()
    AND m.role = 'owner'
  );
$$;

-- Now create non-recursive policies using these SECURITY DEFINER functions

-- Organizations policies
CREATE POLICY "Org members can view organization"
ON public.organizations FOR SELECT
USING (public.check_org_member(id));

CREATE POLICY "Org owners can update organization"
ON public.organizations FOR UPDATE
USING (public.check_org_owner(id));

CREATE POLICY "Org owners can delete organization"
ON public.organizations FOR DELETE
USING (public.check_org_owner(id));

-- Memberships policies - these are simpler and won't cause recursion
CREATE POLICY "Users can view own memberships"
ON public.memberships FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memberships"
ON public.memberships FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- For now, let's use a simpler approach for membership management
-- Org owners can manage memberships in their org
CREATE POLICY "Org owners can manage memberships"
ON public.memberships FOR UPDATE
USING (public.check_org_owner(org_id));

CREATE POLICY "Org owners can delete memberships"
ON public.memberships FOR DELETE
USING (public.check_org_owner(org_id));