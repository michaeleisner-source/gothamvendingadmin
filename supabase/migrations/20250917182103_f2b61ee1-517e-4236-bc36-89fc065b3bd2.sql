-- =====================================================
-- ENABLE ROW LEVEL SECURITY AND CREATE POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Since this is a simplified single-tenant system without user authentication,
-- we'll create policies that allow full access for now
-- In a production system, you would want to add proper user authentication

-- LEADS policies - allow all operations for now
CREATE POLICY "Allow all operations on leads" ON leads
    FOR ALL USING (true) WITH CHECK (true);

-- LOCATIONS policies - allow all operations for now
CREATE POLICY "Allow all operations on locations" ON locations
    FOR ALL USING (true) WITH CHECK (true);

-- MACHINES policies - allow all operations for now
CREATE POLICY "Allow all operations on machines" ON machines
    FOR ALL USING (true) WITH CHECK (true);

-- SALES policies - allow all operations for now
CREATE POLICY "Allow all operations on sales" ON sales
    FOR ALL USING (true) WITH CHECK (true);

-- INVENTORY policies - allow all operations for now
CREATE POLICY "Allow all operations on inventory" ON inventory
    FOR ALL USING (true) WITH CHECK (true);