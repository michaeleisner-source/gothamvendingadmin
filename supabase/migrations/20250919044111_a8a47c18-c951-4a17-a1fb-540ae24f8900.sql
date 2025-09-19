-- Fix RLS policy for system_backups table
DROP POLICY IF EXISTS "System backups admin access" ON public.system_backups;

-- Create proper RLS policies for system_backups
CREATE POLICY "System backups read access" 
ON public.system_backups 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "System backups insert access" 
ON public.system_backups 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "System backups update access" 
ON public.system_backups 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Fix search path for the update function to be secure
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;