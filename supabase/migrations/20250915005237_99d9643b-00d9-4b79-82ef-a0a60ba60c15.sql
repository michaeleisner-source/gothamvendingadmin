-- Add missing fields to machines table for operational tracking
ALTER TABLE public.machines 
ADD COLUMN manufacturer text,
ADD COLUMN serial_number text,
ADD COLUMN wifi_type text DEFAULT 'local' CHECK (wifi_type IN ('local', 'cellular', 'wifi_card'));

-- Add missing fields to machine_finance table for comprehensive expense tracking
ALTER TABLE public.machine_finance
ADD COLUMN monthly_software_cost numeric DEFAULT 0,
ADD COLUMN cc_processing_fee_cents integer DEFAULT 0,
ADD COLUMN cc_processing_fee_percent numeric DEFAULT 0,
ADD COLUMN other_onetime_costs numeric DEFAULT 0;

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_machines_serial_number ON public.machines (serial_number);
CREATE INDEX IF NOT EXISTS idx_machines_manufacturer ON public.machines (manufacturer);