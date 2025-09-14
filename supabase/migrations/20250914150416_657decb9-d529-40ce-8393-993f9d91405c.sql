-- Help Center & HelpBot Database Schema
-- Extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Core KB tables
-- Categories keep articles organized by workflow areas
CREATE TABLE IF NOT EXISTS help_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  sort_order INT DEFAULT 0
);

-- Articles contain markdown content; steps are optional structured guidance
CREATE TABLE IF NOT EXISTS help_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES help_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  body_md TEXT NOT NULL,
  search_tsv TSVECTOR,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step-by-step guidance for articles
CREATE TABLE IF NOT EXISTS help_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES help_articles(id) ON DELETE CASCADE,
  step_no INT NOT NULL,
  content_md TEXT NOT NULL
);

-- Optional short Q&A entries
CREATE TABLE IF NOT EXISTS help_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer_md TEXT NOT NULL,
  search_tsv TSVECTOR
);

-- Indexes + triggers for FTS
CREATE INDEX IF NOT EXISTS idx_help_articles_tsv ON help_articles USING gin (search_tsv);

CREATE OR REPLACE FUNCTION trg_help_articles_tsv() 
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_tsv := to_tsvector('simple', unaccent(coalesce(NEW.title,'')||' '||coalesce(NEW.body_md,'')));
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS help_articles_tsv ON help_articles;
CREATE TRIGGER help_articles_tsv BEFORE INSERT OR UPDATE ON help_articles
FOR EACH ROW EXECUTE PROCEDURE trg_help_articles_tsv();

CREATE INDEX IF NOT EXISTS idx_help_faqs_tsv ON help_faqs USING gin (search_tsv);

CREATE OR REPLACE FUNCTION trg_help_faqs_tsv() 
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_tsv := to_tsvector('simple', unaccent(coalesce(NEW.question,'')||' '||coalesce(NEW.answer_md,'')));
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS help_faqs_tsv ON help_faqs;
CREATE TRIGGER help_faqs_tsv BEFORE INSERT OR UPDATE ON help_faqs
FOR EACH ROW EXECUTE PROCEDURE trg_help_faqs_tsv();

-- Unified KB search RPC
CREATE OR REPLACE FUNCTION search_help(q TEXT, limit_count INT DEFAULT 12)
RETURNS TABLE (
  source TEXT,
  id UUID,
  title TEXT,
  snippet TEXT,
  url TEXT,
  rank REAL
) LANGUAGE sql STABLE AS $$
  WITH query AS (SELECT websearch_to_tsquery('simple', unaccent(q)) AS tsq)
  SELECT 'article'::TEXT, a.id, a.title,
         left(regexp_replace(a.body_md, E'\n+', ' ', 'g'), 140) AS snippet,
         '/help/article/'||a.id AS url,
         ts_rank(a.search_tsv, (SELECT tsq FROM query)) AS rank
  FROM help_articles a, query
  WHERE a.search_tsv @@ (SELECT tsq FROM query)
  UNION ALL
  SELECT 'faq', f.id, f.question,
         left(regexp_replace(f.answer_md, E'\n+', ' ', 'g'), 140),
         '/help?faq='||f.id,
         ts_rank(f.search_tsv, (SELECT tsq FROM query))
  FROM help_faqs f, query
  WHERE f.search_tsv @@ (SELECT tsq FROM query)
  ORDER BY rank DESC NULLS LAST
  LIMIT limit_count;
$$;

-- RLS policies (public read access for help content)
ALTER TABLE help_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "help_categories_read" ON help_categories FOR SELECT USING (true);
CREATE POLICY "help_articles_read" ON help_articles FOR SELECT USING (true);
CREATE POLICY "help_steps_read" ON help_steps FOR SELECT USING (true);
CREATE POLICY "help_faqs_read" ON help_faqs FOR SELECT USING (true);

