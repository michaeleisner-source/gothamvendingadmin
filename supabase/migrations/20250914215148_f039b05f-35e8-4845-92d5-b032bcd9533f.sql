-- Create commission settings table for location-specific commission configuration
CREATE TABLE IF NOT EXISTS public.commission_settings (
  location_id uuid PRIMARY KEY REFERENCES public.locations(id) ON DELETE CASCADE,
  commission_type text CHECK (commission_type IN ('percent','flat','tiered_percent')) DEFAULT 'percent',
  commission_rate numeric,                         -- percent (e.g., 12 => 12%)
  commission_flat_cents integer,
  commission_tiers_json jsonb,
  commission_base text CHECK (commission_base IN ('gross','gross_less_fees','net')) DEFAULT 'gross_less_fees',
  commission_min_guarantee_cents integer DEFAULT 0,
  effective_from text,                             -- 'YYYY-MM'
  effective_to text,
  org_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create commission statements table for storing calculated commissions
CREATE TABLE IF NOT EXISTS public.commission_statements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month text NOT NULL,                             -- 'YYYY-MM'
  location_id uuid REFERENCES public.locations(id) ON DELETE CASCADE,
  base text,
  base_amount_cents integer,
  method text,                                     -- percent / flat / tiered_percent
  rate_pct numeric,
  flat_cents integer,
  tiers_json jsonb,
  min_guarantee_cents integer,
  commission_cents integer,
  gross_cents integer,
  fees_cents integer,
  cost_cents integer,
  net_cents integer,
  status text DEFAULT 'draft',                     -- draft | approved | paid
  org_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add RLS policies for commission_settings
ALTER TABLE public.commission_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "commission_settings_all" ON public.commission_settings
  FOR ALL USING (is_org_member(org_id))
  WITH CHECK (org_id = current_org());

-- Add RLS policies for commission_statements  
ALTER TABLE public.commission_statements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "commission_statements_all" ON public.commission_statements
  FOR ALL USING (is_org_member(org_id))
  WITH CHECK (org_id = current_org());

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_commission_settings_location ON public.commission_settings(location_id);
CREATE INDEX IF NOT EXISTS idx_commission_statements_month ON public.commission_statements(month);
CREATE INDEX IF NOT EXISTS idx_commission_statements_location ON public.commission_statements(location_id);
CREATE INDEX IF NOT EXISTS idx_commission_statements_org ON public.commission_statements(org_id);

-- Add triggers for org_id and updated_at
CREATE TRIGGER set_commission_settings_org_id
  BEFORE INSERT ON public.commission_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_org_id();

CREATE TRIGGER update_commission_settings_updated_at
  BEFORE UPDATE ON public.commission_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_commission_statements_org_id
  BEFORE INSERT ON public.commission_statements
  FOR EACH ROW EXECUTE FUNCTION public.set_org_id();

CREATE TRIGGER update_commission_statements_updated_at
  BEFORE UPDATE ON public.commission_statements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();