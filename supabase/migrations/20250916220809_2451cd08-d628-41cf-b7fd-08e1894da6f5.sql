-- Create QA storage bucket for test reports
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'qa',
  'qa',
  true,
  10485760, -- 10MB limit
  ARRAY['application/json', 'text/plain']
);

-- Create RLS policies for QA bucket
CREATE POLICY "Anyone can view QA reports"
ON storage.objects FOR SELECT
USING (bucket_id = 'qa');

CREATE POLICY "Authenticated users can upload QA reports"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'qa' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can update QA reports"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'qa' 
  AND auth.uid() IS NOT NULL
);

-- Create policy for anonymous uploads (for bookmarklet usage)
CREATE POLICY "Anonymous QA report uploads allowed"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'qa' 
  AND name LIKE 'reports/%'
  AND (storage.extension(name) = 'json')
);