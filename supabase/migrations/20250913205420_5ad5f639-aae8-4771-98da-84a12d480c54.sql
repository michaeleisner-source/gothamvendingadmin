-- Pre-reqs: current_org(), is_org_member(uuid), set_org_id() already exist
create extension if not exists "pgcrypto";

-- 1) Planogram tables (org-scoped)
create table if not exists machine_slots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  machine_id uuid not null references machines(id) on delete cascade,
  label text not null,               -- e.g., A1, B3
  row int not null,
  col int not null,
  capacity int,
  unique(machine_id, label)
);

create table if not exists slot_assignments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  slot_id uuid not null references machine_slots(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  max_qty int,
  restock_threshold int,
  unique(slot_id)
);

-- RLS + triggers
alter table machine_slots enable row level security;
alter table slot_assignments enable row level security;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname='set_org_id_before_insert_machine_slots') then
    create trigger set_org_id_before_insert_machine_slots
    before insert on machine_slots
    for each row execute function set_org_id();
  end if;

  if not exists (select 1 from pg_trigger where tgname='set_org_id_before_insert_slot_assignments') then
    create trigger set_org_id_before_insert_slot_assignments
    before insert on slot_assignments
    for each row execute function set_org_id();
  end if;

  if not exists (select 1 from pg_policies where tablename='machine_slots' and policyname='machine_slots_all') then
    create policy machine_slots_all on machine_slots
      for all using (is_org_member(org_id)) with check (org_id = current_org());
  end if;

  if not exists (select 1 from pg_policies where tablename='slot_assignments' and policyname='slot_assignments_all') then
    create policy slot_assignments_all on slot_assignments
      for all using (is_org_member(org_id)) with check (org_id = current_org());
  end if;
end$$;

-- 2) RPCs (SECURITY DEFINER) to keep UI thin & cheap

-- Generate slots rows x cols for a machine, labels A1..B1.. etc.
create or replace function generate_machine_slots(p_machine_id uuid, p_rows int, p_cols int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare r int; c int; v_label text; v_count int := 0; v_org uuid;
begin
  select org_id into v_org from machines where id = p_machine_id;
  if v_org is null or not is_org_member(v_org) then
    raise exception 'Machine not found or not authorized';
  end if;
  if p_rows < 1 or p_cols < 1 then
    raise exception 'rows and cols must be >= 1';
  end if;

  delete from machine_slots where machine_id = p_machine_id;

  for r in 1..p_rows loop
    for c in 1..p_cols loop
      v_label := chr(64 + r) || c::text; -- A1, A2, ...
      insert into machine_slots (org_id, machine_id, label, row, col, capacity)
      values (v_org, p_machine_id, v_label, r, c, null);
      v_count := v_count + 1;
    end loop;
  end loop;

  return v_count;
end$$;

revoke all on function generate_machine_slots(uuid,int,int) from public;
grant execute on function generate_machine_slots(uuid,int,int) to authenticated;

-- Bulk upsert assignments: [{label, product_id, max_qty, restock_threshold}]
create or replace function upsert_slot_assignments(p_machine_id uuid, p_assignments jsonb)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare v_org uuid; v_count int := 0;
begin
  select org_id into v_org from machines where id = p_machine_id;
  if v_org is null or not is_org_member(v_org) then
    raise exception 'Machine not found or not authorized';
  end if;

  if p_assignments is null or jsonb_typeof(p_assignments) <> 'array' then
    raise exception 'Assignments must be a JSON array';
  end if;

  -- validate products belong to org and labels present
  if exists (
    select 1
    from jsonb_array_elements(p_assignments) a
    left join products p on p.id = (a->>'product_id')::uuid
    where (a->>'label') is null
       or p.id is null
       or not is_org_member(p.org_id)
  ) then
    raise exception 'Invalid assignment(s): missing label or product not in org';
  end if;

  with payload as (
    select
      a->>'label' as label,
      (a->>'product_id')::uuid as product_id,
      nullif(a->>'max_qty','')::int as max_qty,
      nullif(a->>'restock_threshold','')::int as restock_threshold
    from jsonb_array_elements(p_assignments) a
  ), slots as (
    select ms.id as slot_id, ms.label
    from machine_slots ms
    where ms.machine_id = p_machine_id
  )
  insert into slot_assignments (org_id, slot_id, product_id, max_qty, restock_threshold)
  select v_org, s.slot_id, p.product_id, p.max_qty, p.restock_threshold
  from payload p
  join slots s using (label)
  on conflict (slot_id) do update
    set product_id = excluded.product_id,
        max_qty = excluded.max_qty,
        restock_threshold = excluded.restock_threshold;

  get diagnostics v_count = row_count;
  return v_count;
end$$;

revoke all on function upsert_slot_assignments(uuid,jsonb) from public;
grant execute on function upsert_slot_assignments(uuid,jsonb) to authenticated;