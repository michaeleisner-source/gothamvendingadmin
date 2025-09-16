-- Add missing trigger to automatically set org_id on sales table
CREATE TRIGGER set_org_id_trigger 
  BEFORE INSERT ON public.sales 
  FOR EACH ROW 
  EXECUTE FUNCTION public.set_org_id();