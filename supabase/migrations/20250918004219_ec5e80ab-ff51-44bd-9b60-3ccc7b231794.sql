-- Add missing columns to locations table for commission tracking
ALTER TABLE locations ADD COLUMN IF NOT EXISTS commission_model text DEFAULT 'none';
ALTER TABLE locations ADD COLUMN IF NOT EXISTS commission_pct_bps integer DEFAULT 0;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS commission_flat_cents integer DEFAULT 0;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS commission_min_cents integer DEFAULT 0;

-- Add missing columns to locations table for address normalization
ALTER TABLE locations ADD COLUMN IF NOT EXISTS location_type_id uuid;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS address_line1 text;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS address_line2 text;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS postal_code text;

-- Update existing address data to address_line1 if needed
UPDATE locations SET address_line1 = address WHERE address_line1 IS NULL AND address IS NOT NULL;
UPDATE locations SET postal_code = zip_code WHERE postal_code IS NULL AND zip_code IS NOT NULL;

-- Ensure products table has required columns  
CREATE TABLE IF NOT EXISTS products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL,
  name text NOT NULL,
  sku text,
  category text,
  cost_cents integer DEFAULT 0,
  price_cents integer DEFAULT 0,
  manufacturer text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  search_tsv tsvector
);

-- Enable RLS on products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "products_all" ON products FOR ALL USING (true) WITH CHECK (true);

-- Add unit_cost_cents to sales if missing (check first to avoid conflicts)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'unit_cost_cents') THEN
    ALTER TABLE sales ADD COLUMN unit_cost_cents integer;
  END IF;
END $$;

-- Update machines table to ensure it has proper columns
UPDATE machines SET name = 'Machine ' || substr(id::text, 1, 8) WHERE name IS NULL OR name = '';

-- Create proper foreign key relationships
ALTER TABLE inventory_levels ADD CONSTRAINT IF NOT EXISTS inventory_levels_machine_id_fkey 
  FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE;

-- Add search_tsv columns and triggers for full text search
ALTER TABLE machines ADD COLUMN IF NOT EXISTS search_tsv tsvector;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS search_tsv tsvector;

-- Create triggers for updating search_tsv
CREATE OR REPLACE FUNCTION update_machines_search_tsv()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_tsv := to_tsvector('simple', 
    COALESCE(NEW.name, '') || ' ' || 
    COALESCE(NEW.status, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_locations_search_tsv()  
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_tsv := to_tsvector('simple',
    COALESCE(NEW.name, '') || ' ' ||
    COALESCE(NEW.address_line1, '') || ' ' ||
    COALESCE(NEW.city, '') || ' ' ||
    COALESCE(NEW.state, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS machines_search_tsv_trigger ON machines;
DROP TRIGGER IF EXISTS locations_search_tsv_trigger ON locations;

-- Create new triggers
CREATE TRIGGER machines_search_tsv_trigger
  BEFORE INSERT OR UPDATE ON machines
  FOR EACH ROW EXECUTE FUNCTION update_machines_search_tsv();

CREATE TRIGGER locations_search_tsv_trigger
  BEFORE INSERT OR UPDATE ON locations  
  FOR EACH ROW EXECUTE FUNCTION update_locations_search_tsv();

-- Update existing records
UPDATE machines SET search_tsv = to_tsvector('simple', COALESCE(name, '') || ' ' || COALESCE(status, ''));
UPDATE locations SET search_tsv = to_tsvector('simple', COALESCE(name, '') || ' ' || COALESCE(address_line1, '') || ' ' || COALESCE(city, '') || ' ' || COALESCE(state, ''));