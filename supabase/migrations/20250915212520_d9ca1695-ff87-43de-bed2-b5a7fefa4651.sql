-- Enable RLS on tickets table
alter table public.tickets enable row level security;

-- Create RLS policy for tickets if it doesn't exist
drop policy if exists "tickets_all" on public.tickets;
create policy "tickets_all" on public.tickets
  for all using (is_org_member(org_id))
  with check (org_id = current_org());

-- Set org_id trigger for tickets if it doesn't exist
drop trigger if exists set_org_id_tickets on public.tickets;
create trigger set_org_id_tickets
  before insert on public.tickets
  for each row execute function public.set_org_id();

-- Ensure updated_at trigger exists
drop trigger if exists update_tickets_updated_at on public.tickets;
create trigger update_tickets_updated_at
  before update on public.tickets
  for each row execute function public.update_updated_at_column();