-- Drop the existing processor_settlements table that has a different purpose
DROP TABLE IF EXISTS public.processor_settlements CASCADE;

-- Create the processor settlements table (what the processor says happened)
CREATE TABLE public.processor_settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  processor_id uuid NOT NULL REFERENCES public.payment_processors(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  gross_cents integer NOT NULL DEFAULT 0,  -- gross sales per statement
  fees_cents integer NOT NULL DEFAULT 0,   -- fees per statement
  net_cents integer NOT NULL DEFAULT 0,    -- payouts = gross - fees (some processors include adj; enter as shown)
  payout_date date,                        -- optional: when funds actually hit
  reference text,                          -- statement id, URL, note
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT processor_settlements_valid CHECK (period_end >= period_start)
);

-- Add RLS policies for processor settlements
ALTER TABLE public.processor_settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "processor_settlements_all" ON public.processor_settlements
  FOR ALL USING (is_org_member(org_id))
  WITH CHECK (org_id = current_org());

-- Add org_id trigger
CREATE TRIGGER set_org_id_processor_settlements
  BEFORE INSERT ON public.processor_settlements
  FOR EACH ROW
  EXECUTE FUNCTION public.set_org_id();

-- Add updated_at trigger
CREATE TRIGGER update_processor_settlements_updated_at
  BEFORE UPDATE ON public.processor_settlements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes
CREATE INDEX idx_proc_settle_org ON public.processor_settlements(org_id);
CREATE INDEX idx_proc_settle_proc ON public.processor_settlements(processor_id);
CREATE INDEX idx_proc_settle_period ON public.processor_settlements(period_start, period_end);