-- Fix critical security issues: Enable RLS on tables that have policies but RLS disabled

-- Enable RLS for all tables that have policies but RLS disabled
ALTER TABLE public.machine_slot_pars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Enable RLS for other public tables that don't have it enabled
ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_search_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_click_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_article_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_bot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_zero_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_backlog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_processors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_processor_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_product_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deletion_logs ENABLE ROW LEVEL SECURITY;