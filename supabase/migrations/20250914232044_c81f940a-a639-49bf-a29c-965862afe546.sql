-- Create tickets table for maintenance management
CREATE TABLE public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  machine_id UUID REFERENCES public.machines(id),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  category TEXT DEFAULT 'maintenance',
  assigned_to UUID REFERENCES public.staff(id),
  created_by UUID,
  labor_hours NUMERIC DEFAULT 0,
  labor_cost_cents INTEGER DEFAULT 0,
  parts_cost_cents INTEGER DEFAULT 0,
  resolution TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create inventory_levels table for real-time inventory tracking
CREATE TABLE public.inventory_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  machine_id UUID NOT NULL REFERENCES public.machines(id),
  slot_id UUID NOT NULL REFERENCES public.machine_slots(id),
  product_id UUID NOT NULL REFERENCES public.products(id),
  current_qty INTEGER NOT NULL DEFAULT 0,
  par_level INTEGER DEFAULT 10,
  reorder_point INTEGER DEFAULT 3,
  last_restocked_at TIMESTAMP WITH TIME ZONE,
  sales_velocity NUMERIC DEFAULT 0, -- units per day
  days_of_supply NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(slot_id)
);

-- Create delivery_routes table for route management
CREATE TABLE public.delivery_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  driver_id UUID REFERENCES public.staff(id),
  route_day TEXT CHECK (route_day IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  start_time TIME,
  estimated_duration INTERVAL,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create route_stops table for individual stops on routes
CREATE TABLE public.route_stops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  route_id UUID NOT NULL REFERENCES public.delivery_routes(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES public.machines(id),
  stop_order INTEGER NOT NULL,
  estimated_arrival TIME,
  actual_arrival TIMESTAMP WITH TIME ZONE,
  service_type TEXT DEFAULT 'restock' CHECK (service_type IN ('restock', 'maintenance', 'collection', 'inspection')),
  completed BOOLEAN DEFAULT false,
  notes TEXT
);

-- Create machine_telemetry table for machine health monitoring
CREATE TABLE public.machine_telemetry (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  machine_id UUID NOT NULL REFERENCES public.machines(id),
  temperature NUMERIC,
  coin_jam_count INTEGER DEFAULT 0,
  bill_jam_count INTEGER DEFAULT 0,
  door_open_alerts INTEGER DEFAULT 0,
  power_cycles INTEGER DEFAULT 0,
  error_codes TEXT[],
  last_sale_at TIMESTAMP WITH TIME ZONE,
  cash_level_cents INTEGER,
  network_status TEXT DEFAULT 'online' CHECK (network_status IN ('online', 'offline', 'intermittent')),
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_telemetry ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "tickets_all" ON public.tickets FOR ALL USING (is_org_member(org_id)) WITH CHECK (org_id = current_org());
CREATE POLICY "inventory_levels_all" ON public.inventory_levels FOR ALL USING (is_org_member(org_id)) WITH CHECK (org_id = current_org());
CREATE POLICY "delivery_routes_all" ON public.delivery_routes FOR ALL USING (is_org_member(org_id)) WITH CHECK (org_id = current_org());
CREATE POLICY "route_stops_all" ON public.route_stops FOR ALL USING (is_org_member(org_id)) WITH CHECK (org_id = current_org());
CREATE POLICY "machine_telemetry_all" ON public.machine_telemetry FOR ALL USING (is_org_member(org_id)) WITH CHECK (org_id = current_org());

-- Add org_id trigger for new tables
CREATE TRIGGER set_org_id_tickets BEFORE INSERT ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.set_org_id();
CREATE TRIGGER set_org_id_inventory_levels BEFORE INSERT ON public.inventory_levels FOR EACH ROW EXECUTE FUNCTION public.set_org_id();
CREATE TRIGGER set_org_id_delivery_routes BEFORE INSERT ON public.delivery_routes FOR EACH ROW EXECUTE FUNCTION public.set_org_id();
CREATE TRIGGER set_org_id_route_stops BEFORE INSERT ON public.route_stops FOR EACH ROW EXECUTE FUNCTION public.set_org_id();
CREATE TRIGGER set_org_id_machine_telemetry BEFORE INSERT ON public.machine_telemetry FOR EACH ROW EXECUTE FUNCTION public.set_org_id();

-- Add updated_at triggers
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventory_levels_updated_at BEFORE UPDATE ON public.inventory_levels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_delivery_routes_updated_at BEFORE UPDATE ON public.delivery_routes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();