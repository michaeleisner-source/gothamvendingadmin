-- Create processor_settlements table for importing payment processor data
CREATE TABLE IF NOT EXISTS public.processor_settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid,
  processor text,
  occurred_on date NOT NULL,
  gross_cents integer NOT NULL,
  fee_cents integer DEFAULT 0,
  net_cents integer DEFAULT 0,
  txn_count integer,
  deposit_ref text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.processor_settlements ENABLE ROW LEVEL SECURITY;

-- Users can view/manage settlements in their org
CREATE POLICY "processor_settlements_all" ON public.processor_settlements
  FOR ALL USING (is_org_member(org_id))
  WITH CHECK (org_id = current_org());

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_processor_settlements_occurred_on ON public.processor_settlements(occurred_on);
CREATE INDEX IF NOT EXISTS idx_processor_settlements_org_id ON public.processor_settlements(org_id);

-- Add triggers for org_id and updated_at
CREATE TRIGGER set_processor_settlements_org_id
  BEFORE INSERT ON public.processor_settlements
  FOR EACH ROW EXECUTE FUNCTION public.set_org_id();

CREATE TRIGGER update_processor_settlements_updated_at
  BEFORE UPDATE ON public.processor_settlements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();