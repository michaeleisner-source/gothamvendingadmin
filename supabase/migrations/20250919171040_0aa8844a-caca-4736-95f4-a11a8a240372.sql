-- Add missing RLS policies for the products table
CREATE POLICY "products_all" ON public.products
  FOR ALL
  USING (is_org_member(org_id))
  WITH CHECK (org_id = current_org());

-- Also add the API Management section to machines routing
-- This will be handled in the code changes after the migration