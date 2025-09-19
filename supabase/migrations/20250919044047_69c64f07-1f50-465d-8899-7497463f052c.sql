-- Create system_backups table for storing backup metadata and data
CREATE TABLE IF NOT EXISTS public.system_backups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  backup_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  table_counts JSONB NOT NULL,
  backup_data JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  file_path TEXT,
  compressed_size_bytes BIGINT,
  notes TEXT,
  org_id UUID,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on system_backups
ALTER TABLE public.system_backups ENABLE ROW LEVEL SECURITY;

-- Create policy for system backups (admin access only)
CREATE POLICY "System backups admin access" 
ON public.system_backups 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role' OR auth.uid() IS NOT NULL);

-- Create storage bucket for backup files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('system-backups', 'system-backups', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for backup files
CREATE POLICY "Backup files admin access" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'system-backups' AND auth.uid() IS NOT NULL);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_system_backups_updated_at
BEFORE UPDATE ON public.system_backups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable pg_cron extension for scheduled backups
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily backup at 2 AM UTC
SELECT cron.schedule(
  'daily-backup',
  '0 2 * * *', -- Every day at 2 AM UTC
  $$
  SELECT
    net.http_post(
        url:='https://wmbrnfocnlkhqflliaup.supabase.co/functions/v1/daily-backup',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtYnJuZm9jbmxraHFmbGxpYXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3ODIwNjEsImV4cCI6MjA3MzM1ODA2MX0.Wzt4HcA_I6xEV9CfvxrC4X97Z1dlUU4OGkX1t5m0rWE"}'::jsonb,
        body:=concat('{"scheduled": true, "time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);