-- Create function to get machine health data
CREATE OR REPLACE FUNCTION get_machine_health_data()
RETURNS TABLE (
  machine_id uuid,
  machine_name text,
  location_id uuid,
  last_sale_at timestamp with time zone,
  since_last_sale interval,
  silent_flag boolean
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    v.machine_id,
    v.machine_name,
    v.location_id,
    v.last_sale_at,
    v.since_last_sale,
    v.silent_flag
  FROM v_machine_health v
  WHERE v.machine_id IN (
    SELECT m.id 
    FROM machines m 
    WHERE is_org_member(m.org_id)
  )
  ORDER BY v.since_last_sale DESC NULLS FIRST;
$$;