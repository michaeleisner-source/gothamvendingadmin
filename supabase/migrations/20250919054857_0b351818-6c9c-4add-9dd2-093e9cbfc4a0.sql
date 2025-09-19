-- Create storage policies for contract documents
CREATE POLICY "Users can view their org contracts" ON storage.objects
FOR SELECT USING (
  bucket_id = 'contracts' AND 
  auth.uid() IS NOT NULL AND
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid())
);

CREATE POLICY "Users can upload their org contracts" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'contracts' AND 
  auth.uid() IS NOT NULL AND
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid())
);

CREATE POLICY "Users can update their org contracts" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'contracts' AND 
  auth.uid() IS NOT NULL AND
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid())
);

CREATE POLICY "Users can delete their org contracts" ON storage.objects
FOR DELETE USING (
  bucket_id = 'contracts' AND 
  auth.uid() IS NOT NULL AND
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid())
);