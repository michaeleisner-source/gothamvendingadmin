-- Add missing columns to machines table
ALTER TABLE machines ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE machines ADD COLUMN IF NOT EXISTS org_id uuid;

-- Add missing columns to locations table  
ALTER TABLE locations ADD COLUMN IF NOT EXISTS org_id uuid;

-- Create sales table if it doesn't exist with correct columns
CREATE TABLE IF NOT EXISTS sales (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL,
  machine_id uuid NOT NULL,
  product_id uuid NOT NULL,
  qty integer NOT NULL DEFAULT 1,
  unit_price_cents integer NOT NULL,
  unit_cost_cents integer,
  occurred_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on sales table
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for sales
CREATE POLICY "sales_all" ON sales FOR ALL USING (true) WITH CHECK (true);

-- Add missing columns to sales if they exist but are named differently
DO $$
BEGIN
  -- Check if sales table exists with different column names and add missing ones
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales') THEN
    -- Add qty column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'qty') THEN
      ALTER TABLE sales ADD COLUMN qty integer DEFAULT 1;
    END IF;
    
    -- Add occurred_at column if it doesn't exist  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'occurred_at') THEN
      ALTER TABLE sales ADD COLUMN occurred_at timestamp with time zone DEFAULT now();
    END IF;
    
    -- Add unit_price_cents if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'unit_price_cents') THEN
      ALTER TABLE sales ADD COLUMN unit_price_cents integer DEFAULT 0;
    END IF;
    
    -- Add org_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'org_id') THEN
      ALTER TABLE sales ADD COLUMN org_id uuid;
    END IF;

    -- Add product_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'product_id') THEN
      ALTER TABLE sales ADD COLUMN product_id uuid;
    END IF;
  END IF;
END $$;

-- Update machines to have default names if null
UPDATE machines SET name = 'Machine ' || id::text WHERE name IS NULL;
UPDATE machines SET org_id = (SELECT id FROM organizations LIMIT 1) WHERE org_id IS NULL;

-- Update locations to have org_id if null  
UPDATE locations SET org_id = (SELECT id FROM organizations LIMIT 1) WHERE org_id IS NULL;

-- Update sales to have org_id if null
UPDATE sales SET org_id = (SELECT id FROM organizations LIMIT 1) WHERE org_id IS NULL AND org_id IS NULL;

-- Add foreign key constraints
ALTER TABLE machines ADD CONSTRAINT machines_org_id_fkey 
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
  
ALTER TABLE locations ADD CONSTRAINT locations_org_id_fkey 
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;