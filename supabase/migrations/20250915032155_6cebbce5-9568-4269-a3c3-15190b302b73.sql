-- 1) Contracts table
create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid references public.prospects(id) on delete set null,
  location_id uuid references public.locations(id) on delete cascade,
  contract_number text unique,
  status text not null default 'draft' check (status in ('draft','sent','signed','void')),
  version int not null default 1,
  html text,                 -- stored HTML snapshot (optional)
  pdf_url text,              -- if you later upload a PDF to storage
  signed_at timestamptz,
  created_at timestamptz not null default now()
);

-- 2) Revenue-share fields on locations
alter table public.locations
  add column if not exists commission_model text
    check (commission_model in ('none','percent_gross','flat_month','hybrid'))
    default 'none',
  add column if not exists commission_pct_bps integer default 0,  -- 2500 = 25.00%
  add column if not exists commission_flat_cents integer default 0, -- $/month
  add column if not exists commission_min_cents integer default 0,  -- optional floor
  add column if not exists commission_notes text,
  add column if not exists contract_id uuid references public.contracts(id);

-- 3) Helpful indexes
create index if not exists idx_locations_contract_id on public.locations(contract_id);
create index if not exists idx_contracts_location_id on public.contracts(location_id);
create index if not exists idx_machines_location_id on public.machines(location_id);