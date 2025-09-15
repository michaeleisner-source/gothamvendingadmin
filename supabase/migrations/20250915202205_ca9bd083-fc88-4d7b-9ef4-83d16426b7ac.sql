-- Machine Health Alerts System
CREATE TABLE IF NOT EXISTS public.machine_health_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  machine_id UUID NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('offline', 'low_inventory', 'cash_full', 'maintenance_due', 'high_temperature', 'door_open', 'payment_error')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE NULL,
  resolved_by UUID NULL,
  resolution_notes TEXT NULL,
  auto_resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Cash Collection Management
CREATE TABLE IF NOT EXISTS public.cash_collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  machine_id UUID NOT NULL,
  collection_date DATE NOT NULL,
  collected_amount_cents INTEGER NOT NULL DEFAULT 0,
  expected_amount_cents INTEGER NULL,
  deposited_amount_cents INTEGER NULL,
  collector_id UUID NULL,
  route_id UUID NULL,
  discrepancy_cents INTEGER GENERATED ALWAYS AS (collected_amount_cents - COALESCE(expected_amount_cents, collected_amount_cents)) STORED,
  collection_notes TEXT NULL,
  deposit_reference TEXT NULL,
  deposited_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Customer Interaction Analytics
CREATE TABLE IF NOT EXISTS public.customer_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  machine_id UUID NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('purchase', 'failed_purchase', 'browse', 'maintenance_visit', 'refund')),
  payment_method TEXT NULL CHECK (payment_method IN ('cash', 'card', 'mobile', 'other')),
  product_id UUID NULL,
  amount_cents INTEGER NULL,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_duration_seconds INTEGER NULL,
  error_code TEXT NULL,
  customer_feedback TEXT NULL
);

-- Machine Performance Metrics (for predictive analytics)
CREATE TABLE IF NOT EXISTS public.machine_performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  machine_id UUID NOT NULL,
  metric_date DATE NOT NULL,
  total_sales_cents INTEGER NOT NULL DEFAULT 0,
  total_transactions INTEGER NOT NULL DEFAULT 0,
  failed_transactions INTEGER NOT NULL DEFAULT 0,
  uptime_minutes INTEGER NOT NULL DEFAULT 0,
  downtime_minutes INTEGER NOT NULL DEFAULT 0,
  cash_collected_cents INTEGER NOT NULL DEFAULT 0,
  products_dispensed INTEGER NOT NULL DEFAULT 0,
  energy_consumption_kwh NUMERIC(10,2) NULL,
  temperature_avg NUMERIC(5,2) NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Notifications System
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  user_id UUID NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'info' CHECK (notification_type IN ('info', 'warning', 'error', 'success')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  read_at TIMESTAMP WITH TIME ZONE NULL,
  action_url TEXT NULL,
  action_label TEXT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NULL,
  metadata JSONB NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Maintenance Schedules (enhanced)
CREATE TABLE IF NOT EXISTS public.maintenance_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  machine_id UUID NOT NULL,
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('preventive', 'corrective', 'emergency')),
  frequency_days INTEGER NOT NULL DEFAULT 30,
  last_service_date DATE NULL,
  next_service_date DATE NOT NULL,
  estimated_cost_cents INTEGER NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assigned_technician_id UUID NULL,
  service_description TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables only
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'machine_health_alerts') THEN
    ALTER TABLE public.machine_health_alerts ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "machine_health_alerts_all" ON public.machine_health_alerts
    FOR ALL USING (is_org_member(org_id)) WITH CHECK (org_id = current_org());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cash_collections') THEN
    ALTER TABLE public.cash_collections ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "cash_collections_all" ON public.cash_collections
    FOR ALL USING (is_org_member(org_id)) WITH CHECK (org_id = current_org());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_interactions') THEN
    ALTER TABLE public.customer_interactions ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "customer_interactions_all" ON public.customer_interactions
    FOR ALL USING (is_org_member(org_id)) WITH CHECK (org_id = current_org());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'machine_performance_metrics') THEN
    ALTER TABLE public.machine_performance_metrics ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "machine_performance_metrics_all" ON public.machine_performance_metrics
    FOR ALL USING (is_org_member(org_id)) WITH CHECK (org_id = current_org());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications') THEN
    ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "notifications_all" ON public.notifications
    FOR ALL USING (is_org_member(org_id)) WITH CHECK (org_id = current_org());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'maintenance_schedules') THEN
    ALTER TABLE public.maintenance_schedules ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "maintenance_schedules_all" ON public.maintenance_schedules
    FOR ALL USING (is_org_member(org_id)) WITH CHECK (org_id = current_org());
  END IF;
END $$;