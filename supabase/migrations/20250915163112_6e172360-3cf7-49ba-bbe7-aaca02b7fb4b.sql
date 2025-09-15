-- Temporarily disable RLS on main tables for development without authentication
-- This allows anonymous access to all tables for development purposes

-- Disable RLS on key tables
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_slots DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.slot_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.restock_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.restock_lines DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_levels DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_finance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_processors DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_processor_mappings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.processor_fee_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_types DISABLE ROW LEVEL SECURITY;

-- Note: This is for development only. 
-- In production, you should re-enable RLS and create proper policies