-- Fix bootstrap_qa_org to avoid foreign key constraint issues
CREATE OR REPLACE FUNCTION public.bootstrap_qa_org()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  -- Check if we already have a QA org
  SELECT id INTO v_org_id FROM organizations WHERE name = 'QA Test Organization' LIMIT 1;
  
  IF v_org_id IS NULL THEN
    -- Create organization without any user dependencies
    INSERT INTO organizations (name) VALUES ('QA Test Organization') RETURNING id INTO v_org_id;
    
    -- Note: We don't create profiles or memberships since those require real auth.users
    -- The org_id triggers will use this org_id as fallback
  END IF;
  
  RETURN v_org_id;
END;
$$;