-- Create table for PAR levels per slot
CREATE TABLE IF NOT EXISTS public.machine_slot_pars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  machine_id UUID NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
  slot_code TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id),
  par_qty INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (machine_id, slot_code)
);

-- Enable RLS
ALTER TABLE public.machine_slot_pars ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "machine_slot_pars_all" ON public.machine_slot_pars 
FOR ALL USING (is_org_member(org_id)) 
WITH CHECK (org_id = current_org());

-- Add org_id trigger
CREATE TRIGGER set_org_id_machine_slot_pars 
BEFORE INSERT ON public.machine_slot_pars 
FOR EACH ROW EXECUTE FUNCTION public.set_org_id();

-- Add updated_at trigger
CREATE TRIGGER update_machine_slot_pars_updated_at 
BEFORE UPDATE ON public.machine_slot_pars 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create inventory transactions table
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  machine_id UUID REFERENCES public.machines(id) ON DELETE SET NULL,
  slot_id UUID,
  qty_change INTEGER NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('receive','restock','vend','shrink','transfer','parts')),
  ref_type TEXT,
  ref_id UUID,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "inventory_transactions_all" ON public.inventory_transactions 
FOR ALL USING (is_org_member(org_id)) 
WITH CHECK (org_id = current_org());

-- Add org_id trigger
CREATE TRIGGER set_org_id_inventory_transactions 
BEFORE INSERT ON public.inventory_transactions 
FOR EACH ROW EXECUTE FUNCTION public.set_org_id();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invtrx_product ON public.inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_invtrx_machine ON public.inventory_transactions(machine_id);
CREATE INDEX IF NOT EXISTS idx_invtrx_time ON public.inventory_transactions(occurred_at);
CREATE INDEX IF NOT EXISTS idx_machine_slot_pars_machine ON public.machine_slot_pars(machine_id);
CREATE INDEX IF NOT EXISTS idx_machine_slot_pars_product ON public.machine_slot_pars(product_id);