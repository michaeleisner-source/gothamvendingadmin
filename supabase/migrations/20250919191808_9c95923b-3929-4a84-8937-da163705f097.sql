-- Create site_surveys table
CREATE TABLE public.site_surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL,
  org_id UUID,
  visit_date DATE,
  power_outlets_count INTEGER,
  network_type TEXT,
  entrance_width_cm INTEGER,
  elevator_access BOOLEAN DEFAULT false,
  parking BOOLEAN DEFAULT false,
  recommended_machine_type TEXT DEFAULT 'Combo',
  recommended_machine_count INTEGER DEFAULT 1,
  constraints TEXT,
  earliest_install_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_surveys ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "site_surveys_all" 
ON public.site_surveys 
FOR ALL 
USING (is_org_member(org_id))
WITH CHECK (org_id = current_org());

-- Create planograms table
CREATE TABLE public.planograms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID NOT NULL,
  org_id UUID,
  name TEXT NOT NULL,
  rows INTEGER NOT NULL DEFAULT 6,
  cols INTEGER NOT NULL DEFAULT 6,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.planograms ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "planograms_all" 
ON public.planograms 
FOR ALL 
USING (is_org_member(org_id))
WITH CHECK (org_id = current_org());

-- Create planogram_items table
CREATE TABLE public.planogram_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  planogram_id UUID NOT NULL,
  row_idx INTEGER NOT NULL,
  col_idx INTEGER NOT NULL,
  product_id UUID,
  product_name TEXT,
  facings INTEGER DEFAULT 1,
  capacity INTEGER DEFAULT 10,
  par_level INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.planogram_items ENABLE ROW LEVEL SECURITY;

-- Create policies (access through planogram)
CREATE POLICY "planogram_items_all" 
ON public.planogram_items 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM planograms p 
    WHERE p.id = planogram_items.planogram_id 
    AND is_org_member(p.org_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM planograms p 
    WHERE p.id = planogram_items.planogram_id 
    AND is_org_member(p.org_id)
  )
);

-- Create machines table
CREATE TABLE public.machines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID,
  location_id UUID,
  name TEXT NOT NULL,
  serial_number TEXT,
  machine_model TEXT,
  status TEXT DEFAULT 'inactive',
  install_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "machines_all" 
ON public.machines 
FOR ALL 
USING (is_org_member(org_id))
WITH CHECK (org_id = current_org());

-- Create restock_tasks table
CREATE TABLE public.restock_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  machine_id UUID NOT NULL,
  org_id UUID,
  next_visit DATE NOT NULL,
  cadence_days INTEGER DEFAULT 7,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.restock_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "restock_tasks_all" 
ON public.restock_tasks 
FOR ALL 
USING (is_org_member(org_id))
WITH CHECK (org_id = current_org());

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  return NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_site_surveys_updated_at
  BEFORE UPDATE ON public.site_surveys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_planograms_updated_at
  BEFORE UPDATE ON public.planograms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_machines_updated_at
  BEFORE UPDATE ON public.machines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_restock_tasks_updated_at
  BEFORE UPDATE ON public.restock_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();