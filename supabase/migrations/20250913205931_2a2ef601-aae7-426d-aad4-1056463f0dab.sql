-- Pre-reqs: current_org(), is_org_member(uuid), set_org_id()
create extension if not exists "pgcrypto";

-- 1) Restock session tables
create table if not exists restock_sessions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  machine_id uuid not null references machines(id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  note text
);

create table if not exists restock_lines (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  session_id uuid not null references restock_sessions(id) on delete cascade,
  slot_id uuid not null references machine_slots(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  prev_qty int,         -- what was in the slot before restock (as observed)
  added_qty int,        -- how many added during this restock
  new_qty int,          -- resulting qty after restock
  constraint uniq_session_slot unique (session_id, slot_id)
);

-- RLS + triggers
alter table restock_sessions enable row level security;
alter table restock_lines    enable row level security;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname='set_org_id_before_insert_restock_sessions') then
    create trigger set_org_id_before_insert_restock_sessions
    before insert on restock_sessions for each row execute function set_org_id();
  end if;

  if not exists (select 1 from pg_trigger where tgname='set_org_id_before_insert_restock_lines') then
    create trigger set_org_id_before_insert_restock_lines
    before insert on restock_lines for each row execute function set_org_id();
  end if;

  if not exists (select 1 from pg_policies where tablename='restock_sessions' and policyname='restock_sessions_all') then
    create policy restock_sessions_all on restock_sessions
      for all using (is_org_member(org_id)) with check (org_id = current_org());
  end if;

  if not exists (select 1 from pg_policies where tablename='restock_lines' and policyname='restock_lines_all') then
    create policy restock_lines_all on restock_lines
      for all using (is_org_member(org_id)) with check (org_id = current_org());
  end if;
end$$;

-- 2) RPC: start a session for a machine
create or replace function start_restock_session(p_machine_id uuid, p_note text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_org uuid; v_session uuid;
begin
  select org_id into v_org from machines where id = p_machine_id;
  if v_org is null or not is_org_member(v_org) then
    raise exception 'Machine not found or not authorized';
  end if;

  insert into restock_sessions (org_id, machine_id, note)
  values (v_org, p_machine_id, p_note)
  returning id into v_session;

  return v_session;
end$$;

revoke all on function start_restock_session(uuid, text) from public;
grant execute on function start_restock_session(uuid, text) to authenticated;

-- 3) RPC: save lines and optionally complete session
-- p_lines: [{ slot_label, prev_qty, added_qty, new_qty }]
create or replace function save_restock_session(
  p_session_id uuid,
  p_complete boolean,
  p_lines jsonb
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare v_org uuid; v_machine uuid; v_count int := 0;
begin
  -- verify session belongs to caller org
  select rs.org_id, rs.machine_id into v_org, v_machine
  from restock_sessions rs
  where rs.id = p_session_id;

  if v_org is null or not is_org_member(v_org) then
    raise exception 'Session not found or not authorized';
  end if;

  if p_lines is not null and jsonb_typeof(p_lines) = 'array' then
    -- Map slot labels -> slot ids for this machine
    with slots as (
      select id, label from machine_slots where machine_id = v_machine
    ), payload as (
      select
        s.id as slot_id,
        (l->>'prev_qty')::int as prev_qty,
        (l->>'added_qty')::int as added_qty,
        (l->>'new_qty')::int  as new_qty,
        sa.product_id         as product_id
      from jsonb_array_elements(p_lines) l
      join slots s on s.label = l->>'slot_label'
      left join slot_assignments sa on sa.slot_id = s.id
    )
    insert into restock_lines (org_id, session_id, slot_id, product_id, prev_qty, added_qty, new_qty)
    select v_org, p_session_id, slot_id, product_id, prev_qty, added_qty, new_qty
    from payload
    on conflict (session_id, slot_id) do update
      set prev_qty = excluded.prev_qty,
          added_qty = excluded.added_qty,
          new_qty = excluded.new_qty;

    get diagnostics v_count = row_count;
  end if;

  if p_complete then
    update restock_sessions set completed_at = now() where id = p_session_id;
  end if;

  return v_count;
end$$;

revoke all on function save_restock_session(uuid, boolean, jsonb) from public;
grant execute on function save_restock_session(uuid, boolean, jsonb) to authenticated;

-- Helpful indexes
create index if not exists idx_restock_sessions_org_machine on restock_sessions(org_id, machine_id, started_at desc);
create index if not exists idx_restock_lines_session on restock_lines(session_id);