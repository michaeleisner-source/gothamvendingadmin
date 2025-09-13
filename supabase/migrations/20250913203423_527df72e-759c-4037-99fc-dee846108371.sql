-- Enable uuid generator
create extension if not exists "pgcrypto";

-- ORGANIZATIONS / PROFILES / MEMBERSHIPS
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete restrict,
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists memberships (
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  primary key (org_id, user_id)
);

-- HELPER: current user's org
create or replace function current_org() returns uuid
language sql stable
as $$
  select org_id from profiles where id = auth.uid()
$$;

-- HELPER: org membership check for RLS
create or replace function is_org_member(row_org uuid) returns boolean
language sql stable
as $$
  select exists(
    select 1 from memberships m
    where m.org_id = row_org and m.user_id = auth.uid()
  )
$$;

-- HELPER: auto-fill org_id on insert (we'll attach triggers in a later step)
create or replace function set_org_id() returns trigger
language plpgsql
as $$
begin
  if new.org_id is null then
    new.org_id := current_org();
  end if;
  return new;
end;
$$;

-- BOOTSTRAP: create an org for the current user if they don't have one yet
create or replace function bootstrap_org_for_me(p_org_name text default 'Gotham Vending')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_uid uuid := auth.uid();
begin
  -- If profile already exists, return its org
  select org_id into v_org from profiles where id = v_uid;
  if v_org is not null then
    return v_org;
  end if;

  -- Create org
  insert into organizations (name) values (p_org_name) returning id into v_org;

  -- Create profile + membership
  insert into profiles (id, org_id, full_name) values (v_uid, v_org, null);
  insert into memberships (org_id, user_id, role) values (v_org, v_uid, 'owner');

  return v_org;
end;
$$;

-- Limit who can execute the bootstrap function
revoke all on function bootstrap_org_for_me(text) from public;
grant execute on function bootstrap_org_for_me(text) to authenticated;