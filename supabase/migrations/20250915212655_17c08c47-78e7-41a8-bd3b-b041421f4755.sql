-- Enable RLS on processor_fee_rules table
alter table public.processor_fee_rules enable row level security;

-- Create RLS policy for processor_fee_rules
create policy "processor_fee_rules_all" on public.processor_fee_rules
  for all using (true);  -- These are system-wide rules

-- Enable RLS on any other missing tables and create appropriate policies
-- Fix search path for functions that need it
alter function public.normalize_help_query(text) set search_path = public, pg_temp;
alter function public.search_help(text, integer) set search_path = public, pg_temp;
alter function public.list_suppliers(text, integer, integer) set search_path = public, pg_temp;
alter function public.upsert_supplier(jsonb) set search_path = public, pg_temp;
alter function public.create_po_with_items(uuid, jsonb) set search_path = public, pg_temp;
alter function public.list_products(text, integer, integer) set search_path = public, pg_temp;
alter function public.generate_machine_slots(uuid, integer, integer) set search_path = public, pg_temp;
alter function public.upsert_slot_assignments(uuid, jsonb) set search_path = public, pg_temp;
alter function public.start_restock_session(uuid, text) set search_path = public, pg_temp;
alter function public.save_restock_session(uuid, boolean, jsonb) set search_path = public, pg_temp;
alter function public.report_revenue_per_product(timestamptz, timestamptz) set search_path = public, pg_temp;
alter function public.report_low_stock() set search_path = public, pg_temp;
alter function public.dashboard_metrics() set search_path = public, pg_temp;
alter function public.report_restock_history(uuid, integer) set search_path = public, pg_temp;
alter function public.search_all(text, integer) set search_path = public, pg_temp;
alter function public.report_purchase_orders(text, integer) set search_path = public, pg_temp;
alter function public.get_machine_health_data() set search_path = public, pg_temp;
alter function public.report_revenue_per_machine(timestamptz, timestamptz) set search_path = public, pg_temp;
alter function public.record_sale(uuid, uuid, integer, integer, integer, timestamptz, text) set search_path = public, pg_temp;
alter function public.get_machine_product_price(uuid, uuid, date) set search_path = public, pg_temp;
alter function public.report_orders_per_day(timestamptz, timestamptz) set search_path = public, pg_temp;
alter function public.report_products_sold_per_day(timestamptz, timestamptz) set search_path = public, pg_temp;
alter function public.report_financial_kpis(timestamptz, timestamptz) set search_path = public, pg_temp;
alter function public.report_products_sold_per_month(timestamptz, timestamptz) set search_path = public, pg_temp;
alter function public.delete_purchase_order_with_log(uuid, text, text) set search_path = public, pg_temp;
alter function public.calculate_processor_fees(uuid, integer, date) set search_path = public, pg_temp;
alter function public.check_machine_health_and_create_tickets() set search_path = public, pg_temp;
alter function public.report_profit_per_machine(timestamptz, timestamptz) set search_path = public, pg_temp;