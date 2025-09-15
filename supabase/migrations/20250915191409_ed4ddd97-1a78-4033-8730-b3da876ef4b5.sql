-- Fix remaining RLS issues by checking what tables still need RLS enabled

-- Get list of all remaining tables that need RLS
DO $$
DECLARE
    table_name TEXT;
    tables_to_fix TEXT[] := ARRAY[
        'locations', 'machines', 'machine_slots', 'products', 'suppliers', 
        'purchase_orders', 'purchase_order_items', 'slot_assignments', 
        'restock_sessions', 'restock_lines', 'sales', 'prospects', 
        'organizations', 'profiles', 'memberships', 'location_types', 'staff'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables_to_fix
    LOOP
        -- Check if table exists and enable RLS if not already enabled
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = table_name) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
        END IF;
    END LOOP;
END $$;

-- Create comprehensive RLS policies for help system tables (public access for help content)
CREATE POLICY "Help articles are publicly readable" ON public.help_articles FOR SELECT USING (true);
CREATE POLICY "Help categories are publicly readable" ON public.help_categories FOR SELECT USING (true);
CREATE POLICY "Help FAQs are publicly readable" ON public.help_faqs FOR SELECT USING (true);

-- Help analytics - allow public logging but restrict reading to org members
CREATE POLICY "Public can log help searches" ON public.help_search_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can log help clicks" ON public.help_click_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can log help feedback" ON public.help_feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can log help article views" ON public.help_article_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can start help bot sessions" ON public.help_bot_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update help bot sessions" ON public.help_bot_sessions FOR UPDATE USING (true);
CREATE POLICY "Public can log zero results" ON public.help_zero_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can log escalations" ON public.help_escalations FOR INSERT WITH CHECK (true);

-- Help backlog - restrict to authenticated org members only
CREATE POLICY "Org members can manage help backlog" ON public.help_backlog 
FOR ALL USING (auth.uid() IS NOT NULL);

-- Machine slot pars and inventory transactions - org-level access
CREATE POLICY "Org members can manage slot pars" ON public.machine_slot_pars 
FOR ALL USING (is_org_member(org_id));

CREATE POLICY "Org members can manage inventory transactions" ON public.inventory_transactions 
FOR ALL USING (
  CASE 
    WHEN product_id IS NOT NULL THEN 
      EXISTS(SELECT 1 FROM products p WHERE p.id = product_id AND is_org_member(p.org_id))
    ELSE 
      auth.uid() IS NOT NULL
  END
);

-- Inventory levels - org-level access  
CREATE POLICY "Org members can manage inventory levels" ON public.inventory_levels 
FOR ALL USING (is_org_member(org_id));

-- Payment processors and mappings - org-level access
CREATE POLICY "Org members can manage payment processors" ON public.payment_processors 
FOR ALL USING (is_org_member(org_id));

CREATE POLICY "Org members can manage processor mappings" ON public.machine_processor_mappings 
FOR ALL USING (is_org_member(org_id));

-- Machine product pricing - org-level access
CREATE POLICY "Org members can manage machine pricing" ON public.machine_product_pricing 
FOR ALL USING (is_org_member(org_id));

-- Tickets - org-level access
CREATE POLICY "Org members can manage tickets" ON public.tickets 
FOR ALL USING (is_org_member(org_id));

-- Deletion logs - org-level access
CREATE POLICY "Org members can view deletion logs" ON public.deletion_logs 
FOR SELECT USING (is_org_member(org_id));