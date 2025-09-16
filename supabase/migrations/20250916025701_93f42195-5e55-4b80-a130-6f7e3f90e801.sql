-- Add missing org_id triggers with proper handling of existing triggers

-- Drop and recreate machine_finance trigger if it exists
DROP TRIGGER IF EXISTS set_org_id_trigger_machine_finance ON public.machine_finance;
CREATE TRIGGER set_org_id_trigger_machine_finance 
  BEFORE INSERT ON public.machine_finance 
  FOR EACH ROW 
  EXECUTE FUNCTION public.set_org_id();

-- Add triggers for other tables that need org_id auto-population
DROP TRIGGER IF EXISTS set_org_id_trigger_tickets ON public.tickets;
CREATE TRIGGER set_org_id_trigger_tickets 
  BEFORE INSERT ON public.tickets 
  FOR EACH ROW 
  EXECUTE FUNCTION public.set_org_id();

DROP TRIGGER IF EXISTS set_org_id_trigger_machine_processor_mappings ON public.machine_processor_mappings;
CREATE TRIGGER set_org_id_trigger_machine_processor_mappings 
  BEFORE INSERT ON public.machine_processor_mappings 
  FOR EACH ROW 
  EXECUTE FUNCTION public.set_org_id();

DROP TRIGGER IF EXISTS set_org_id_trigger_payment_processors ON public.payment_processors;
CREATE TRIGGER set_org_id_trigger_payment_processors 
  BEFORE INSERT ON public.payment_processors 
  FOR EACH ROW 
  EXECUTE FUNCTION public.set_org_id();

DROP TRIGGER IF EXISTS set_org_id_trigger_insurance_policies ON public.insurance_policies;
CREATE TRIGGER set_org_id_trigger_insurance_policies 
  BEFORE INSERT ON public.insurance_policies 
  FOR EACH ROW 
  EXECUTE FUNCTION public.set_org_id();

DROP TRIGGER IF EXISTS set_org_id_trigger_insurance_allocations ON public.insurance_allocations;
CREATE TRIGGER set_org_id_trigger_insurance_allocations 
  BEFORE INSERT ON public.insurance_allocations 
  FOR EACH ROW 
  EXECUTE FUNCTION public.set_org_id();