-- Fix critical RLS infinite recursion in memberships table
-- Create security definer function to check if user is organization owner
CREATE OR REPLACE FUNCTION public.is_org_owner(target_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM memberships m
    WHERE m.org_id = target_org_id 
      AND m.user_id = auth.uid() 
      AND m.role = 'owner'
  )
$$;

-- Drop and recreate the problematic memberships policy
DROP POLICY IF EXISTS "Organization owners can manage memberships" ON memberships;

CREATE POLICY "Organization owners can manage memberships"
ON memberships
FOR ALL
USING (is_org_owner(org_id));

-- Fix location_types policy to require authentication (remove business intelligence leakage)
DROP POLICY IF EXISTS "location_types_select" ON location_types;

CREATE POLICY "location_types_select"
ON location_types
FOR SELECT
USING (is_org_member(org_id));

-- Add comment for security documentation
COMMENT ON FUNCTION public.is_org_owner(uuid) IS 'Security definer function to check if current user is owner of specified organization. Prevents RLS infinite recursion.';