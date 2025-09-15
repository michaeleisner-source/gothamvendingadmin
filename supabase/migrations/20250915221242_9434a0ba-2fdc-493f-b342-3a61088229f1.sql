-- Add missing columns to existing tables
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS payment_method text CHECK (payment_method IN ('card','cash')) DEFAULT 'card';

-- Add missing columns to tickets table
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS status text DEFAULT 'open';
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS priority text CHECK (priority IN ('low','normal','high','urgent')) DEFAULT 'normal';
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS acknowledged_at timestamptz;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS first_response_at timestamptz;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS closed_at timestamptz;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS due_at timestamptz;

-- Create ticket_sla_policies table
CREATE TABLE IF NOT EXISTS public.ticket_sla_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  priority text NOT NULL CHECK (priority IN ('low','normal','high','urgent')),
  minutes_to_ack integer NOT NULL CHECK (minutes_to_ack >= 0),
  minutes_to_resolve integer NOT NULL CHECK (minutes_to_resolve >= 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (priority, active)
);

-- Enable RLS for ticket_sla_policies
ALTER TABLE public.ticket_sla_policies ENABLE ROW LEVEL SECURITY;

-- Create policies for ticket_sla_policies (drop first if they exist)
DROP POLICY IF EXISTS "ticket_sla_policies_read" ON public.ticket_sla_policies;
DROP POLICY IF EXISTS "ticket_sla_policies_manage" ON public.ticket_sla_policies;

CREATE POLICY "ticket_sla_policies_read" ON public.ticket_sla_policies FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "ticket_sla_policies_manage" ON public.ticket_sla_policies FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (true);

-- Insert default SLA policies if none exist
INSERT INTO public.ticket_sla_policies (priority, minutes_to_ack, minutes_to_resolve, active)
SELECT * FROM (VALUES
  ('low',    480, 2880, true),
  ('normal', 240, 1440, true),
  ('high',   120,  720, true),
  ('urgent',  30,  240, true)
) AS v(priority, minutes_to_ack, minutes_to_resolve, active)
WHERE NOT EXISTS (SELECT 1 FROM public.ticket_sla_policies);