-- Update the unaccent function with proper search_path security
CREATE OR REPLACE FUNCTION public.unaccent(text) 
RETURNS text 
LANGUAGE sql IMMUTABLE STRICT
SECURITY DEFINER
SET search_path = extensions, public
AS $function$
  SELECT unaccent($1);
$function$;