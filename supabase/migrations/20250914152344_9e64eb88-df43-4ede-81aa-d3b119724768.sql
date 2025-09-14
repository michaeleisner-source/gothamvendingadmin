-- Help Center Analytics & Reporting System
-- Tables for tracking help center usage and performance

-- Core event tables
-- Who searched, what they asked, and what we returned
CREATE TABLE IF NOT EXISTS help_search_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  q TEXT NOT NULL,
  result_count INT NOT NULL,
  context_page TEXT,             -- e.g., '/machines', '/inventory'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Which result they clicked (if any)
CREATE TABLE IF NOT EXISTS help_click_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  search_event_id UUID REFERENCES help_search_events(id) ON DELETE SET NULL,
  source TEXT NOT NULL,          -- 'article' | 'faq'
  target_id UUID NOT NULL,       -- article or faq id
  rank INT,                      -- position in list
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Page/article views (optional but useful)
CREATE TABLE IF NOT EXISTS help_article_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  article_id UUID REFERENCES help_articles(id) ON DELETE CASCADE,
  dwell_ms INT,                  -- time spent (frontend estimate)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Feedback: was this helpful? comments for improvement
CREATE TABLE IF NOT EXISTS help_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  article_id UUID REFERENCES help_articles(id) ON DELETE CASCADE,
  helpful BOOLEAN,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bot sessions / resolution
CREATE TABLE IF NOT EXISTS help_bot_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  resolved BOOLEAN,              -- user indicated question answered
  created_ticket_id UUID         -- ticket created from bot (if any)
);

-- Optional: zero-result details
CREATE TABLE IF NOT EXISTS help_zero_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  q TEXT NOT NULL,
  context_page TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE help_search_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_click_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_article_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_bot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_zero_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies (read-only to all authenticated; inserts allowed by auth'd users)
CREATE POLICY IF NOT EXISTS help_events_read ON help_search_events FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS help_events_insert ON help_search_events FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS help_clicks_read ON help_click_events FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS help_clicks_insert ON help_click_events FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS help_views_read ON help_article_views FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS help_views_insert ON help_article_views FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS help_feedback_read ON help_feedback FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS help_feedback_insert ON help_feedback FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS help_bots_read ON help_bot_sessions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS help_bots_insert ON help_bot_sessions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS help_zero_read ON help_zero_results FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS help_zero_insert ON help_zero_results FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Helpful RPC shortcuts
CREATE OR REPLACE FUNCTION rpc_log_help_search(_q TEXT, _count INT, _context TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _id UUID;
BEGIN
  INSERT INTO help_search_events(user_id, q, result_count, context_page)
  VALUES (auth.uid(), _q, _count, _context)
  RETURNING id INTO _id;
  IF _count = 0 THEN
    INSERT INTO help_zero_results(user_id, q, context_page) VALUES (auth.uid(), _q, _context);
  END IF;
  RETURN _id;
END; $$;

CREATE OR REPLACE FUNCTION rpc_log_help_click(_search_id UUID, _source TEXT, _target UUID, _rank INT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO help_click_events(user_id, search_event_id, source, target_id, rank)
  VALUES (auth.uid(), _search_id, _source, _target, _rank);
END; $$;

CREATE OR REPLACE FUNCTION rpc_log_help_feedback(_article UUID, _helpful BOOLEAN, _comment TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO help_feedback(user_id, article_id, helpful, comment)
  VALUES (auth.uid(), _article, _helpful, _comment);
END; $$;

-- Views for analytics reports
-- Top searched queries
CREATE OR REPLACE VIEW v_help_top_queries AS
SELECT q, COUNT(*) AS searches, AVG(result_count)::NUMERIC(10,2) AS avg_results
FROM help_search_events
WHERE created_at > now() - INTERVAL '90 days'
GROUP BY q
ORDER BY searches DESC
LIMIT 200;

-- Zero-result queries (knowledge gaps)
CREATE OR REPLACE VIEW v_help_zero_results AS
SELECT q, COUNT(*) AS misses
FROM help_zero_results
WHERE created_at > now() - INTERVAL '90 days'
GROUP BY q
ORDER BY misses DESC
LIMIT 200;

-- Article performance (CTR + helpfulness)
CREATE OR REPLACE VIEW v_help_article_perf AS
WITH clicks AS (
  SELECT target_id AS article_id, COUNT(*) AS clicks
  FROM help_click_events
  WHERE source = 'article' AND created_at > now() - INTERVAL '90 days'
  GROUP BY 1
),
fb AS (
  SELECT article_id,
         AVG(CASE WHEN helpful THEN 1 ELSE 0 END) AS helpful_rate,
         COUNT(*) AS feedbacks
  FROM help_feedback
  WHERE created_at > now() - INTERVAL '90 days'
  GROUP BY 1
)
SELECT a.id, a.title, COALESCE(c.clicks,0) AS clicks,
       COALESCE(fb.helpful_rate,0) AS helpful_rate,
       COALESCE(fb.feedbacks,0) AS feedback_count,
       a.updated_at
FROM help_articles a
LEFT JOIN clicks c ON c.article_id = a.id
LEFT JOIN fb ON fb.article_id = a.id
ORDER BY clicks DESC, helpful_rate DESC;

-- Bot resolution rate & escalation to tickets
CREATE OR REPLACE VIEW v_help_bot_outcomes AS
SELECT
  DATE_TRUNC('week', COALESCE(ended_at, started_at))::DATE AS week,
  COUNT(*) FILTER (WHERE resolved) AS resolved,
  COUNT(*) FILTER (WHERE created_ticket_id IS NOT NULL) AS escalated,
  COUNT(*) AS sessions,
  ROUND(100.0 * COUNT(*) FILTER (WHERE resolved) / NULLIF(COUNT(*),0), 1) AS resolved_pct,
  ROUND(100.0 * COUNT(*) FILTER (WHERE created_ticket_id IS NOT NULL) / NULLIF(COUNT(*),0), 1) AS escalated_pct
FROM help_bot_sessions
WHERE started_at > now() - INTERVAL '180 days'
GROUP BY 1
ORDER BY 1 DESC;