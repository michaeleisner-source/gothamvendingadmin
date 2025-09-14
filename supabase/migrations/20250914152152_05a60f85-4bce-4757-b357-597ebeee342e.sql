-- Move extensions from public schema to extensions schema for better security

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Drop extensions from public schema and recreate in extensions schema
DROP EXTENSION IF EXISTS pg_trgm;
DROP EXTENSION IF EXISTS unaccent;

-- Recreate extensions in the extensions schema
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;

-- Grant usage on extensions schema to public
GRANT USAGE ON SCHEMA extensions TO public;

-- Update search path to include extensions schema
ALTER DATABASE postgres SET search_path TO public, extensions;