-- Seed data
INSERT INTO help_categories(name, slug, sort_order) VALUES
('Workflow', 'workflow', 1),
('Pipeline', 'pipeline', 2),
('Machines', 'machines', 3),
('Supply & Stock', 'supply', 4),
('Sales & Finance', 'finance', 5),
('Logistics & Support', 'logistics', 6),
('Admin & Reports', 'admin', 7)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO help_articles(category_id, title, slug, body_md) VALUES
((SELECT id FROM help_categories WHERE slug='workflow'), 'Workflow Overview', 'workflow-overview', '# Workflow Overview

Use this sequence daily: Dashboard → Prospects → Locations → Machines → Slots → Inventory → Picklists → Restock → Sales → Reports.

## Daily Checklist
1. Check dashboard for alerts and metrics
2. Review new prospects and convert qualified leads
3. Verify machine status and slot assignments
4. Process restocking needs
5. Record sales transactions
6. Generate performance reports'),

((SELECT id FROM help_categories WHERE slug='pipeline'), 'Convert Prospect to Location', 'convert-prospect', '# Converting Prospects to Locations

Follow these steps to convert a qualified prospect into an active location:

## Prerequisites
- Prospect must be qualified and approved
- Contact information verified
- Site survey completed

## Conversion Process
1. Open **Prospects** page
2. Select the prospect record
3. Click **"Convert to Location"** button
4. Fill in required location details
5. Set commission model and rates
6. Assign location type and traffic estimates'),

((SELECT id FROM help_categories WHERE slug='machines'), 'Set Up a New Machine', 'setup-machine', '# Machine Setup Guide

Complete machine setup from installation to operation:

## Initial Setup
1. Navigate to `/machines` and create new machine record
2. Assign to location and set basic information
3. Configure telemetry and connectivity settings

## Slot Configuration
1. Go to `/slots` or machine detail page
2. Generate slot layout (rows x columns)
3. Assign products to each slot
4. Set capacity and restock thresholds

## Testing
- Test payment processing
- Verify telemetry connection
- Confirm product dispensing'),

((SELECT id FROM help_categories WHERE slug='supply'), 'Restock a Machine', 'restock-machine', '# Machine Restocking Process

Keep your machines fully stocked with this systematic approach:

## Preparation
1. Generate picklist from `/picklists`
2. Gather products and supplies
3. Travel to machine location

## Restocking Steps
1. Open `/restock` page
2. Start new restock session
3. Log previous quantities for each slot
4. Add new products and record quantities
5. Complete session and update inventory'),

((SELECT id FROM help_categories WHERE slug='finance'), 'Configure Card Processor Fees', 'processor-fees', '# Payment Processor Configuration

Set up and manage payment processing fees:

## Adding a Processor
1. Navigate to `/finance/processors`
2. Click **"Add Processor"**
3. Enter processor details and fee structure
4. Set default rates (percentage and fixed fees)

## Machine Mapping
1. Map processor to specific machines
2. Override default fees if needed
3. Fees automatically apply to cost analysis and reports')

ON CONFLICT (slug) DO NOTHING;

-- Add step-by-step guidance
INSERT INTO help_steps(article_id, step_no, content_md) VALUES
((SELECT id FROM help_articles WHERE slug='workflow-overview'), 1, 'Open **Dashboard** and confirm there are no critical alerts or low-stock warnings.'),
((SELECT id FROM help_articles WHERE slug='workflow-overview'), 2, 'Check **Prospects** for new leads that need qualification or conversion.'),
((SELECT id FROM help_articles WHERE slug='workflow-overview'), 3, 'Verify **Machines** status and **Slots** are properly configured for today''s operations.'),

((SELECT id FROM help_articles WHERE slug='convert-prospect'), 1, 'Navigate to the **Prospects** page and locate the qualified prospect.'),
((SELECT id FROM help_articles WHERE slug='convert-prospect'), 2, 'Click the prospect to open details, then click **"Convert to Location"**.'),
((SELECT id FROM help_articles WHERE slug='convert-prospect'), 3, 'Fill in location details: name, address, contact information.'),
((SELECT id FROM help_articles WHERE slug='convert-prospect'), 4, 'Set commission model and percentage rates for the location.'),
((SELECT id FROM help_articles WHERE slug='convert-prospect'), 5, 'Save the new location and verify it appears in the locations list.'),

((SELECT id FROM help_articles WHERE slug='setup-machine'), 1, 'Go to `/machines` and click **"Add Machine"** to create the machine record.'),
((SELECT id FROM help_articles WHERE slug='setup-machine'), 2, 'Assign the machine to a location and enter basic details (name, status, etc).'),
((SELECT id FROM help_articles WHERE slug='setup-machine'), 3, 'Configure telemetry settings in the machine setup section.'),
((SELECT id FROM help_articles WHERE slug='setup-machine'), 4, 'Navigate to slot configuration and generate the slot layout.'),
((SELECT id FROM help_articles WHERE slug='setup-machine'), 5, 'Assign products to each slot with appropriate quantities and thresholds.')

ON CONFLICT DO NOTHING;