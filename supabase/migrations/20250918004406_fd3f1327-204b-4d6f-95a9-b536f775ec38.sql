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

-- Update existing address data
UPDATE locations SET address_line1 = address WHERE address_line1 IS NULL AND address IS NOT NULL;
UPDATE locations SET postal_code = zip_code WHERE postal_code IS NULL AND zip_code IS NOT NULL;

-- Update machines table to ensure it has proper names
UPDATE machines SET name = 'Machine ' || substr(id::text, 1, 8) WHERE name IS NULL OR name = '';