-- Let's check and fix any remaining search_path issues in functions
-- Update functions that might not have explicit search_path settings

-- First, let's ensure our unaccent function has proper search_path
CREATE OR REPLACE FUNCTION public.unaccent(text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE STRICT SECURITY DEFINER
 SET search_path = 'extensions', 'public'
AS $function$
  SELECT unaccent($1);
$function$;

-- Update any functions that might need explicit search_path settings
-- Check the bootstrap function
CREATE OR REPLACE FUNCTION public.bootstrap_org_for_me(p_org_name text DEFAULT 'Gotham Vending'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
declare
  v_org uuid;
  v_uid uuid := auth.uid();
begin
  -- If profile already exists, return its org
  select org_id into v_org from profiles where id = v_uid;
  if v_org is not null then
    return v_org;
  end if;

  -- Create org
  insert into organizations (name) values (p_org_name) returning id into v_org;

  -- Create profile + membership
  insert into profiles (id, org_id, full_name) values (v_uid, v_org, null);
  insert into memberships (org_id, user_id, role) values (v_org, v_uid, 'owner');

  return v_org;
end;
$function$;