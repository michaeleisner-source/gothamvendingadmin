-- Fix security definer view warnings by making them security invoker
-- This ensures RLS policies are properly enforced for the calling user

-- Drop existing views
DROP VIEW IF EXISTS v_help_top_queries;
DROP VIEW IF EXISTS v_help_zero_results;
DROP VIEW IF EXISTS v_help_article_perf;
DROP VIEW IF EXISTS v_help_bot_outcomes;

-- Recreate views with security invoker to respect RLS
CREATE VIEW v_help_top_queries 
WITH (security_invoker = true) AS
SELECT q, COUNT(*) AS searches, AVG(result_count)::NUMERIC(10,2) AS avg_results
FROM help_search_events
WHERE created_at > now() - INTERVAL '90 days'
GROUP BY q
ORDER BY searches DESC
LIMIT 200;

CREATE VIEW v_help_zero_results 
WITH (security_invoker = true) AS
SELECT q, COUNT(*) AS misses
FROM help_zero_results
WHERE created_at > now() - INTERVAL '90 days'
GROUP BY q
ORDER BY misses DESC
LIMIT 200;

CREATE VIEW v_help_article_perf 
WITH (security_invoker = true) AS
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

CREATE VIEW v_help_bot_outcomes 
WITH (security_invoker = true) AS
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