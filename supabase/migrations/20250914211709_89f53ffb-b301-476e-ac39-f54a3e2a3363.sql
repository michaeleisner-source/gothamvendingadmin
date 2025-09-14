-- Add missing fields to prospects table for the enhanced pipeline feature
ALTER TABLE prospects 
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS company text,
ADD COLUMN IF NOT EXISTS source text,
ADD COLUMN IF NOT EXISTS stage text,
ADD COLUMN IF NOT EXISTS owner_id uuid,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS next_follow_up_at timestamptz,
ADD COLUMN IF NOT EXISTS converted_location_id uuid;

-- Create prospect_activities table for timeline and notes
CREATE TABLE IF NOT EXISTS prospect_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  body text,
  type text DEFAULT 'note',
  org_id uuid REFERENCES organizations(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on prospect_activities
ALTER TABLE prospect_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for prospect_activities
CREATE POLICY "Users can view their org prospect activities" ON prospect_activities
  FOR SELECT USING (is_org_member(org_id));

CREATE POLICY "Users can create prospect activities in their org" ON prospect_activities
  FOR INSERT WITH CHECK (org_id = current_org());

CREATE POLICY "Users can update their org prospect activities" ON prospect_activities
  FOR UPDATE USING (is_org_member(org_id));

-- Add trigger to set org_id for prospect_activities
CREATE OR REPLACE TRIGGER set_prospect_activities_org_id
  BEFORE INSERT ON prospect_activities
  FOR EACH ROW EXECUTE FUNCTION set_org_id();

-- Add updated_at trigger for prospects
CREATE OR REPLACE TRIGGER update_prospects_updated_at
  BEFORE UPDATE ON prospects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();