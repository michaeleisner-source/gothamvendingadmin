-- Fix the recursive RLS issue by creating a security definer function
-- that bypasses RLS when getting the current user's org_id

-- 1. Create a new security definer function to get current org without RLS
CREATE OR REPLACE FUNCTION public.get_current_org_safe()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- This function bypasses RLS by using security definer
  SELECT org_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 2. Update the current_org function to use the safe version
CREATE OR REPLACE FUNCTION public.current_org()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER  
SET search_path = public
AS $$
  SELECT public.get_current_org_safe();
$$;

-- 3. Also create a safe membership check function
CREATE OR REPLACE FUNCTION public.is_org_member_safe(target_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public  
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.memberships m
    WHERE m.org_id = target_org_id AND m.user_id = auth.uid()
  );
$$;

-- 4. Update the is_org_member function to use the safe version
CREATE OR REPLACE FUNCTION public.is_org_member(row_org uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_org_member_safe(row_org);
$$;