-- Add missing RLS policies for contracts table
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contracts_all" ON public.contracts
FOR ALL USING (is_org_member(org_id))
WITH CHECK (org_id = current_org());

-- Add missing org_id column to new fields if they were added
-- (The locations table should have org_id already, so these new fields should use org-based security)