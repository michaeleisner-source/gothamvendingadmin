-- 01_helpers.sql - Security baseline with RLS, JWT helpers, policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user;
  END IF;
END$$;

-- Create helper functions for org security
CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT COALESCE(
    NULLIF((auth.jwt() ->> 'org_id')::uuid, NULL),
    (
      SELECT om.org_id
      FROM public.memberships om
      WHERE om.user_id = auth.uid()
      ORDER BY om.created_at DESC
      LIMIT 1
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships om
    WHERE om.user_id = auth.uid()
      AND om.org_id = public.current_org_id()
      AND om.role IN ('owner','admin')
  );
$$;