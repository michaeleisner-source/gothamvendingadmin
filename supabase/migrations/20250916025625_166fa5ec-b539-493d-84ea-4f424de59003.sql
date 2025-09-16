-- Add missing trigger to automatically set org_id on machine_finance table
CREATE TRIGGER set_org_id_trigger_machine_finance 
  BEFORE INSERT ON public.machine_finance 
  FOR EACH ROW 
  EXECUTE FUNCTION public.set_org_id();

-- Add missing trigger to automatically set org_id on other tables that need it
CREATE TRIGGER set_org_id_trigger_tickets 
  BEFORE INSERT ON public.tickets 
  FOR EACH ROW 
  EXECUTE FUNCTION public.set_org_id();

CREATE TRIGGER set_org_id_trigger_machine_processor_mappings 
  BEFORE INSERT ON public.machine_processor_mappings 
  FOR EACH ROW 
  EXECUTE FUNCTION public.set_org_id();

CREATE TRIGGER set_org_id_trigger_payment_processors 
  BEFORE INSERT ON public.payment_processors 
  FOR EACH ROW 
  EXECUTE FUNCTION public.set_org_id();

CREATE TRIGGER set_org_id_trigger_insurance_policies 
  BEFORE INSERT ON public.insurance_policies 
  FOR EACH ROW 
  EXECUTE FUNCTION public.set_org_id();

CREATE TRIGGER set_org_id_trigger_insurance_allocations 
  BEFORE INSERT ON public.insurance_allocations 
  FOR EACH ROW 
  EXECUTE FUNCTION public.set_org_id();