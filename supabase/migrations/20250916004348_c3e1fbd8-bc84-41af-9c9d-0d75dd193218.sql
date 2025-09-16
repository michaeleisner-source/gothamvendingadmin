-- Create demo user account and temporary policies for testing
-- First, add temporary demo-friendly policies that work without authentication

-- Add demo policies for products
CREATE POLICY "demo_products_read" ON public.products
FOR SELECT USING (true);

-- Add demo policies for locations  
CREATE POLICY "demo_locations_read" ON public.locations
FOR SELECT USING (true);

-- Add demo policies for machines
CREATE POLICY "demo_machines_read" ON public.machines  
FOR SELECT USING (true);

-- Add demo policies for sales
CREATE POLICY "demo_sales_read" ON public.sales
FOR SELECT USING (true);

-- Add demo policies for tickets
CREATE POLICY "demo_tickets_read" ON public.tickets
FOR SELECT USING (true);

-- Add demo policies for inventory_levels
CREATE POLICY "demo_inventory_read" ON public.inventory_levels
FOR SELECT USING (true);