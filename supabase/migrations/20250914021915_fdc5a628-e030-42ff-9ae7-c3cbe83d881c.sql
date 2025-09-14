-- Create payment processors table
CREATE TABLE public.payment_processors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  name text NOT NULL,
  processor_type text,
  default_percent_fee numeric(6,4),
  default_fixed_fee numeric(6,4),
  monthly_fee numeric(10,2) DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_processors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "payment_processors_all" 
ON public.payment_processors 
FOR ALL 
USING (is_org_member(org_id))
WITH CHECK (org_id = current_org());

-- Create machine finance table
CREATE TABLE public.machine_finance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  machine_id uuid NOT NULL,
  acquisition_type text NOT NULL CHECK (acquisition_type IN ('purchase','lease','finance')),
  purchase_price numeric(12,2),
  supplier_id uuid,
  purchased_at date,
  -- Lease/Finance
  lender text,
  term_months int,
  apr numeric(6,4),
  monthly_payment numeric(12,2),
  first_payment_date date,
  balloon_payment numeric(12,2),
  -- Depreciation
  depreciation_method text DEFAULT 'straight_line',
  salvage_value numeric(12,2) DEFAULT 0,
  life_months int,
  -- Insurance
  insured bool DEFAULT false,
  insurance_provider text,
  insurance_policy_no text,
  insurance_monthly numeric(12,2),
  -- Connectivity/Monitoring fees
  telemetry_monthly numeric(12,2),
  data_plan_monthly numeric(12,2),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(machine_id)
);

-- Enable RLS
ALTER TABLE public.machine_finance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "machine_finance_all" 
ON public.machine_finance 
FOR ALL 
USING (is_org_member(org_id))
WITH CHECK (org_id = current_org());

-- Create machine processor mappings table
CREATE TABLE public.machine_processor_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  machine_id uuid NOT NULL,
  processor_id uuid NOT NULL,
  percent_fee numeric(6,4),
  fixed_fee numeric(6,4),
  monthly_fee numeric(10,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(machine_id)
);

-- Enable RLS
ALTER TABLE public.machine_processor_mappings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "machine_processor_mappings_all" 
ON public.machine_processor_mappings 
FOR ALL 
USING (is_org_member(org_id))
WITH CHECK (org_id = current_org());

-- Create staff table
CREATE TABLE public.staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  full_name text NOT NULL,
  phone text,
  email text,
  role text CHECK (role IN ('admin','operator','driver','tech')),
  active bool DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "staff_all" 
ON public.staff 
FOR ALL 
USING (is_org_member(org_id))
WITH CHECK (org_id = current_org());

-- Add org_id trigger to all new tables
CREATE TRIGGER set_org_id_payment_processors
  BEFORE INSERT ON public.payment_processors
  FOR EACH ROW
  EXECUTE FUNCTION public.set_org_id();

CREATE TRIGGER set_org_id_machine_finance
  BEFORE INSERT ON public.machine_finance
  FOR EACH ROW
  EXECUTE FUNCTION public.set_org_id();

CREATE TRIGGER set_org_id_machine_processor_mappings
  BEFORE INSERT ON public.machine_processor_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_org_id();

CREATE TRIGGER set_org_id_staff
  BEFORE INSERT ON public.staff
  FOR EACH ROW
  EXECUTE FUNCTION public.set_org_id();

-- Add update timestamp triggers
CREATE TRIGGER update_payment_processors_updated_at
  BEFORE UPDATE ON public.payment_processors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_machine_finance_updated_at
  BEFORE UPDATE ON public.machine_finance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_machine_processor_mappings_updated_at
  BEFORE UPDATE ON public.machine_processor_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staff_updated_at
  BEFORE UPDATE ON public.staff
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();