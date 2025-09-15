-- PRODUCTS: ensure cost_cents exists (used for COGS)
alter table public.products add column if not exists cost_cents integer check (cost_cents >= 0);

-- SALES: tender split for card vs cash (optional but useful)
alter table public.sales add column if not exists payment_method text check (payment_method in ('card','cash')) default 'card';

-- MACHINES FINANCE: minimal shape
create table if not exists public.machine_finance (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default current_org(),
  machine_id uuid not null references public.machines(id) on delete cascade,
  monthly_payment_cents integer not null default 0,
  purchase_price_cents integer not null default 0,
  apr_bps integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(machine_id)
);

-- Enable RLS and create policies for machine_finance
alter table public.machine_finance enable row level security;
create policy "machine_finance_all" on public.machine_finance for all using (is_org_member(org_id)) with check (org_id = current_org());

-- PROCESSORS + MAPPINGS (for fee calc & reconciliation)
create table if not exists public.payment_processors (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default current_org(),
  name text not null,
  default_percent_fee numeric default 2.9,
  default_fixed_fee numeric default 0.30,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS and create policies for payment_processors
alter table public.payment_processors enable row level security;
create policy "payment_processors_all" on public.payment_processors for all using (is_org_member(org_id)) with check (org_id = current_org());

create table if not exists public.machine_processor_mappings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default current_org(),
  machine_id uuid not null references public.machines(id) on delete cascade,
  processor_id uuid not null references public.payment_processors(id) on delete cascade,
  percent_fee numeric,
  fixed_fee numeric,
  monthly_fee numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (machine_id, processor_id)
);

-- Enable RLS and create policies for machine_processor_mappings
alter table public.machine_processor_mappings enable row level security;
create policy "machine_processor_mappings_all" on public.machine_processor_mappings for all using (is_org_member(org_id)) with check (org_id = current_org());

-- STATEMENT TOTALS for reconciliation
create table if not exists public.processor_settlements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default current_org(),
  processor_id uuid not null references public.payment_processors(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  gross_cents integer not null default 0,
  fees_cents integer not null default 0,
  net_cents integer not null default 0,
  payout_date date,
  reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint processor_settlements_valid check (period_end >= period_start)
);

-- Enable RLS and create policies for processor_settlements
alter table public.processor_settlements enable row level security;
create policy "processor_settlements_all" on public.processor_settlements for all using (is_org_member(org_id)) with check (org_id = current_org());

create index if not exists idx_proc_settle_proc on public.processor_settlements(processor_id);
create index if not exists idx_proc_settle_period on public.processor_settlements(period_start, period_end);

-- INVENTORY TRANSACTIONS (for parts usage)
create table if not exists public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default current_org(),
  product_id uuid not null references public.products(id) on delete restrict,
  location_id uuid references public.locations(id) on delete set null,
  machine_id uuid references public.machines(id) on delete set null,
  qty_change integer not null,
  reason text not null,          -- 'restock'|'parts'|'adjustment' etc.
  ref_type text,                 -- 'ticket'|'restock'|'po' etc.
  ref_id uuid,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Enable RLS and create policies for inventory_transactions
alter table public.inventory_transactions enable row level security;
create policy "inventory_transactions_all" on public.inventory_transactions for all using (is_org_member(org_id)) with check (org_id = current_org());

create index if not exists idx_inv_txn_when on public.inventory_transactions(occurred_at);
create index if not exists idx_inv_txn_reason on public.inventory_transactions(reason);
create index if not exists idx_inv_txn_refs on public.inventory_transactions(ref_type, ref_id);

-- TICKETS + SLA POLICY (for Support SLAs)
alter table public.tickets add column if not exists title text;
alter table public.tickets add column if not exists status text default 'open';
alter table public.tickets add column if not exists priority text check (priority in ('low','normal','high','urgent')) default 'normal';
alter table public.tickets add column if not exists acknowledged_at timestamptz;
alter table public.tickets add column if not exists first_response_at timestamptz;
alter table public.tickets add column if not exists closed_at timestamptz;
alter table public.tickets add column if not exists due_at timestamptz;

create table if not exists public.ticket_sla_policies (
  id uuid primary key default gen_random_uuid(),
  priority text not null check (priority in ('low','normal','high','urgent')),
  minutes_to_ack integer not null check (minutes_to_ack >= 0),
  minutes_to_resolve integer not null check (minutes_to_resolve >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS for ticket_sla_policies (global policies, readable by all org members)
alter table public.ticket_sla_policies enable row level security;
create policy "ticket_sla_policies_read" on public.ticket_sla_policies for select using (auth.uid() is not null);
create policy "ticket_sla_policies_manage" on public.ticket_sla_policies for all using (auth.uid() is not null) with check (true);

-- Insert default SLA policies
insert into public.ticket_sla_policies (priority, minutes_to_ack, minutes_to_resolve, active)
select * from (values
  ('low',    480, 2880, true),
  ('normal', 240, 1440, true),
  ('high',   120,  720, true),
  ('urgent',  30,  240, true)
) as v(priority, minutes_to_ack, minutes_to_resolve, active)
where not exists (select 1 from public.ticket_sla_policies);