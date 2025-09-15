-- Add missing columns to tickets table only
alter table public.tickets add column if not exists org_id uuid;
alter table public.tickets add column if not exists location_id uuid;
alter table public.tickets add column if not exists machine_id uuid;
alter table public.tickets add column if not exists description text;
alter table public.tickets add column if not exists category text;
alter table public.tickets add column if not exists title text;
alter table public.tickets add column if not exists status text default 'open';
alter table public.tickets add column if not exists priority text default 'normal';
alter table public.tickets add column if not exists created_at timestamptz not null default now();
alter table public.tickets add column if not exists updated_at timestamptz;
alter table public.tickets add column if not exists acknowledged_at timestamptz;
alter table public.tickets add column if not exists first_response_at timestamptz;
alter table public.tickets add column if not exists closed_at timestamptz;
alter table public.tickets add column if not exists due_at timestamptz;

-- Add foreign key constraints if they don't exist
do $$
begin
  if not exists (select 1 from information_schema.table_constraints where constraint_name = 'tickets_org_id_fkey') then
    alter table public.tickets add constraint tickets_org_id_fkey foreign key (org_id) references public.organizations(id) on delete cascade;
  end if;
  if not exists (select 1 from information_schema.table_constraints where constraint_name = 'tickets_location_id_fkey') then
    alter table public.tickets add constraint tickets_location_id_fkey foreign key (location_id) references public.locations(id) on delete set null;
  end if;
  if not exists (select 1 from information_schema.table_constraints where constraint_name = 'tickets_machine_id_fkey') then
    alter table public.tickets add constraint tickets_machine_id_fkey foreign key (machine_id) references public.machines(id) on delete set null;
  end if;
end$$;

-- Add check constraint for priority if it doesn't exist
do $$
begin
  if not exists (select 1 from information_schema.table_constraints where constraint_name = 'tickets_priority_check') then
    alter table public.tickets add constraint tickets_priority_check check (priority in ('low','normal','high','urgent'));
  end if;
end$$;

-- Create indexes for performance
create index if not exists idx_tickets_status_due on public.tickets(status, due_at);
create index if not exists idx_tickets_loc on public.tickets(location_id);
create index if not exists idx_tickets_created on public.tickets(created_at);
create index if not exists idx_tickets_closed on public.tickets(closed_at);
create index if not exists idx_tickets_priority on public.tickets(priority);
create index if not exists idx_tickets_org on public.tickets(org_id);