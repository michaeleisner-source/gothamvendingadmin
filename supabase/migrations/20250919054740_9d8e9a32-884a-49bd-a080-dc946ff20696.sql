-- Create storage bucket for contract documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('contracts', 'contracts', false)
ON CONFLICT (id) DO NOTHING;

-- Add file upload columns to contracts table
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS contract_file_url TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS contract_file_name TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS contract_file_size INTEGER;