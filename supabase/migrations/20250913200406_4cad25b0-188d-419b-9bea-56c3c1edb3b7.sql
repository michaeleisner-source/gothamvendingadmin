-- Rename locations table to prospects
ALTER TABLE locations RENAME TO prospects;

-- Rename name column to business_name
ALTER TABLE prospects RENAME COLUMN name TO business_name;

-- Add table comment
COMMENT ON TABLE prospects IS 'Sales prospects (leads) before they become active vending locations';