-- Fix the contracts table to properly link with locations
-- First, let's see if we need to add the foreign key constraint

-- Add foreign key constraint for contracts -> locations relationship
ALTER TABLE contracts
ADD CONSTRAINT fk_contracts_location_id 
FOREIGN KEY (location_id) REFERENCES locations(id);

-- Add foreign key constraint for contracts -> machines relationship (if needed)
ALTER TABLE contracts
ADD CONSTRAINT fk_contracts_machine_id 
FOREIGN KEY (machine_id) REFERENCES machines(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_contracts_location_id ON contracts(location_id);
CREATE INDEX IF NOT EXISTS idx_contracts_machine_id ON contracts(machine_id);