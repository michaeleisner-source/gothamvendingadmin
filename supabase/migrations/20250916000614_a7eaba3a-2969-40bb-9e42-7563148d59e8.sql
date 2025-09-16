-- Lock products to the user's organization using existing org_id system
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dev_open ON public.products;

-- Create proper RLS policies for products using org_id
CREATE POLICY p_products_select ON public.products
FOR SELECT USING (is_org_member(org_id));

CREATE POLICY p_products_write ON public.products  
FOR ALL
USING (is_org_member(org_id))
WITH CHECK (org_id = current_org());

-- Apply the same pattern to locations and machines
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dev_open ON public.locations;

CREATE POLICY p_locations_select ON public.locations
FOR SELECT USING (is_org_member(org_id));

CREATE POLICY p_locations_write ON public.locations
FOR ALL  
USING (is_org_member(org_id))
WITH CHECK (org_id = current_org());

ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dev_open ON public.machines;

CREATE POLICY p_machines_select ON public.machines
FOR SELECT USING (is_org_member(org_id));

CREATE POLICY p_machines_write ON public.machines
FOR ALL
USING (is_org_member(org_id)) 
WITH CHECK (org_id = current_org());