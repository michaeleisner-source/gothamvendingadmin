-- Create leads table based on the provided schema
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  location_type TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  estimated_foot_traffic INTEGER NOT NULL,
  contact_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'interested', 'negotiating', 'closed', 'rejected')),
  notes TEXT,
  follow_up_date TIMESTAMP WITH TIME ZONE,
  revenue_split NUMERIC,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  org_id UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create policies for leads
CREATE POLICY "Leads are viewable by org members" 
ON public.leads 
FOR SELECT 
USING (is_org_member(org_id));

CREATE POLICY "Leads are insertable by org members" 
ON public.leads 
FOR INSERT 
WITH CHECK (org_id = current_org());

CREATE POLICY "Leads are updatable by org members" 
ON public.leads 
FOR UPDATE 
USING (is_org_member(org_id));

CREATE POLICY "Leads are deletable by org members" 
ON public.leads 
FOR DELETE 
USING (is_org_member(org_id));

-- Add trigger for automatic org_id and updated_at
CREATE TRIGGER set_leads_org_id
BEFORE INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.set_org_id();

CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create search index
CREATE INDEX idx_leads_search ON public.leads USING gin(to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(email,'') || ' ' || coalesce(company,'')));