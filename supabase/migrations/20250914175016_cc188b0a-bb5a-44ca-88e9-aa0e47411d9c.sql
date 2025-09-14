-- Make help content backlog system public (no authentication required)

-- Update help_backlog policies to allow public access
DROP POLICY IF EXISTS "backlog_read" ON help_backlog;
DROP POLICY IF EXISTS "backlog_write" ON help_backlog;
DROP POLICY IF EXISTS "backlog_update" ON help_backlog;
DROP POLICY IF EXISTS "backlog_delete" ON help_backlog;

CREATE POLICY "backlog_public_read" ON help_backlog 
  FOR SELECT USING (true);
CREATE POLICY "backlog_public_write" ON help_backlog 
  FOR INSERT WITH CHECK (true);
CREATE POLICY "backlog_public_update" ON help_backlog 
  FOR UPDATE USING (true);
CREATE POLICY "backlog_public_delete" ON help_backlog 
  FOR DELETE USING (true);

-- Update help_escalations policies to allow public access
DROP POLICY IF EXISTS "escalations_read" ON help_escalations;
DROP POLICY IF EXISTS "escalations_write" ON help_escalations;

CREATE POLICY "escalations_public_read" ON help_escalations 
  FOR SELECT USING (true);
CREATE POLICY "escalations_public_write" ON help_escalations 
  FOR INSERT WITH CHECK (true);

-- Update existing help system policies to be public
DROP POLICY IF EXISTS "help_views_insert" ON help_article_views;
DROP POLICY IF EXISTS "help_views_read" ON help_article_views;
DROP POLICY IF EXISTS "help_bots_insert" ON help_bot_sessions;
DROP POLICY IF EXISTS "help_bots_read" ON help_bot_sessions;
DROP POLICY IF EXISTS "help_clicks_insert" ON help_click_events;
DROP POLICY IF EXISTS "help_clicks_read" ON help_click_events;
DROP POLICY IF EXISTS "help_events_insert" ON help_search_events;
DROP POLICY IF EXISTS "help_events_read" ON help_search_events;
DROP POLICY IF EXISTS "help_feedback_insert" ON help_feedback;
DROP POLICY IF EXISTS "help_feedback_read" ON help_feedback;
DROP POLICY IF EXISTS "help_zero_insert" ON help_zero_results;
DROP POLICY IF EXISTS "help_zero_read" ON help_zero_results;

-- Create public policies for all help tables
CREATE POLICY "help_views_public" ON help_article_views 
  FOR ALL USING (true) WITH CHECK (true);
  
CREATE POLICY "help_bots_public" ON help_bot_sessions 
  FOR ALL USING (true) WITH CHECK (true);
  
CREATE POLICY "help_clicks_public" ON help_click_events 
  FOR ALL USING (true) WITH CHECK (true);
  
CREATE POLICY "help_events_public" ON help_search_events 
  FOR ALL USING (true) WITH CHECK (true);
  
CREATE POLICY "help_feedback_public" ON help_feedback 
  FOR ALL USING (true) WITH CHECK (true);
  
CREATE POLICY "help_zero_public" ON help_zero_results 
  FOR ALL USING (true) WITH CHECK (true);

-- Update RPC functions to work without authentication
CREATE OR REPLACE FUNCTION rpc_log_help_escalation(_q TEXT, _context TEXT, _ticket UUID)
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO help_escalations(user_id, q, context_page, created_ticket_id)
  VALUES (null, _q, _context, _ticket); -- Allow null user_id for public access
END; $$;