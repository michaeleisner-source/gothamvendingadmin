-- Help Content Backlog System
-- Automated backlog from zero-result queries and content pipeline management

-- Helpful extensions
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Backlog table for managing content creation pipeline
CREATE TABLE IF NOT EXISTS help_backlog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  q TEXT NOT NULL,
  normalized_q TEXT,
  query_hash TEXT,
  context_page TEXT,
  misses_90d INTEGER DEFAULT 0,
  escalations_90d INTEGER DEFAULT 0,
  last_seen TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','writing','review','published','wont_fix')),
  priority INTEGER NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5), -- 1 highest
  category_id UUID REFERENCES help_categories(id),
  article_id UUID REFERENCES help_articles(id),
  assigned_staff_id UUID REFERENCES staff(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_help_backlog_query_hash ON help_backlog(query_hash);
CREATE INDEX IF NOT EXISTS idx_help_backlog_status_priority ON help_backlog(status, priority);

-- Escalations captured when users need to create tickets
CREATE TABLE IF NOT EXISTS help_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  q TEXT NOT NULL,
  context_page TEXT,
  created_ticket_id UUID, -- Generic UUID, may not have FK constraint
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE help_backlog ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_escalations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "backlog_read" ON help_backlog;
DROP POLICY IF EXISTS "backlog_write" ON help_backlog;
DROP POLICY IF EXISTS "backlog_update" ON help_backlog;
DROP POLICY IF EXISTS "backlog_delete" ON help_backlog;
DROP POLICY IF EXISTS "escalations_read" ON help_escalations;
DROP POLICY IF EXISTS "escalations_write" ON help_escalations;

-- Create policies
CREATE POLICY "backlog_read" ON help_backlog 
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "backlog_write" ON help_backlog 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "backlog_update" ON help_backlog 
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "backlog_delete" ON help_backlog 
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "escalations_read" ON help_escalations 
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "escalations_write" ON help_escalations 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Function to normalize queries
CREATE OR REPLACE FUNCTION normalize_help_query(input_text TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT lower(regexp_replace(input_text, '[^a-zA-Z0-9\s]', '', 'g'));
$$;

-- Trigger to update normalized fields
CREATE OR REPLACE FUNCTION update_help_backlog_normalized()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.normalized_q := normalize_help_query(NEW.q);
  NEW.query_hash := md5(NEW.normalized_q);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_help_backlog_normalize
  BEFORE INSERT OR UPDATE ON help_backlog
  FOR EACH ROW
  EXECUTE FUNCTION update_help_backlog_normalized();

-- RPC: log escalation (call when the bot creates a ticket after a failed search)
CREATE OR REPLACE FUNCTION rpc_log_help_escalation(_q TEXT, _context TEXT, _ticket UUID)
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO help_escalations(user_id, q, context_page, created_ticket_id)
  VALUES (auth.uid(), _q, _context, _ticket);
END; $$;

-- RPC: Refresh backlog from the last N days of zero-result queries
CREATE OR REPLACE FUNCTION rpc_refresh_help_backlog(days_back INTEGER DEFAULT 90)
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Aggregate zero-result queries
  WITH zr AS (
    SELECT normalize_help_query(q) AS nq,
           md5(normalize_help_query(q)) AS qh,
           count(*) AS misses,
           max(created_at) AS last_seen,
           mode() WITHIN GROUP (ORDER BY context_page) AS context_suggest,
           q AS original_q
    FROM help_zero_results
    WHERE created_at > now() - (days_back || ' days')::interval
    GROUP BY normalize_help_query(q), q
  ), es AS (
    SELECT normalize_help_query(q) AS nq,
           count(*) AS escalations
    FROM help_escalations
    WHERE created_at > now() - (days_back || ' days')::interval
    GROUP BY normalize_help_query(q)
  )
  INSERT INTO help_backlog(q, normalized_q, query_hash, context_page, misses_90d, escalations_90d, last_seen, status, priority, category_id, notes)
  SELECT zr.original_q AS q,
         zr.nq AS normalized_q,
         zr.qh AS query_hash,
         zr.context_suggest AS context_page,
         zr.misses AS misses_90d,
         coalesce(es.escalations,0) AS escalations_90d,
         zr.last_seen,
         'open' AS status,
         CASE WHEN coalesce(es.escalations,0) > 0 THEN 1
              WHEN zr.misses >= 10 THEN 2
              WHEN zr.misses >= 5 THEN 3
              WHEN zr.misses >= 2 THEN 4
              ELSE 5 END AS priority,
         -- Simple context → category heuristic
         (SELECT id FROM help_categories WHERE slug = CASE
             WHEN zr.context_suggest LIKE '/prospects%' OR zr.context_suggest LIKE '/locations%' THEN 'pipeline'
             WHEN zr.context_suggest LIKE '/machines%' OR zr.context_suggest LIKE '/slots%' OR zr.context_suggest LIKE '/setup%' THEN 'machines'
             WHEN zr.context_suggest LIKE '/products%' OR zr.context_suggest LIKE '/inventory%' OR zr.context_suggest LIKE '/purchase-orders%' OR zr.context_suggest LIKE '/restock%' THEN 'supply'
             WHEN zr.context_suggest LIKE '/sales%' OR zr.context_suggest LIKE '/cost-analysis%' OR zr.context_suggest LIKE '/finance%' OR zr.context_suggest LIKE '/reports%' THEN 'finance'
             WHEN zr.context_suggest LIKE '/delivery-routes%' OR zr.context_suggest LIKE '/tickets%' THEN 'logistics'
             ELSE 'workflow' END
         ) AS category_id,
         'Auto-generated from zero-result search' AS notes
  FROM zr
  LEFT JOIN es ON es.nq = zr.nq
  ON CONFLICT (query_hash) DO UPDATE SET
    misses_90d = EXCLUDED.misses_90d,
    escalations_90d = EXCLUDED.escalations_90d,
    last_seen = EXCLUDED.last_seen,
    context_page = coalesce(EXCLUDED.context_page, help_backlog.context_page),
    updated_at = now();
END; $$;

-- RPC: Promote a backlog row into a new article stub
CREATE OR REPLACE FUNCTION rpc_promote_backlog_to_article(_backlog_id UUID)
RETURNS UUID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  b RECORD;
  new_id UUID;
  slug TEXT;
BEGIN
  SELECT * INTO b FROM help_backlog WHERE id = _backlog_id;
  IF b IS NULL THEN RAISE EXCEPTION 'Backlog item not found'; END IF;

  slug := regexp_replace(coalesce(b.normalized_q, b.q), '[^a-z0-9]+', '-', 'g');

  INSERT INTO help_articles(category_id, title, slug, body_md)
  VALUES (
    coalesce(b.category_id, (SELECT id FROM help_categories WHERE slug='workflow')),
    initcap(b.q),
    slug,
    '## Goal' || E'\n' ||
    'Explain how to ' || b.q || ' step by step.' || E'\n\n' ||
    '### Steps' || E'\n' ||
    '1. **Open the relevant page**.' || E'\n' ||
    '2. **Follow on-screen prompts**.' || E'\n' ||
    '3. **Verify results** on the Dashboard or Reports.' || E'\n\n' ||
    '> _Replace this template with detailed instructions and screenshots._'
  ) RETURNING id INTO new_id;

  UPDATE help_backlog
  SET status = 'writing', article_id = new_id, updated_at = now()
  WHERE id = _backlog_id;

  RETURN new_id;
END; $$;

-- RPC: merge duplicates (keep the one with highest misses)
CREATE OR REPLACE FUNCTION rpc_merge_backlog(_primary UUID, _duplicate UUID)
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE help_backlog p
  SET misses_90d = p.misses_90d + d.misses_90d,
      escalations_90d = p.escalations_90d + d.escalations_90d,
      notes = coalesce(p.notes,'') || E'\nMerged: ' || d.q,
      updated_at = now()
  FROM help_backlog d
  WHERE p.id = _primary AND d.id = _duplicate;
  
  DELETE FROM help_backlog WHERE id = _duplicate;
END; $$;