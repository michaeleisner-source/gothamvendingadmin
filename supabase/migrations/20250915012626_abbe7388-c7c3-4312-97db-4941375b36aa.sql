-- Create processor fee rules table for time-based fee structures
CREATE TABLE public.processor_fee_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  processor_id UUID NOT NULL REFERENCES public.payment_processors(id) ON DELETE CASCADE,
  percent_bps INTEGER NOT NULL DEFAULT 0, -- basis points (e.g., 290 = 2.90%)
  fixed_cents INTEGER NOT NULL DEFAULT 0, -- fixed fee per transaction in cents
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.processor_fee_rules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "processor_fee_rules_all" 
ON public.processor_fee_rules 
FOR ALL 
USING (is_org_member(org_id))
WITH CHECK (org_id = current_org());

-- Add org_id trigger
CREATE TRIGGER set_processor_fee_rules_org_id
  BEFORE INSERT ON public.processor_fee_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.set_org_id();

-- Add updated_at trigger
CREATE TRIGGER update_processor_fee_rules_updated_at
  BEFORE UPDATE ON public.processor_fee_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for efficient lookups
CREATE INDEX idx_processor_fee_rules_lookup 
ON public.processor_fee_rules (org_id, processor_id, effective_date DESC);