-- Enable RLS on locations table (if not already enabled)
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on other tables that are missing it
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for locations table (with different name to avoid conflict)
CREATE POLICY "locations_allow_all" 
ON public.locations 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create RLS policies for machines table
CREATE POLICY "machines_allow_all" 
ON public.machines 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create RLS policies for purchase_orders table
CREATE POLICY "purchase_orders_allow_all" 
ON public.purchase_orders 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create RLS policies for purchase_order_items table
CREATE POLICY "purchase_order_items_allow_all" 
ON public.purchase_order_items 
FOR ALL 
USING (true) 
WITH CHECK (true);