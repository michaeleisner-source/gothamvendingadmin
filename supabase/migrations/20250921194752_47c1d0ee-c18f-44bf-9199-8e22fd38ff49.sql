-- Fixed helper functions for existing schema structure
CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT org_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND m.org_id = public.current_org_id()
      AND m.role IN ('owner','admin')
  );
$$;

-- Create org_id enforcement trigger function
CREATE OR REPLACE FUNCTION public.enforce_org_id()
RETURNS trigger LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    NEW.org_id := public.current_org_id();
  ELSIF NEW.org_id <> public.current_org_id() THEN
    RAISE EXCEPTION 'org_id mismatch with session org';
  END IF;
  RETURN NEW;
END$$;