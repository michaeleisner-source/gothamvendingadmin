-- Enable RLS on locations table
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for locations table
CREATE POLICY "Allow all operations on locations" 
ON public.locations 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Also enable RLS on other tables that are missing it
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for machines table
CREATE POLICY "Allow all operations on machines" 
ON public.machines 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create RLS policies for purchase_orders table
CREATE POLICY "Allow all operations on purchase_orders" 
ON public.purchase_orders 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create RLS policies for purchase_order_items table
CREATE POLICY "Allow all operations on purchase_order_items" 
ON public.purchase_order_items 
FOR ALL 
USING (true) 
WITH CHECK (true);