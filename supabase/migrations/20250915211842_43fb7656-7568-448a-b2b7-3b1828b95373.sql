-- Create inventory transactions table for tracking inventory changes
create table if not exists public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  location_id uuid references public.locations(id) on delete set null,
  machine_id uuid references public.machines(id) on delete set null,
  slot_id uuid references public.machine_slots(id) on delete set null,
  qty_change integer not null,           -- negative for pulls, positive for adds
  reason text not null,                  -- 'restock' | 'parts' | 'adjustment' | etc.
  ref_type text,                         -- 'ticket' | 'restock' | 'po' | etc.
  ref_id uuid,                           -- id of linked record (e.g., tickets.id)
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.inventory_transactions enable row level security;

-- Create RLS policy
create policy "inventory_transactions_all" on public.inventory_transactions
  for all using (is_org_member(org_id))
  with check (org_id = current_org());

-- Create indexes for performance
create index if not exists idx_inv_txn_org on public.inventory_transactions(org_id);
create index if not exists idx_inv_txn_when on public.inventory_transactions(occurred_at);
create index if not exists idx_inv_txn_reason on public.inventory_transactions(reason);
create index if not exists idx_inv_txn_refs on public.inventory_transactions(ref_type, ref_id);
create index if not exists idx_inv_txn_product on public.inventory_transactions(product_id);
create index if not exists idx_inv_txn_machine on public.inventory_transactions(machine_id);

-- Set org_id trigger
create trigger set_org_id_inventory_transactions
  before insert on public.inventory_transactions
  for each row execute function public.set_org_id();