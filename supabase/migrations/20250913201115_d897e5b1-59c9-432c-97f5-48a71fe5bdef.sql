-- Fix security issues from previous migration

-- 1) Enable RLS on new tables
ALTER TABLE public.location_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- 2) Create RLS policies for location_types table
CREATE POLICY "location_types_allow_all" 
ON public.location_types 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 3) Create RLS policies for locations table
CREATE POLICY "locations_allow_all" 
ON public.locations 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 4) Fix function search path to be immutable
CREATE OR REPLACE FUNCTION convert_prospect_to_location(p_prospect_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SET search_path = public
AS $$
declare
  new_location_id uuid;
begin
  insert into locations (
    name, location_type_id,
    contact_name, contact_email, contact_phone,
    address_line1, address_line2, city, state, postal_code,
    traffic_daily_est, traffic_monthly_est,
    from_prospect_id
  )
  select
    business_name, location_type_id,
    contact_name, contact_email, contact_phone,
    address_line1, address_line2, city, state, postal_code,
    traffic_daily_est, traffic_monthly_est,
    id
  from prospects
  where id = p_prospect_id
  returning id into new_location_id;

  -- mark the prospect as CONVERTED
  update prospects set status = 'CONVERTED' where id = p_prospect_id;

  return new_location_id;
end
$$;