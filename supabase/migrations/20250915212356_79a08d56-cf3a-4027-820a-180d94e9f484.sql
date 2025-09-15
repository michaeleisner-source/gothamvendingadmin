-- Create ticket SLA policies table
create table if not exists public.ticket_sla_policies (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  priority text not null check (priority in ('low','normal','high','urgent')),
  minutes_to_ack integer not null check (minutes_to_ack >= 0),
  minutes_to_resolve integer not null check (minutes_to_resolve >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, priority, active)
);

-- Enable RLS on ticket_sla_policies
alter table public.ticket_sla_policies enable row level security;

-- Create RLS policy for ticket_sla_policies
create policy "ticket_sla_policies_all" on public.ticket_sla_policies
  for all using (is_org_member(org_id))
  with check (org_id = current_org());

-- Set org_id trigger for ticket_sla_policies
create trigger set_org_id_ticket_sla_policies
  before insert on public.ticket_sla_policies
  for each row execute function public.set_org_id();

-- Add updated_at trigger for ticket_sla_policies
create trigger update_ticket_sla_policies_updated_at
  before update on public.ticket_sla_policies
  for each row execute function public.update_updated_at_column();

-- Insert default SLA policies for each organization
insert into public.ticket_sla_policies (org_id, priority, minutes_to_ack, minutes_to_resolve, active)
select o.id, v.priority, v.minutes_to_ack, v.minutes_to_resolve, v.active
from public.organizations o
cross join (values
  ('low',    480, 2880, true),  -- 8h ack, 2d resolve
  ('normal', 240, 1440, true),  -- 4h, 1d
  ('high',   120,  720, true),  -- 2h, 12h
  ('urgent',  30,  240, true)   -- 30m, 4h
) as v(priority, minutes_to_ack, minutes_to_resolve, active)
where not exists (
  select 1 from public.ticket_sla_policies tsp 
  where tsp.org_id = o.id and tsp.priority = v.priority
);