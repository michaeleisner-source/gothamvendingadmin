-- Insurance Management Tables

-- Master policies
CREATE TABLE IF NOT EXISTS public.insurance_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  name text NOT NULL,                                -- e.g., "General Liability 2025"
  carrier text,                                      -- e.g., "The Hartford"
  policy_number text,
  coverage_start date NOT NULL,
  coverage_end date NOT NULL,
  monthly_premium_cents integer NOT NULL CHECK (monthly_premium_cents >= 0),
  document_url text,                                 -- link to full policy PDF
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.insurance_policies ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "insurance_policies_all" ON public.insurance_policies
  FOR ALL USING (is_org_member(org_id))
  WITH CHECK (org_id = current_org());

-- Allocations: who bears how much of a policy
-- Priority (at runtime): machine > location > global
CREATE TABLE IF NOT EXISTS public.insurance_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  policy_id uuid NOT NULL REFERENCES public.insurance_policies(id) ON DELETE CASCADE,
  level text NOT NULL CHECK (level IN ('global','location','machine')),
  location_id uuid REFERENCES public.locations(id) ON DELETE CASCADE,
  machine_id uuid REFERENCES public.machines(id) ON DELETE CASCADE,
  -- choose one method per row:
  allocated_pct_bps integer CHECK (allocated_pct_bps BETWEEN 0 AND 10000),
  flat_monthly_cents integer CHECK (flat_monthly_cents >= 0),
  effective_start date,
  effective_end date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT insurance_alloc_one_method CHECK (
    (allocated_pct_bps IS NOT NULL AND flat_monthly_cents IS NULL)
    OR (allocated_pct_bps IS NULL AND flat_monthly_cents IS NOT NULL)
  ),
  CONSTRAINT insurance_alloc_level_refs CHECK (
    (level = 'global' AND location_id IS NULL AND machine_id IS NULL)
    OR (level = 'location' AND location_id IS NOT NULL AND machine_id IS NULL)
    OR (level = 'machine' AND machine_id IS NOT NULL AND location_id IS NULL)
  )
);

-- Enable RLS
ALTER TABLE public.insurance_allocations ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "insurance_allocations_all" ON public.insurance_allocations
  FOR ALL USING (is_org_member(org_id))
  WITH CHECK (org_id = current_org());

-- COIs (certificates) for locations that demand proof
CREATE TABLE IF NOT EXISTS public.insurance_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  policy_id uuid NOT NULL REFERENCES public.insurance_policies(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  certificate_url text NOT NULL,                 -- PDF/JPG
  issued_at date NOT NULL DEFAULT CURRENT_DATE,
  expires_at date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.insurance_certificates ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "insurance_certificates_all" ON public.insurance_certificates
  FOR ALL USING (is_org_member(org_id))
  WITH CHECK (org_id = current_org());

-- Auto-set org_id triggers
CREATE TRIGGER set_org_id_insurance_policies 
  BEFORE INSERT ON public.insurance_policies
  FOR EACH ROW EXECUTE FUNCTION public.set_org_id();

CREATE TRIGGER set_org_id_insurance_allocations 
  BEFORE INSERT ON public.insurance_allocations
  FOR EACH ROW EXECUTE FUNCTION public.set_org_id();

CREATE TRIGGER set_org_id_insurance_certificates 
  BEFORE INSERT ON public.insurance_certificates
  FOR EACH ROW EXECUTE FUNCTION public.set_org_id();

-- Update timestamp triggers
CREATE TRIGGER update_insurance_policies_updated_at
  BEFORE UPDATE ON public.insurance_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_insurance_allocations_updated_at
  BEFORE UPDATE ON public.insurance_allocations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_insurance_certificates_updated_at
  BEFORE UPDATE ON public.insurance_certificates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_ins_policies_org ON public.insurance_policies(org_id);
CREATE INDEX IF NOT EXISTS idx_ins_alloc_policy ON public.insurance_allocations(policy_id);
CREATE INDEX IF NOT EXISTS idx_ins_alloc_level_loc ON public.insurance_allocations(level, location_id);
CREATE INDEX IF NOT EXISTS idx_ins_alloc_level_mach ON public.insurance_allocations(level, machine_id);
CREATE INDEX IF NOT EXISTS idx_ins_certs_policy ON public.insurance_certificates(policy_id);
CREATE INDEX IF NOT EXISTS idx_ins_certs_location ON public.insurance_certificates(location_id);