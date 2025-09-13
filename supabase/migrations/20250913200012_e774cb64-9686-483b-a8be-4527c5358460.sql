create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  status text default 'NEW', -- NEW, CONTACTED, FOLLOW-UP, CLOSED
  notes text,
  created_at timestamptz default now()
);