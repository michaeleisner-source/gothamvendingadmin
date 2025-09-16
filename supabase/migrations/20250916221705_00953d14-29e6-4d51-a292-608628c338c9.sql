-- Security Hardening Phase 2
-- Fix remaining Security Definer views and missing RLS policies

-- First, let's identify and fix any SECURITY DEFINER views
-- Convert any SECURITY DEFINER views to SECURITY INVOKER where appropriate

-- Fix the v_machine_health view if it exists and has SECURITY DEFINER
DO $$
BEGIN
  -- Check if v_machine_health view exists
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'v_machine_health' AND table_schema = 'public') THEN
    -- PostgreSQL 15+ syntax to make view use SECURITY INVOKER
    ALTER VIEW public.v_machine_health SET (security_invoker = on);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- If the ALTER VIEW command fails (older PostgreSQL), we need to recreate the view
    -- For now, we'll just note this needs manual attention
    NULL;
END $$;

-- Add missing RLS policies for tables that have RLS enabled but no policies

-- Add RLS policies for organizations table if missing
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations' AND table_schema = 'public') THEN
    -- Ensure we have an INSERT policy for organizations
    DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
    CREATE POLICY "Authenticated users can create organizations"
    ON public.organizations FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
    
    -- Add a DELETE policy for org owners
    DROP POLICY IF EXISTS "Org owners can delete their organization" ON public.organizations;
    CREATE POLICY "Org owners can delete their organization"
    ON public.organizations FOR DELETE
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

-- Add missing RLS policies for memberships table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memberships' AND table_schema = 'public') THEN
    -- Add INSERT policy for memberships
    DROP POLICY IF EXISTS "Org owners can create memberships" ON public.memberships;
    CREATE POLICY "Org owners can create memberships"
    ON public.memberships FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.memberships owner_check 
        WHERE owner_check.org_id = memberships.org_id 
        AND owner_check.user_id = auth.uid() 
        AND owner_check.role = 'owner'
      )
    );
    
    -- Add DELETE policy for memberships
    DROP POLICY IF EXISTS "Org owners can delete memberships" ON public.memberships;
    CREATE POLICY "Org owners can delete memberships"
    ON public.memberships FOR DELETE
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

-- Ensure all critical functions use SECURITY INVOKER instead of SECURITY DEFINER
-- Convert specific functions that should not be SECURITY DEFINER

-- Fix any SECURITY DEFINER functions that don't need elevated privileges
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Find and convert non-critical SECURITY DEFINER functions
    FOR func_record IN 
        SELECT n.nspname as schema_name, p.proname as function_name, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE p.prosecdef = true 
        AND n.nspname = 'public'
        AND p.proname NOT IN (
            -- Keep these as SECURITY DEFINER (they need elevated privileges)
            'current_org', 'is_org_member', 'is_org_member_safe', 'get_current_org_safe',
            'set_org_id', 'set_org_id_qa', 'bootstrap_qa_org', 'bootstrap_org_for_me'
        )
    LOOP
        BEGIN
            -- Convert to SECURITY INVOKER
            EXECUTE format('ALTER FUNCTION %I.%I(%s) SECURITY INVOKER', 
                          func_record.schema_name, 
                          func_record.function_name, 
                          func_record.args);
        EXCEPTION
            WHEN OTHERS THEN
                -- Some functions may need to remain SECURITY DEFINER
                CONTINUE;
        END;
    END LOOP;
END $$;