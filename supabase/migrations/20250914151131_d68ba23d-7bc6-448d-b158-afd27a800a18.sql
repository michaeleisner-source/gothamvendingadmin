-- Create a more flexible search function that handles natural language queries better
CREATE OR REPLACE FUNCTION search_help(q TEXT, limit_count INT DEFAULT 12)
RETURNS TABLE (
  source TEXT,
  id UUID,
  title TEXT,
  snippet TEXT,
  url TEXT,
  rank REAL
) LANGUAGE sql STABLE AS $$
  WITH cleaned_query AS (
    SELECT trim(q) AS clean_q
  ),
  query_variants AS (
    SELECT 
      -- Try websearch first (handles quotes, operators)
      websearch_to_tsquery('simple', unaccent(clean_q)) as websearch_tsq,
      -- Fallback to plainto (handles natural language)
      plainto_tsquery('simple', unaccent(clean_q)) as plainto_tsq,
      -- Extract key terms (remove common words like how, do, i, a, the, etc)
      plainto_tsquery('simple', unaccent(
        regexp_replace(
          regexp_replace(clean_q, '\b(how|do|i|a|an|the|to|is|are|can|will|would|should|could|what|when|where|why|with|for|and|or|but|in|on|at|by)\b', ' ', 'gi'),
          '\s+', ' ', 'g'
        )
      )) as keywords_tsq
    FROM cleaned_query
  )
  -- Try websearch_to_tsquery first
  SELECT 'article'::TEXT, a.id, a.title,
         left(regexp_replace(a.body_md, E'\n+', ' ', 'g'), 140) AS snippet,
         '/help/article/'||a.id AS url,
         ts_rank(a.search_tsv, q.websearch_tsq) AS rank
  FROM help_articles a, query_variants q
  WHERE q.websearch_tsq IS NOT NULL 
    AND a.search_tsv @@ q.websearch_tsq
  
  UNION ALL
  
  -- Fallback to plainto_tsquery  
  SELECT 'article'::TEXT, a.id, a.title,
         left(regexp_replace(a.body_md, E'\n+', ' ', 'g'), 140) AS snippet,
         '/help/article/'||a.id AS url,
         ts_rank(a.search_tsv, q.plainto_tsq) * 0.8 AS rank
  FROM help_articles a, query_variants q
  WHERE q.plainto_tsq IS NOT NULL 
    AND a.search_tsv @@ q.plainto_tsq
    AND NOT EXISTS (
      SELECT 1 FROM help_articles a2, query_variants q2 
      WHERE a2.id = a.id AND q2.websearch_tsq IS NOT NULL AND a2.search_tsv @@ q2.websearch_tsq
    )
  
  UNION ALL
  
  -- Final fallback with key terms only
  SELECT 'article'::TEXT, a.id, a.title,
         left(regexp_replace(a.body_md, E'\n+', ' ', 'g'), 140) AS snippet,
         '/help/article/'||a.id AS url,
         ts_rank(a.search_tsv, q.keywords_tsq) * 0.6 AS rank
  FROM help_articles a, query_variants q
  WHERE q.keywords_tsq IS NOT NULL 
    AND a.search_tsv @@ q.keywords_tsq
    AND NOT EXISTS (
      SELECT 1 FROM help_articles a2, query_variants q2 
      WHERE a2.id = a.id AND (
        (q2.websearch_tsq IS NOT NULL AND a2.search_tsv @@ q2.websearch_tsq) OR
        (q2.plainto_tsq IS NOT NULL AND a2.search_tsv @@ q2.plainto_tsq)
      )
    )
  
  UNION ALL
  
  -- Same logic for FAQs
  SELECT 'faq', f.id, f.question,
         left(regexp_replace(f.answer_md, E'\n+', ' ', 'g'), 140),
         '/help?faq='||f.id,
         ts_rank(f.search_tsv, q.websearch_tsq) AS rank
  FROM help_faqs f, query_variants q
  WHERE q.websearch_tsq IS NOT NULL 
    AND f.search_tsv @@ q.websearch_tsq
  
  UNION ALL
  
  SELECT 'faq', f.id, f.question,
         left(regexp_replace(f.answer_md, E'\n+', ' ', 'g'), 140),
         '/help?faq='||f.id,
         ts_rank(f.search_tsv, q.plainto_tsq) * 0.8 AS rank
  FROM help_faqs f, query_variants q
  WHERE q.plainto_tsq IS NOT NULL 
    AND f.search_tsv @@ q.plainto_tsq
    AND NOT EXISTS (
      SELECT 1 FROM help_faqs f2, query_variants q2 
      WHERE f2.id = f.id AND q2.websearch_tsq IS NOT NULL AND f2.search_tsv @@ q2.websearch_tsq
    )
    
  ORDER BY rank DESC NULLS LAST
  LIMIT limit_count;
$$;