-- Fix security issues: Set search_path for functions and move extensions

-- 1. Fix search_path for help functions
CREATE OR REPLACE FUNCTION trg_help_articles_tsv() 
RETURNS TRIGGER LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.search_tsv := to_tsvector('simple', unaccent(coalesce(NEW.title,'')||' '||coalesce(NEW.body_md,'')));
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION trg_help_faqs_tsv() 
RETURNS TRIGGER LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.search_tsv := to_tsvector('simple', unaccent(coalesce(NEW.question,'')||' '||coalesce(NEW.answer_md,'')));
  RETURN NEW;
END; $$;

-- Fix search_help function with proper search_path
CREATE OR REPLACE FUNCTION search_help(q TEXT, limit_count INT DEFAULT 12)
RETURNS TABLE (
  source TEXT,
  id UUID,
  title TEXT,
  snippet TEXT,
  url TEXT,
  rank REAL
) LANGUAGE sql STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  -- Extract key words by removing common stop words
  WITH keywords AS (
    SELECT string_to_array(
      lower(
        regexp_replace(
          regexp_replace(q, '[^\w\s]', ' ', 'g'), -- Remove punctuation
          '\b(how|do|i|a|an|the|to|is|are|can|will|would|should|could|what|when|where|why|with|for|and|or|but|in|on|at|by|of|it|that|this|from|up|out|so|if|no|not|get|go|see|now|way|may|say|each|which|their|said)\b',
          ' ', 'gi'
        )
      ), 
      ' '
    ) as words
  ),
  -- Create search patterns
  search_terms AS (
    SELECT 
      array_to_string(array_agg(word), ' ') as clean_query,
      array_to_string(array_agg(word), ' | ') as or_query
    FROM (
      SELECT trim(word) as word 
      FROM keywords k, unnest(k.words) as word 
      WHERE length(trim(word)) > 2
    ) filtered_words
  )
  -- Search articles with OR logic (any keyword matches)
  SELECT 'article'::TEXT, a.id, a.title,
         left(regexp_replace(a.body_md, E'\n+', ' ', 'g'), 140) AS snippet,
         '/help/article/'||a.id AS url,
         GREATEST(
           ts_rank_cd(a.search_tsv, plainto_tsquery('simple', st.clean_query)),
           ts_rank_cd(a.search_tsv, to_tsquery('simple', st.or_query || ':*'))
         ) AS rank
  FROM help_articles a, search_terms st
  WHERE st.clean_query IS NOT NULL 
    AND st.clean_query != ''
    AND (
      a.search_tsv @@ plainto_tsquery('simple', st.clean_query) OR
      a.search_tsv @@ to_tsquery('simple', st.or_query || ':*') OR
      position(lower(st.clean_query) in lower(a.title || ' ' || a.body_md)) > 0
    )
  
  UNION ALL
  
  -- Search FAQs  
  SELECT 'faq', f.id, f.question,
         left(regexp_replace(f.answer_md, E'\n+', ' ', 'g'), 140),
         '/help?faq='||f.id,
         GREATEST(
           ts_rank_cd(f.search_tsv, plainto_tsquery('simple', st.clean_query)),
           ts_rank_cd(f.search_tsv, to_tsquery('simple', st.or_query || ':*'))
         ) AS rank
  FROM help_faqs f, search_terms st
  WHERE st.clean_query IS NOT NULL 
    AND st.clean_query != ''
    AND (
      f.search_tsv @@ plainto_tsquery('simple', st.clean_query) OR
      f.search_tsv @@ to_tsquery('simple', st.or_query || ':*') OR
      position(lower(st.clean_query) in lower(f.question || ' ' || f.answer_md)) > 0
    )
    
  ORDER BY rank DESC NULLS LAST
  LIMIT limit_count;
$$;