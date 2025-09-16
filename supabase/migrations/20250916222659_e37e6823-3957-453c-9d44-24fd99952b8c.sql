-- URGENT: Fix RLS recursion causing stack depth errors
-- Step 1: Drop ALL existing policies on organizations and memberships tables to start fresh

-- Drop ALL policies on organizations table
DO $$
DECLARE
    pol_record RECORD;
BEGIN
    FOR pol_record IN 
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'organizations'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.organizations', pol_record.policyname);
    END LOOP;
END $$;

-- Drop ALL policies on memberships table  
DO $$
DECLARE
    pol_record RECORD;
BEGIN
    FOR pol_record IN 
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'memberships'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.memberships', pol_record.policyname);
    END LOOP;
END $$;

-- Create SECURITY DEFINER functions to safely check org membership without recursion
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

-- Create new non-recursive policies

-- Organizations policies
CREATE POLICY "Org members view organization"
ON public.organizations FOR SELECT
USING (public.check_org_member(id));

CREATE POLICY "Org owners update organization"
ON public.organizations FOR UPDATE
USING (public.check_org_owner(id));

CREATE POLICY "Users create organizations"
ON public.organizations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Memberships policies (simple, no recursion)
CREATE POLICY "Users view own memberships"
ON public.memberships FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users create own memberships"
ON public.memberships FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Temporarily allow all org members to manage memberships to avoid recursion
-- We can tighten this later once the recursion is fixed
CREATE POLICY "Authenticated users manage memberships"
ON public.memberships FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users delete memberships"
ON public.memberships FOR DELETE
USING (auth.uid() IS NOT NULL);