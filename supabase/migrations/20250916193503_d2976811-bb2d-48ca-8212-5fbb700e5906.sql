-- Fix Security Definer issue by breaking circular dependency in profiles RLS
-- The issue: profiles RLS uses current_org(), but current_org() reads from profiles

-- First, add a policy that allows users to read their own profile without current_org()
CREATE POLICY "Users can read their own profile" 
ON public.profiles 
FOR SELECT 
USING (id = auth.uid());

-- Update the existing policy to be more specific about cross-org access
DROP POLICY IF EXISTS "Users can view profiles in their org" ON public.profiles;

CREATE POLICY "Users can view other profiles in their org" 
ON public.profiles 
FOR SELECT 
USING (
  id != auth.uid() 
  AND org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid() LIMIT 1)
);

-- Now we can update the get_current_org_safe function to not use SECURITY DEFINER
-- since users can now read their own profile directly
CREATE OR REPLACE FUNCTION public.get_current_org_safe()
 RETURNS uuid
 LANGUAGE sql
 STABLE 
 SET search_path TO 'public'
AS $function$
  SELECT org_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$function$;

-- Update current_org to not use SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.current_org()
 RETURNS uuid
 LANGUAGE sql
 STABLE 
 SET search_path TO 'public'
AS $function$
  SELECT public.get_current_org_safe();
$function$;

-- Update is_org_member_safe to not use SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_org_member_safe(target_org_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE 
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS(
    SELECT 1 FROM public.memberships m
    WHERE m.org_id = target_org_id AND m.user_id = auth.uid()
  );
$function$;

-- Update is_org_member to not use SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_org_member(row_org uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE 
 SET search_path TO 'public'
AS $function$
  SELECT public.is_org_member_safe(row_org);
$function$;