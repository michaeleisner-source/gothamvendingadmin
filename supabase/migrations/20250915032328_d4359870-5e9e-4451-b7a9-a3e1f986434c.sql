-- Add new contract management fields to existing contracts table
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS prospect_id uuid REFERENCES public.prospects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS contract_number text UNIQUE,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft' CHECK (status IN ('draft','sent','signed','void')),
  ADD COLUMN IF NOT EXISTS version int DEFAULT 1,
  ADD COLUMN IF NOT EXISTS html text,
  ADD COLUMN IF NOT EXISTS pdf_url text;

-- Create helpful indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_contracts_prospect_id ON public.contracts(prospect_id);
CREATE INDEX IF NOT EXISTS idx_contracts_contract_number ON public.contracts(contract_number);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);