-- Create purchase_orders table
CREATE TABLE public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  status TEXT DEFAULT 'OPEN',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchase_order_items table
CREATE TABLE public.purchase_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  po_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  qty_ordered INTEGER NOT NULL CHECK (qty_ordered > 0),
  unit_cost NUMERIC(10,2) NOT NULL CHECK (unit_cost >= 0)
);

-- Create indexes for better performance
CREATE INDEX idx_purchase_orders_supplier_id ON public.purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_created_at ON public.purchase_orders(created_at);
CREATE INDEX idx_purchase_order_items_po_id ON public.purchase_order_items(po_id);
CREATE INDEX idx_purchase_order_items_product_id ON public.purchase_order_items(product_id);