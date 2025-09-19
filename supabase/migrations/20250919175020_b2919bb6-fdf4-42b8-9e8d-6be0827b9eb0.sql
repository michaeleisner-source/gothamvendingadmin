-- Create missing tables for New Location Workflow

-- Site surveys table
CREATE TABLE IF NOT EXISTS site_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  visit_date DATE,
  power_outlets_count INTEGER,
  network_type TEXT, -- Cellular | WiFi | None
  entrance_width_cm NUMERIC,
  elevator_access BOOLEAN,
  parking BOOLEAN,
  recommended_machine_type TEXT, -- Snack | Beverage | Combo
  recommended_machine_count INTEGER,
  constraints TEXT,
  earliest_install_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  org_id UUID
);

-- Machine orders table
CREATE TABLE IF NOT EXISTS machine_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  vendor TEXT,
  model TEXT,
  quantity INTEGER,
  order_date DATE,
  expected_delivery_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  org_id UUID
);

-- Machine assignments table
CREATE TABLE IF NOT EXISTS machine_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id UUID REFERENCES machines(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  installed_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  initial_fill_qty INTEGER,
  cash_float NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  org_id UUID
);

-- Planograms table
CREATE TABLE IF NOT EXISTS planograms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,
  name TEXT,
  rows INTEGER,
  cols INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  org_id UUID
);

-- Planogram items table
CREATE TABLE IF NOT EXISTS planogram_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planogram_id UUID REFERENCES planograms(id) ON DELETE CASCADE,
  row_idx INTEGER,
  col_idx INTEGER,
  product_id UUID,
  product_name TEXT,
  facings INTEGER DEFAULT 1,
  capacity INTEGER DEFAULT 10,
  par_level INTEGER DEFAULT 5,
  org_id UUID
);

-- Deliveries table
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_order_id UUID REFERENCES machine_orders(id) ON DELETE SET NULL,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  window_start TIMESTAMPTZ,
  window_end TIMESTAMPTZ,
  assigned_route_date DATE,
  driver_id UUID,
  status TEXT DEFAULT 'scheduled', -- scheduled | en_route | delivered | installed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  org_id UUID
);

-- Restock tasks table
CREATE TABLE IF NOT EXISTS restock_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id UUID REFERENCES machines(id) ON DELETE CASCADE,
  next_visit DATE,
  cadence_days INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  org_id UUID
);

-- Cash collection schedule table
CREATE TABLE IF NOT EXISTS cash_collection_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id UUID REFERENCES machines(id) ON DELETE CASCADE,
  next_collection DATE,
  cadence_days INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  org_id UUID
);

-- Add org_id triggers for all new tables
CREATE TRIGGER set_site_surveys_org_id BEFORE INSERT ON site_surveys FOR EACH ROW EXECUTE FUNCTION set_org_id();
CREATE TRIGGER set_machine_orders_org_id BEFORE INSERT ON machine_orders FOR EACH ROW EXECUTE FUNCTION set_org_id();
CREATE TRIGGER set_machine_assignments_org_id BEFORE INSERT ON machine_assignments FOR EACH ROW EXECUTE FUNCTION set_org_id();
CREATE TRIGGER set_planograms_org_id BEFORE INSERT ON planograms FOR EACH ROW EXECUTE FUNCTION set_org_id();
CREATE TRIGGER set_planogram_items_org_id BEFORE INSERT ON planogram_items FOR EACH ROW EXECUTE FUNCTION set_org_id();
CREATE TRIGGER set_deliveries_org_id BEFORE INSERT ON deliveries FOR EACH ROW EXECUTE FUNCTION set_org_id();
CREATE TRIGGER set_restock_tasks_org_id BEFORE INSERT ON restock_tasks FOR EACH ROW EXECUTE FUNCTION set_org_id();
CREATE TRIGGER set_cash_collection_schedule_org_id BEFORE INSERT ON cash_collection_schedule FOR EACH ROW EXECUTE FUNCTION set_org_id();

-- Add pipeline_stage column to leads if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'pipeline_stage') THEN
        ALTER TABLE leads ADD COLUMN pipeline_stage TEXT DEFAULT 'lead';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'fit_score') THEN
        ALTER TABLE leads ADD COLUMN fit_score NUMERIC;
    END IF;
END $$;

-- RLS policies for new tables
ALTER TABLE site_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE planograms ENABLE ROW LEVEL SECURITY;
ALTER TABLE planogram_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE restock_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_collection_schedule ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Org members can manage site surveys" ON site_surveys FOR ALL USING (is_org_member(org_id)) WITH CHECK (org_id = current_org());
CREATE POLICY "Org members can manage machine orders" ON machine_orders FOR ALL USING (is_org_member(org_id)) WITH CHECK (org_id = current_org());
CREATE POLICY "Org members can manage machine assignments" ON machine_assignments FOR ALL USING (is_org_member(org_id)) WITH CHECK (org_id = current_org());
CREATE POLICY "Org members can manage planograms" ON planograms FOR ALL USING (is_org_member(org_id)) WITH CHECK (org_id = current_org());
CREATE POLICY "Org members can manage planogram items" ON planogram_items FOR ALL USING (is_org_member(org_id)) WITH CHECK (org_id = current_org());
CREATE POLICY "Org members can manage deliveries" ON deliveries FOR ALL USING (is_org_member(org_id)) WITH CHECK (org_id = current_org());
CREATE POLICY "Org members can manage restock tasks" ON restock_tasks FOR ALL USING (is_org_member(org_id)) WITH CHECK (org_id = current_org());
CREATE POLICY "Org members can manage cash collection schedule" ON cash_collection_schedule FOR ALL USING (is_org_member(org_id)) WITH CHECK (org_id = current_org());