-- Fix search_path for security
create or replace function current_org() returns uuid
language sql stable
security definer
set search_path = public
as $$
  select org_id from profiles where id = auth.uid()
$$;

create or replace function is_org_member(row_org uuid) returns boolean
language sql stable
security definer 
set search_path = public
as $$
  select exists(
    select 1 from memberships m
    where m.org_id = row_org and m.user_id = auth.uid()
  )
$$;

create or replace function set_org_id() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.org_id is null then
    new.org_id := current_org();
  end if;
  return new;
end;
$$;

-- Enable RLS on new tables
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table memberships enable row level security;

-- RLS policies for organizations
create policy "Users can view their organization"
  on organizations for select
  using (id = current_org());

create policy "Organization owners can update their org"
  on organizations for update
  using (
    exists(
      select 1 from memberships m 
      where m.org_id = id 
      and m.user_id = auth.uid() 
      and m.role = 'owner'
    )
  );

-- RLS policies for profiles
create policy "Users can view profiles in their org"
  on profiles for select
  using (org_id = current_org());

create policy "Users can update their own profile"
  on profiles for update
  using (id = auth.uid());

create policy "Users can insert their own profile"
  on profiles for insert
  with check (id = auth.uid());

-- RLS policies for memberships
create policy "Users can view memberships in their org"
  on memberships for select
  using (org_id = current_org());

create policy "Organization owners can manage memberships"
  on memberships for all
  using (
    exists(
      select 1 from memberships m 
      where m.org_id = org_id 
      and m.user_id = auth.uid() 
      and m.role = 'owner'
    )
  );