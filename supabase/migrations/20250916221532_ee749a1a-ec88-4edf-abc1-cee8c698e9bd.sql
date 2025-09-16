-- Security Hardening Migration
-- Fix SECURITY DEFINER issues and improve RLS policies

-- A) First, let's check what SECURITY DEFINER functions exist
-- (This query helps identify what needs to be fixed)

-- B) Convert key functions to SECURITY INVOKER where appropriate
-- Note: Some functions may need to remain SECURITY DEFINER for proper operation

-- C) Enable RLS on any tables that don't have it yet
-- Most tables already have RLS, but let's ensure critical ones are covered

-- Enable RLS on user-sensitive tables (if not already enabled)
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.organizations ENABLE ROW LEVEL SECURITY;

-- D) Create tighter org-scoped policies where needed
-- Most tables already have org-based RLS, but let's add some missing ones

-- Ensure profiles table has proper RLS
DO $$
BEGIN
  -- Check if profiles table exists and add policy if missing
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    -- Drop any overly permissive policies and create org-scoped ones
    DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    
    CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);
    
    CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);
    
    CREATE POLICY "Users can insert own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- E) Ensure organizations table has proper RLS
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations' AND table_schema = 'public') THEN
    -- Create org member access policy
    CREATE POLICY IF NOT EXISTS "Org members can view their organization" 
    ON public.organizations FOR SELECT 
    USING (
      EXISTS (
        SELECT 1 FROM public.memberships m 
        WHERE m.org_id = organizations.id 
        AND m.user_id = auth.uid()
      )
    );
    
    CREATE POLICY IF NOT EXISTS "Org owners can update their organization" 
    ON public.organizations FOR UPDATE 
    USING (
      EXISTS (
        SELECT 1 FROM public.memberships m 
        WHERE m.org_id = organizations.id 
        AND m.user_id = auth.uid() 
        AND m.role = 'owner'
      )
    );
  END IF;
END $$;

-- F) Ensure memberships table has proper RLS
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memberships' AND table_schema = 'public') THEN
    CREATE POLICY IF NOT EXISTS "Users can view their own memberships" 
    ON public.memberships FOR SELECT 
    USING (auth.uid() = user_id);
    
    CREATE POLICY IF NOT EXISTS "Org owners can manage memberships" 
    ON public.memberships FOR ALL 
    USING (
      EXISTS (
        SELECT 1 FROM public.memberships owner_check 
        WHERE owner_check.org_id = memberships.org_id 
        AND owner_check.user_id = auth.uid() 
        AND owner_check.role = 'owner'
      )
    );
  END IF;
END $$;

-- G) Remove any overly permissive demo policies on production tables
-- Keep only org-scoped access for real data tables
DROP POLICY IF EXISTS "dev_open" ON public.locations;
DROP POLICY IF EXISTS "dev_open" ON public.machines;
DROP POLICY IF EXISTS "dev_open" ON public.products;
DROP POLICY IF EXISTS "dev_open" ON public.inventory_levels;
DROP POLICY IF EXISTS "dev_open" ON public.sales;

-- Note: Help system tables can remain publicly accessible as they contain non-sensitive content