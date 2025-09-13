-- Enable UUID generator if needed
create extension if not exists "pgcrypto";

-- 1) Location Types (e.g., Apartment Building, Studio, Office, School)
create table if not exists location_types (
  id uuid primary key default gen_random_uuid(),
  name text unique not null
);

-- 2) Prospects: add phone/address/type/traffic fields and allow status CONVERTED
alter table prospects
  add column if not exists contact_phone text,
  add column if not exists address_line1 text,
  add column if not exists address_line2 text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists postal_code text,
  add column if not exists location_type_id uuid references location_types(id) on delete set null,
  add column if not exists traffic_daily_est integer,
  add column if not exists traffic_monthly_est integer;

-- expand allowed statuses by convention (no constraint yet), we'll use 'CONVERTED' later

-- 3) Locations: canonical place where machines live (converted prospects land here)
create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,                    -- business/location display name
  location_type_id uuid references location_types(id) on delete set null,
  contact_name text,
  contact_email text,
  contact_phone text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  traffic_daily_est integer,
  traffic_monthly_est integer,
  from_prospect_id uuid references prospects(id) on delete set null, -- optional backlink
  created_at timestamptz default now()
);

-- 4) Machines: link to locations (if not already)
alter table if exists machines
  add column if not exists location_id uuid references locations(id) on delete set null;

-- 5) Helper function: convert a prospect into a location and mark it CONVERTED
create or replace function convert_prospect_to_location(p_prospect_id uuid)
returns uuid
language plpgsql
as $$
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