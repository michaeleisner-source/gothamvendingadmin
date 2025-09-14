-- Make website completely public - remove all authentication requirements

-- First, check what policies exist and drop them properly
DO $$
DECLARE
    pol_name text;
BEGIN
    -- Drop all existing policies on help-related tables
    FOR pol_name IN 
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('help_backlog', 'help_escalations', 'help_article_views', 
                         'help_bot_sessions', 'help_click_events', 'help_search_events', 
                         'help_feedback', 'help_zero_results')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol_name, 
                      (SELECT tablename FROM pg_policies 
                       WHERE policyname = pol_name AND schemaname = 'public' LIMIT 1));
    END LOOP;
END
$$;

-- Create simple public policies for all help tables
CREATE POLICY "public_access" ON help_backlog FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON help_escalations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON help_article_views FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON help_bot_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON help_click_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON help_search_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON help_feedback FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON help_zero_results FOR ALL USING (true) WITH CHECK (true);

-- Update analytics functions to work without authentication
CREATE OR REPLACE FUNCTION rpc_log_help_escalation(_q TEXT, _context TEXT, _ticket UUID)
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO help_escalations(user_id, q, context_page, created_ticket_id)
  VALUES (null, _q, _context, _ticket);
END; $$;

-- Update other RPC functions to handle null user IDs
CREATE OR REPLACE FUNCTION rpc_log_help_search(_q text, _count integer, _context text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _id UUID;
BEGIN
  INSERT INTO help_search_events(user_id, q, result_count, context_page)
  VALUES (null, _q, _count, _context)
  RETURNING id INTO _id;
  IF _count = 0 THEN
    INSERT INTO help_zero_results(user_id, q, context_page) VALUES (null, _q, _context);
  END IF;
  RETURN _id;
END; $$;

CREATE OR REPLACE FUNCTION rpc_log_help_click(_search_id uuid, _source text, _target uuid, _rank integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO help_click_events(user_id, search_event_id, source, target_id, rank)
  VALUES (null, _search_id, _source, _target, _rank);
END; $$;

CREATE OR REPLACE FUNCTION rpc_log_help_feedback(_article uuid, _helpful boolean, _comment text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO help_feedback(user_id, article_id, helpful, comment)
  VALUES (null, _article, _helpful, _comment);
END; $$;