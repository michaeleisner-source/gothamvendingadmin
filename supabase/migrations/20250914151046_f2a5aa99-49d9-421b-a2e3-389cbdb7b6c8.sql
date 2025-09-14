-- Fix search_help function to handle queries better
CREATE OR REPLACE FUNCTION search_help(q TEXT, limit_count INT DEFAULT 12)
RETURNS TABLE (
  source TEXT,
  id UUID,
  title TEXT,
  snippet TEXT,
  url TEXT,
  rank REAL
) LANGUAGE sql STABLE AS $$
  WITH query AS (
    SELECT 
      CASE 
        WHEN trim(q) = '' THEN NULL
        ELSE coalesce(
          websearch_to_tsquery('simple', unaccent(trim(q))),
          plainto_tsquery('simple', unaccent(trim(q)))
        )
      END AS tsq
  )
  SELECT 'article'::TEXT, a.id, a.title,
         left(regexp_replace(a.body_md, E'\n+', ' ', 'g'), 140) AS snippet,
         '/help/article/'||a.id AS url,
         ts_rank(a.search_tsv, (SELECT tsq FROM query)) AS rank
  FROM help_articles a, query
  WHERE (SELECT tsq FROM query) IS NOT NULL 
    AND a.search_tsv @@ (SELECT tsq FROM query)
  UNION ALL
  SELECT 'faq', f.id, f.question,
         left(regexp_replace(f.answer_md, E'\n+', ' ', 'g'), 140),
         '/help?faq='||f.id,
         ts_rank(f.search_tsv, (SELECT tsq FROM query))
  FROM help_faqs f, query
  WHERE (SELECT tsq FROM query) IS NOT NULL 
    AND f.search_tsv @@ (SELECT tsq FROM query)
  ORDER BY rank DESC NULLS LAST
  LIMIT limit_count;
$$;