-- Check what triggers exist on the sales table and fix the org_id trigger

-- First, let's see what triggers are already on the sales table
-- Drop the existing trigger and recreate it with a unique name
DROP TRIGGER IF EXISTS set_org_id_trigger ON public.sales;
DROP TRIGGER IF EXISTS set_org_id_trigger_sales ON public.sales;

-- Create the sales org_id trigger with a unique name
CREATE TRIGGER set_org_id_sales_trigger 
  BEFORE INSERT ON public.sales 
  FOR EACH ROW 
  EXECUTE FUNCTION public.set_org_id();