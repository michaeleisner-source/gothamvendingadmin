-- Create support tickets table if not exists
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  org_id uuid NOT NULL,
  email text,
  subject text NOT NULL,
  body text,
  status text DEFAULT 'open',
  priority text DEFAULT 'medium',
  assigned_to uuid,
  resolved_at timestamptz
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Allow org members to see their org's tickets
CREATE POLICY "support_tickets_org_read"
ON public.support_tickets FOR SELECT
TO authenticated
USING (is_org_member(org_id));

-- Allow org members to create tickets for their org
CREATE POLICY "support_tickets_org_create"
ON public.support_tickets FOR INSERT
TO authenticated
WITH CHECK (org_id = current_org());

-- Allow org members to update their org's tickets
CREATE POLICY "support_tickets_org_update"
ON public.support_tickets FOR UPDATE
TO authenticated
USING (is_org_member(org_id));

-- Allow anyone (including anonymous) to create tickets with any org_id for support purposes
CREATE POLICY "support_tickets_anon_create"
ON public.support_tickets FOR INSERT
TO anon
WITH CHECK (true);

-- Add updated_at trigger
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();