-- Enable the unaccent & trigram extensions in the extensions schema
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- Create a wrapper function for unaccent that references the extensions schema
-- This ensures the function can be found without modifying the database search_path
CREATE OR REPLACE FUNCTION public.unaccent(text) 
RETURNS text 
LANGUAGE sql IMMUTABLE STRICT
AS $function$
  SELECT extensions.unaccent($1);
$function$;