-- Security Hardening Migration (Fixed)
-- Fix SECURITY DEFINER issues and improve RLS policies

-- Enable RLS on critical user tables (if not already enabled)
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.organizations ENABLE ROW LEVEL SECURITY;

-- Fix profiles table policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    -- Drop and recreate policies for profiles
    DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
    
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

-- Fix organizations table policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations' AND table_schema = 'public') THEN
    -- Drop and recreate policies for organizations
    DROP POLICY IF EXISTS "Org members can view their organization" ON public.organizations;
    DROP POLICY IF EXISTS "Org owners can update their organization" ON public.organizations;
    
    CREATE POLICY "Org members can view their organization" 
    ON public.organizations FOR SELECT 
    USING (
      EXISTS (
        SELECT 1 FROM public.memberships m 
        WHERE m.org_id = organizations.id 
        AND m.user_id = auth.uid()
      )
    );
    
    CREATE POLICY "Org owners can update their organization" 
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

-- Fix memberships table policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memberships' AND table_schema = 'public') THEN
    -- Drop and recreate policies for memberships
    DROP POLICY IF EXISTS "Users can view their own memberships" ON public.memberships;
    DROP POLICY IF EXISTS "Org owners can manage memberships" ON public.memberships;
    
    CREATE POLICY "Users can view their own memberships" 
    ON public.memberships FOR SELECT 
    USING (auth.uid() = user_id);
    
    CREATE POLICY "Org owners can manage memberships" 
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

-- Remove overly permissive demo policies on production tables
DROP POLICY IF EXISTS "dev_open" ON public.locations;
DROP POLICY IF EXISTS "dev_open" ON public.machines;
DROP POLICY IF EXISTS "dev_open" ON public.products;
DROP POLICY IF EXISTS "dev_open" ON public.inventory_levels;
DROP POLICY IF EXISTS "dev_open" ON public.sales;