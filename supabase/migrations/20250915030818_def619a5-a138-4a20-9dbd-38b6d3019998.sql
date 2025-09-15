-- Add contract-related fields to locations table
ALTER TABLE locations ADD COLUMN IF NOT EXISTS commission_model text DEFAULT 'percent';
ALTER TABLE locations ADD COLUMN IF NOT EXISTS revenue_share_pct numeric;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS commission_flat_cents integer;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS contract_url text;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS contract_version text;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS contract_signed_at timestamp with time zone;

-- Create contracts table
CREATE TABLE IF NOT EXISTS public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  location_id uuid NOT NULL,
  machine_id uuid,
  title text NOT NULL DEFAULT 'Vending Services Agreement',
  body_html text NOT NULL,
  revenue_share_pct numeric,
  commission_flat_cents integer,
  term_months integer DEFAULT 12,
  auto_renew boolean DEFAULT true,
  cancellation_notice_days integer DEFAULT 30,
  signed_name text,
  signed_email text,
  signed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT fk_contracts_location FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  CONSTRAINT fk_contracts_machine FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE SET NULL
);

-- Enable RLS on contracts table
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for contracts table
CREATE POLICY "contracts_all" ON public.contracts
  FOR ALL
  USING (is_org_member(org_id))
  WITH CHECK (org_id = current_org());

-- Set org_id automatically on contracts insert
CREATE OR REPLACE TRIGGER set_contracts_org_id
  BEFORE INSERT ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_org_id();

-- Add updated_at trigger for contracts
CREATE OR REPLACE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster contract lookups
CREATE INDEX IF NOT EXISTS idx_contracts_location_id ON contracts(location_id);
CREATE INDEX IF NOT EXISTS idx_contracts_machine_id ON contracts(machine_id) WHERE machine_id IS NOT NULL;