-- Fix search paths for all custom functions to address security warning
ALTER FUNCTION public.current_org_id() SET search_path = public, extensions;
ALTER FUNCTION public.is_org_admin() SET search_path = public, extensions;
ALTER FUNCTION public.enforce_org_id() SET search_path = public, extensions;

-- Update existing functions with secure search paths
ALTER FUNCTION public.get_current_org_safe() SET search_path = public, extensions;
ALTER FUNCTION public.is_org_member_safe(uuid) SET search_path = public, extensions;
ALTER FUNCTION public.current_org() SET search_path = public, extensions;
ALTER FUNCTION public.is_org_member(uuid) SET search_path = public, extensions;
ALTER FUNCTION public.check_org_member(uuid) SET search_path = public, extensions;
ALTER FUNCTION public.check_org_owner(uuid) SET search_path = public, extensions;