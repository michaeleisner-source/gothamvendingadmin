-- Create maintenance plans table
CREATE TABLE public.maintenance_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  machine_id uuid NOT NULL,
  plan_name text,
  interval_days int NOT NULL,
  next_due date,
  warranty_provider text,
  warranty_expires_on date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.maintenance_plans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "maintenance_plans_all" 
ON public.maintenance_plans 
FOR ALL 
USING (is_org_member(org_id))
WITH CHECK (org_id = current_org());

-- Create maintenance work orders table
CREATE TABLE public.maintenance_work_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  machine_id uuid NOT NULL,
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  priority text CHECK (priority IN ('low','medium','high','urgent')),
  issue text NOT NULL,
  resolution text,
  labor_hours numeric(6,2) DEFAULT 0,
  labor_cost numeric(10,2) DEFAULT 0,
  parts_cost numeric(10,2) DEFAULT 0,
  technician_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.maintenance_work_orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "maintenance_work_orders_all" 
ON public.maintenance_work_orders 
FOR ALL 
USING (is_org_member(org_id))
WITH CHECK (org_id = current_org());

-- Create par rules table
CREATE TABLE public.par_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  scope_type text NOT NULL CHECK (scope_type IN ('global','location','machine','slot','product')),
  scope_id uuid,
  product_id uuid,
  min_qty int NOT NULL DEFAULT 0,
  max_qty int,
  reorder_qty int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, scope_type, scope_id, product_id)
);

-- Enable RLS
ALTER TABLE public.par_rules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "par_rules_all" 
ON public.par_rules 
FOR ALL 
USING (is_org_member(org_id))
WITH CHECK (org_id = current_org());

-- Create product lots table
CREATE TABLE public.product_lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  product_id uuid NOT NULL,
  supplier_id uuid,
  lot_no text,
  received_at date,
  expires_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_lots ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "product_lots_all" 
ON public.product_lots 
FOR ALL 
USING (is_org_member(org_id))
WITH CHECK (org_id = current_org());

-- Add org_id triggers
CREATE TRIGGER set_org_id_maintenance_plans
  BEFORE INSERT ON public.maintenance_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.set_org_id();

CREATE TRIGGER set_org_id_maintenance_work_orders
  BEFORE INSERT ON public.maintenance_work_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_org_id();

CREATE TRIGGER set_org_id_par_rules
  BEFORE INSERT ON public.par_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.set_org_id();

CREATE TRIGGER set_org_id_product_lots
  BEFORE INSERT ON public.product_lots
  FOR EACH ROW
  EXECUTE FUNCTION public.set_org_id();

-- Add update timestamp triggers
CREATE TRIGGER update_maintenance_plans_updated_at
  BEFORE UPDATE ON public.maintenance_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maintenance_work_orders_updated_at
  BEFORE UPDATE ON public.maintenance_work_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_par_rules_updated_at
  BEFORE UPDATE ON public.par_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_lots_updated_at
  BEFORE UPDATE ON public.product_lots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();