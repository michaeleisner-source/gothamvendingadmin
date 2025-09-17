-- =====================================================
-- GOTHAM VENDING DATABASE SCHEMA
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they conflict (be careful in production!)
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS machines CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS leads CASCADE;

-- =====================================================
-- LEADS TABLE
-- =====================================================
CREATE TABLE leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    location_type TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    estimated_foot_traffic INTEGER DEFAULT 0,
    contact_method TEXT NOT NULL DEFAULT 'email',
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'interested', 'negotiating', 'closed', 'rejected')),
    notes TEXT,
    follow_up_date DATE,
    revenue_split DECIMAL(5,2)
);

-- =====================================================
-- LOCATIONS TABLE  
-- =====================================================
CREATE TABLE locations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    location_type TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    contact_email TEXT,
    contact_phone TEXT,
    revenue_split DECIMAL(5,2) DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'pending')),
    notes TEXT
);

-- =====================================================
-- MACHINES TABLE
-- =====================================================
CREATE TABLE machines (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    machine_model TEXT NOT NULL,
    serial_number TEXT UNIQUE NOT NULL,
    install_date DATE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'offline', 'removed')),
    last_service_date DATE,
    next_service_date DATE,
    current_cash DECIMAL(10,2) DEFAULT 0,
    notes TEXT
);

-- =====================================================
-- SALES TABLE
-- =====================================================
CREATE TABLE sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    machine_id UUID REFERENCES machines(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    quantity_sold INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'mobile'))
);

-- =====================================================
-- INVENTORY TABLE
-- =====================================================
CREATE TABLE inventory (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    machine_id UUID REFERENCES machines(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    current_stock INTEGER DEFAULT 0,
    max_capacity INTEGER NOT NULL,
    reorder_level INTEGER DEFAULT 5,
    cost_per_unit DECIMAL(10,2) NOT NULL,
    sell_price DECIMAL(10,2) NOT NULL,
    last_restocked TIMESTAMP WITH TIME ZONE,
    UNIQUE(machine_id, product_name)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_follow_up ON leads(follow_up_date);
CREATE INDEX IF NOT EXISTS idx_machines_location ON machines(location_id);
CREATE INDEX IF NOT EXISTS idx_machines_status ON machines(status);
CREATE INDEX IF NOT EXISTS idx_sales_machine ON sales(machine_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_inventory_machine ON inventory(machine_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock ON inventory(current_stock);

-- =====================================================
-- UPDATE TRIGGERS
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_machines_updated_at BEFORE UPDATE ON machines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================
-- Insert sample location
INSERT INTO locations (name, address, city, state, zip_code, location_type, contact_name, contact_email, revenue_split, status) 
VALUES (
    'Downtown Office Building',
    '123 Main Street',
    'New York',
    'NY',
    '10001',
    'office',
    'John Smith',
    'john@building.com',
    15.00,
    'active'
);

-- Insert sample lead
INSERT INTO leads (name, email, phone, company, location_type, address, city, state, zip_code, estimated_foot_traffic, contact_method, status, notes) 
VALUES (
    'Metro Hospital',
    'facilities@metrohospital.com',
    '(555) 123-4567',
    'Metro Healthcare System',
    'healthcare',
    '456 Health Ave',
    'Brooklyn',
    'NY',
    '11201',
    500,
    'email',
    'interested',
    'High foot traffic hospital, interested in healthy snack options'
);

-- Insert sample machine for the location
INSERT INTO machines (location_id, machine_model, serial_number, install_date, status, current_cash)
SELECT 
    l.id,
    'VendMax 3000',
    'VM3000-001',
    '2024-01-15',
    'active',
    125.50
FROM locations l 
WHERE l.name = 'Downtown Office Building';

-- Insert sample sales data
INSERT INTO sales (machine_id, product_name, quantity_sold, unit_price, total_amount, payment_method)
SELECT 
    m.id,
    'Coca-Cola',
    2,
    2.50,
    5.00,
    'card'
FROM machines m 
WHERE m.serial_number = 'VM3000-001';