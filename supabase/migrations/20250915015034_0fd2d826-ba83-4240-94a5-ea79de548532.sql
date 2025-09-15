-- Fix Security Definer View issue
-- First, let's check what views exist and recreate any SECURITY DEFINER views properly

-- Drop and recreate v_machine_health view without SECURITY DEFINER
DROP VIEW IF EXISTS public.v_machine_health CASCADE;

CREATE VIEW public.v_machine_health AS
SELECT 
  m.id as machine_id,
  m.name as machine_name,
  m.location_id,
  latest_sales.last_sale_at,
  COALESCE(now() - latest_sales.last_sale_at, INTERVAL '999 days') as since_last_sale,
  CASE 
    WHEN latest_sales.last_sale_at IS NULL OR latest_sales.last_sale_at < now() - INTERVAL '48 hours'
    THEN true
    ELSE false
  END as silent_flag
FROM machines m
LEFT JOIN (
  SELECT 
    machine_id,
    MAX(occurred_at) as last_sale_at
  FROM sales
  GROUP BY machine_id
) latest_sales ON latest_sales.machine_id = m.id;

-- Grant appropriate permissions
GRANT SELECT ON public.v_machine_health TO authenticated;
GRANT SELECT ON public.v_machine_health TO anon;