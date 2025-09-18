-- Create comprehensive sales table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  machine_id UUID NOT NULL,
  product_id UUID NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  unit_price_cents INTEGER NOT NULL,
  unit_cost_cents INTEGER,
  total_amount_cents INTEGER GENERATED ALWAYS AS (qty * unit_price_cents) STORED,
  discount_cents INTEGER DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  transaction_id TEXT,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id),
  source TEXT DEFAULT 'manual'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sales_org_id ON public.sales(org_id);
CREATE INDEX IF NOT EXISTS idx_sales_machine_id ON public.sales(machine_id);
CREATE INDEX IF NOT EXISTS idx_sales_product_id ON public.sales(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_occurred_at ON public.sales(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON public.sales(user_id);

-- Enable Row Level Security
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "sales_org_access" ON public.sales
  FOR ALL USING (is_org_member(org_id))
  WITH CHECK (org_id = current_org());

-- Add trigger for org_id
CREATE TRIGGER set_sales_org_id
  BEFORE INSERT ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION set_org_id();

-- Add trigger for updated_at if we add that column later
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for live sales updates
ALTER TABLE public.sales REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales;

-- Create sales performance view for quick analytics
CREATE OR REPLACE VIEW public.sales_daily_summary AS
SELECT 
  org_id,
  DATE(occurred_at) as sale_date,
  machine_id,
  COUNT(*) as transaction_count,
  SUM(qty) as total_items,
  SUM(total_amount_cents) as total_revenue_cents,
  SUM(unit_cost_cents * qty) as total_cost_cents,
  SUM(total_amount_cents) - SUM(COALESCE(unit_cost_cents * qty, 0)) as profit_cents,
  AVG(total_amount_cents) as avg_transaction_cents
FROM public.sales
WHERE occurred_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY org_id, DATE(occurred_at), machine_id;

-- Create sales notifications function
CREATE OR REPLACE FUNCTION notify_new_sale() 
RETURNS TRIGGER AS $$
BEGIN
  -- Send notification for real-time updates
  PERFORM pg_notify('sales_channel', json_build_object(
    'type', 'new_sale',
    'sale_id', NEW.id,
    'machine_id', NEW.machine_id,
    'product_id', NEW.product_id,
    'amount_cents', NEW.total_amount_cents,
    'occurred_at', NEW.occurred_at,
    'org_id', NEW.org_id
  )::text);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for sale notifications
CREATE TRIGGER sales_notification_trigger
  AFTER INSERT ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_sale();