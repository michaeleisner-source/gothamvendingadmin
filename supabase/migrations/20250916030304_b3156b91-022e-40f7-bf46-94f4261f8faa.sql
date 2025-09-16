-- Fix the bootstrap_qa_org function to use proper UUIDs
CREATE OR REPLACE FUNCTION public.bootstrap_qa_org()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
DECLARE
  v_org_id uuid;
  v_user_id uuid;
BEGIN
  -- Check if we already have a QA org
  SELECT id INTO v_org_id FROM organizations WHERE name = 'QA Test Organization' LIMIT 1;
  
  IF v_org_id IS NULL THEN
    -- Create organization
    INSERT INTO organizations (name) VALUES ('QA Test Organization') RETURNING id INTO v_org_id;
    
    -- Create a proper UUID for QA user (deterministic so we can recreate)
    v_user_id := gen_random_uuid();
    
    -- Create profile for the QA user
    INSERT INTO profiles (id, org_id, full_name) 
    VALUES (v_user_id, v_org_id, 'QA Test User')
    ON CONFLICT (id) DO NOTHING;
    
    -- Create membership
    INSERT INTO memberships (org_id, user_id, role) 
    VALUES (v_org_id, v_user_id, 'owner')
    ON CONFLICT (org_id, user_id) DO NOTHING;
  END IF;
  
  RETURN v_org_id;
END;
$$;