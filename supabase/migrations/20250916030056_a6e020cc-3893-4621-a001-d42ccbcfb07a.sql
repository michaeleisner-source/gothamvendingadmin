-- Create a function to bootstrap QA testing without requiring authentication
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
    
    -- Create a dummy user UUID for QA
    v_user_id := 'qa-test-user-' || substring(gen_random_uuid()::text from 1 for 8);
    
    -- Create profile for the QA user
    INSERT INTO profiles (id, org_id, full_name) 
    VALUES (v_user_id::uuid, v_org_id, 'QA Test User')
    ON CONFLICT (id) DO NOTHING;
    
    -- Create membership
    INSERT INTO memberships (org_id, user_id, role) 
    VALUES (v_org_id, v_user_id::uuid, 'owner')
    ON CONFLICT (org_id, user_id) DO NOTHING;
  END IF;
  
  RETURN v_org_id;
END;
$$;

-- Create a modified set_org_id function that can use a default QA org if no user is authenticated
CREATE OR REPLACE FUNCTION public.set_org_id_qa()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  -- Try to get current org from authenticated user first
  v_org_id := current_org();
  
  -- If no authenticated user, use QA org
  IF v_org_id IS NULL THEN
    v_org_id := bootstrap_qa_org();
  END IF;
  
  NEW.org_id := v_org_id;
  RETURN NEW;
END;
$$;

-- Update all the triggers to use the QA-friendly function
DROP TRIGGER IF EXISTS set_org_id_sales_trigger ON public.sales;
CREATE TRIGGER set_org_id_sales_trigger 
  BEFORE INSERT ON public.sales 
  FOR EACH ROW 
  EXECUTE FUNCTION public.set_org_id_qa();

DROP TRIGGER IF EXISTS set_org_id_trigger_machine_finance ON public.machine_finance;
CREATE TRIGGER set_org_id_trigger_machine_finance 
  BEFORE INSERT ON public.machine_finance 
  FOR EACH ROW 
  EXECUTE FUNCTION public.set_org_id_qa();

DROP TRIGGER IF EXISTS set_org_id_trigger_tickets ON public.tickets;
CREATE TRIGGER set_org_id_trigger_tickets 
  BEFORE INSERT ON public.tickets 
  FOR EACH ROW 
  EXECUTE FUNCTION public.set_org_id_qa();

DROP TRIGGER IF EXISTS set_org_id_trigger_machine_processor_mappings ON public.machine_processor_mappings;
CREATE TRIGGER set_org_id_trigger_machine_processor_mappings 
  BEFORE INSERT ON public.machine_processor_mappings 
  FOR EACH ROW 
  EXECUTE FUNCTION public.set_org_id_qa();

DROP TRIGGER IF EXISTS set_org_id_trigger_payment_processors ON public.payment_processors;
CREATE TRIGGER set_org_id_trigger_payment_processors 
  BEFORE INSERT ON public.payment_processors 
  FOR EACH ROW 
  EXECUTE FUNCTION public.set_org_id_qa();

DROP TRIGGER IF EXISTS set_org_id_trigger_insurance_policies ON public.insurance_policies;
CREATE TRIGGER set_org_id_trigger_insurance_policies 
  BEFORE INSERT ON public.insurance_policies 
  FOR EACH ROW 
  EXECUTE FUNCTION public.set_org_id_qa();

DROP TRIGGER IF EXISTS set_org_id_trigger_insurance_allocations ON public.insurance_allocations;
CREATE TRIGGER set_org_id_trigger_insurance_allocations 
  BEFORE INSERT ON public.insurance_allocations 
  FOR EACH ROW 
  EXECUTE FUNCTION public.set_org_id_qa();