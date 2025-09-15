-- Fix function search path security issues
-- Update functions that don't have proper search_path set

-- Fix the unaccent function
DROP FUNCTION IF EXISTS public.unaccent(text);
CREATE OR REPLACE FUNCTION public.unaccent(text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE STRICT SECURITY DEFINER
 SET search_path TO 'extensions', 'public'
AS $function$
  SELECT unaccent($1);
$function$;

-- Fix normalize_help_query function  
DROP FUNCTION IF EXISTS public.normalize_help_query(text);
CREATE OR REPLACE FUNCTION public.normalize_help_query(input_text text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE STRICT SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT lower(regexp_replace(input_text, '[^a-zA-Z0-9\s]', '', 'g'));
$function$;