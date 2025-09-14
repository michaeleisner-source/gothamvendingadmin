-- Fix security warnings: Set proper search_path for functions

-- Update normalize_help_query function
CREATE OR REPLACE FUNCTION normalize_help_query(input_text TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(regexp_replace(input_text, '[^a-zA-Z0-9\s]', '', 'g'));
$$;

-- Update update_help_backlog_normalized function
CREATE OR REPLACE FUNCTION update_help_backlog_normalized()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.normalized_q := normalize_help_query(NEW.q);
  NEW.query_hash := md5(NEW.normalized_q);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;