-- Enable Row Level Security on sales table
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Drop any existing overly permissive policies
DROP POLICY IF EXISTS "Allow all operations on sales" ON public.sales;
DROP POLICY IF EXISTS "Public can read sales" ON public.sales;

-- Create organization-based RLS policies for sales table
-- SELECT: Users can view sales from their organization
CREATE POLICY "sales_select"
ON public.sales
FOR SELECT
USING (is_org_member(org_id));

-- INSERT: Users can insert sales for their organization
CREATE POLICY "sales_insert"
ON public.sales
FOR INSERT
WITH CHECK (org_id = current_org());

-- UPDATE: Users can update sales in their organization
CREATE POLICY "sales_update"
ON public.sales
FOR UPDATE
USING (is_org_member(org_id))
WITH CHECK (org_id = current_org());

-- DELETE: Users can delete sales from their organization
CREATE POLICY "sales_delete"
ON public.sales
FOR DELETE
USING (is_org_member(org_id));