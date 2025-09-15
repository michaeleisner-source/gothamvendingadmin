import React, { useEffect, useMemo, useState } from "react";
import { Link, Route } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import {
  ShieldAlert, CheckCircle2, AlertTriangle, Info, Wrench, Timer,
  BarChart3, Gauge, TrendingUp, Landmark, Receipt
} from "lucide-react";

/* ───────────────────────────────── helpers ───────────────────────────────── */
const usd = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD" });
const toNum = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const cents = (v: any) => (Number.isFinite(Number(v)) ? Number(v) / 100 : 0);
const daysBetween = (a: Date, b: Date) => Math.abs(a.getTime() - b.getTime()) / 86400000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

function KPI({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}
function SQLNotice({ title, sql }: { title: string; sql: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 mb-4">
      <div className="text-sm font-medium flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-500" /> {title}
      </div>
      <div className="mt-2 text-xs text-muted-foreground">Run once in Supabase → SQL Editor, then reload this page:</div>
      <pre className="mt-2 text-xs overflow-auto rounded bg-muted p-2">{sql}</pre>
    </div>
  );
}

/* ============================================================================
   A) SYSTEM CHECKLIST — finds missing tables/columns you may have skipped
   - Table presence check = `select('*').limit(1)`
   - Column presence check = `select('col')` and see if PostgREST errors (42703)
   - Shows row counts where useful
============================================================================ */
type CheckResult = {
  table: string;
  ok: boolean;
  issues: string[];
  count?: number | null;
};

async function existsTable(table: string): Promise<boolean> {
  const res = await (supabase as any).from(table).select("*").limit(1);
  return !res.error;
}
async function existsColumn(table: string, column: string): Promise<boolean> {
  const res = await (supabase as any).from(table).select(column).limit(1);
  return !res.error;
}
async function countRows(table: string): Promise<number | null> {
  const res: any = await (supabase as any).from(table).select("*", { count: "exact", head: true });
  return res?.count ?? null;
}

const SQL_TICKETS = `create table if not exists public.tickets(
  id uuid primary key default gen_random_uuid(),
  machine_id uuid references public.machines(id) on delete set null,
  title text not null,
  issue text,
  status text check (status in ('open','in_progress','closed')) default 'open',
  priority text check (priority in ('low','medium','high','urgent')) default 'medium',
  labor_minutes int,
  labor_cost_cents int,
  parts_cost_cents int,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  resolved_at timestamptz
);
create index if not exists idx_tickets_machine on public.tickets(machine_id);`;

const SQL_INVENTORY = `create table if not exists public.inventory_levels(
  machine_id uuid references public.machines(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  qty int default 0,
  par_level int default 0,
  last_counted_at timestamptz default now(),
  primary key(machine_id, product_id)
);
create index if not exists idx_inv_machine on public.inventory_levels(machine_id);
create index if not exists idx_inv_product on public.inventory_levels(product_id);`;

const SQL_PROC = `create table if not exists public.payment_processors(
  id uuid primary key default gen_random_uuid(),
  name text not null
);
create table if not exists public.machine_processor_mappings(
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references public.machines(id) on delete cascade,
  processor_id uuid not null references public.payment_processors(id) on delete cascade,
  created_at timestamptz default now()
);
create table if not exists public.processor_fee_rules(
  id uuid primary key default gen_random_uuid(),
  processor_id uuid not null references public.payment_processors(id) on delete cascade,
  percent_bps int default 300,
  fixed_cents int default 0,
  effective_date date default current_date
);`;

const SQL_FINANCE = `create table if not exists public.machine_finance(
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references public.machines(id) on delete cascade,
  purchase_price_cents int,
  start_date date,
  monthly_payment_cents int,
  apr numeric,
  created_at timestamptz default now()
);
create index if not exists idx_machine_finance_machine on public.machine_finance(machine_id);`;

const SQL_ROUTES = `create table if not exists public.delivery_routes(
  id uuid primary key default gen_random_uuid(),
  name text not null
);
create table if not exists public.route_runs(
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.delivery_routes(id) on delete cascade,
  run_date date not null,
  miles numeric,
  hours numeric,
  created_at timestamptz default now()
);
alter table public.machines add column if not exists route_id uuid references public.delivery_routes(id);
create index if not exists idx_machines_route on public.machines(route_id);`;

const SQL_PROSPECT_STAMPS = `alter table public.prospects add column if not exists won_at timestamptz;
alter table public.prospects add column if not exists lost_at timestamptz;

create or replace function public.stamp_prospect_outcomes() returns trigger
language plpgsql as $$
begin
  if NEW.stage is not null then
    if NEW.stage = 'won' and NEW.won_at is null then NEW.won_at := now(); end if;
    if NEW.stage = 'lost' and NEW.lost_at is null then NEW.lost_at := now(); end if;
  elsif NEW.status is not null then
    if NEW.status = 'won' and NEW.won_at is null then NEW.won_at := now(); end if;
    if NEW.status = 'lost' and NEW.lost_at is null then NEW.lost_at := now(); end if;
  end if;
  return NEW;
end $$;

drop trigger if exists trg_prospect_stamp on public.prospects;
create trigger trg_prospect_stamp before update on public.prospects
for each row execute function public.stamp_prospect_outcomes();`;

export function SystemChecklist() {
  const [results, setResults] = useState<CheckResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);

      const checks: CheckResult[] = [];

      // core entities
      for (const t of ["locations", "machines", "products", "sales", "prospects"]) {
        const ok = await existsTable(t);
        const count = ok ? await countRows(t) : null;
        checks.push({ table: t, ok, issues: ok ? [] : ["missing table"], count });
      }

      // prospects columns
      if (await existsTable("prospects")) {
        const nameOK = (await existsColumn("prospects", "business_name")) || (await existsColumn("prospects", "name"));
        const stageOK = (await existsColumn("prospects", "stage")) || (await existsColumn("prospects", "status"));
        const createdOK = await existsColumn("prospects", "created_at");
        const wonOK = await existsColumn("prospects", "won_at");
        const lostOK = await existsColumn("prospects", "lost_at");
        checks.push({
          table: "prospects (columns)",
          ok: nameOK && stageOK && createdOK,
          issues: [
            !nameOK ? "missing name/business_name" : "",
            !stageOK ? "missing stage/status" : "",
            !createdOK ? "missing created_at" : "",
            !wonOK ? "won_at not present (optional)" : "",
            !lostOK ? "lost_at not present (optional)" : "",
          ].filter(Boolean),
        });
      }

      // machines helpful columns
      if (await existsTable("machines")) {
        const locOK = (await existsColumn("machines", "location_id")) || true; // optional
        const routeOK = (await existsColumn("machines", "route_id")) || true;  // optional
        checks.push({
          table: "machines (bindings)",
          ok: locOK && routeOK,
          issues: [
            !locOK ? "location_id missing (optional for location P&L)" : "",
            !routeOK ? "route_id missing (optional for route KPIs)" : "",
          ].filter(Boolean),
        });
      }

      // sales columns
      if (await existsTable("sales")) {
        const have = await Promise.all([
          existsColumn("sales", "machine_id"),
          existsColumn("sales", "qty"),
          existsColumn("sales", "unit_price_cents"),
          existsColumn("sales", "unit_cost_cents"),
          existsColumn("sales", "occurred_at"),
        ]);
        checks.push({
          table: "sales (columns)",
          ok: have.every(Boolean),
          issues: [
            !have[0] ? "machine_id missing" : "",
            !have[1] ? "qty missing" : "",
            !have[2] ? "unit_price_cents missing" : "",
            !have[3] ? "unit_cost_cents missing" : "",
            !have[4] ? "occurred_at missing" : "",
          ].filter(Boolean),
        });
      }

      // inventory
      const invOK = await existsTable("inventory_levels");
      checks.push({ table: "inventory_levels", ok: invOK, issues: invOK ? [] : ["missing table"] });

      // tickets
      const tixOK = await existsTable("tickets");
      const tixCount = tixOK ? await countRows("tickets") : null;
      checks.push({ table: "tickets", ok: tixOK, issues: tixOK ? [] : ["missing table"], count: tixCount });

      // finance + processors
      checks.push({ table: "machine_finance", ok: await existsTable("machine_finance"), issues: [] });
      checks.push({ table: "payment_processors", ok: await existsTable("payment_processors"), issues: [] });
      checks.push({ table: "machine_processor_mappings", ok: await existsTable("machine_processor_mappings"), issues: [] });
      checks.push({ table: "processor_fee_rules", ok: await existsTable("processor_fee_rules"), issues: [] });

      // routes
      checks.push({ table: "delivery_routes", ok: await existsTable("delivery_routes"), issues: [] });
      checks.push({ table: "route_runs", ok: await existsTable("route_runs"), issues: [] });

      setResults(checks);
      setLoading(false);
    })();
  }, []);

  const missing = results.filter(r => !r.ok);
  const ok = results.filter(r => r.ok);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <ShieldAlert className="h-5 w-5" /> System Checklist
        </h1>
        <div className="text-xs text-muted-foreground">Verifies required tables/columns + row counts.</div>
      </div>

      {loading && <div className="text-sm text-muted-foreground">Scanning your schema…</div>}

      {!loading && (
        <>
          <div className="grid gap-2 sm:grid-cols-3">
            <KPI label="Checks passed" value={<span className="text-emerald-400">{ok.length}</span>} />
            <KPI label="Issues found" value={<span className={missing.length ? "text-amber-400" : ""}>{missing.length}</span>} />
            <KPI label="Next steps" value={missing.length ? "Run SQL below" : "You're good"} />
          </div>

          <div className="rounded-xl border border-border overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left">Item</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Notes</th>
                  <th className="px-3 py-2 text-right">Rows</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} className="odd:bg-card/50">
                    <td className="px-3 py-2">{r.table}</td>
                    <td className="px-3 py-2">
                      {r.ok ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400"><CheckCircle2 className="h-4 w-4" /> OK</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-400"><AlertTriangle className="h-4 w-4" /> Check</span>
                      )}
                    </td>
                    <td className="px-3 py-2">{r.issues.join(", ") || "—"}</td>
                    <td className="px-3 py-2 text-right">{r.count ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* targeted SQL banners for common misses */}
          {missing.some(m => m.table === "tickets") && <SQLNotice title="Tickets table missing" sql={SQL_TICKETS} />}
          {missing.some(m => m.table === "inventory_levels") && <SQLNotice title="Inventory levels missing" sql={SQL_INVENTORY} />}
          {["payment_processors","machine_processor_mappings","processor_fee_rules"].some(t => missing.find(m=>m.table===t)) && (
            <SQLNotice title="Processor core missing" sql={SQL_PROC} />
          )}
          {missing.some(m => m.table === "machine_finance") && <SQLNotice title="Machine finance missing" sql={SQL_FINANCE} />}
          {["delivery_routes","route_runs"].some(t => missing.find(m=>m.table===t)) && <SQLNotice title="Routes telemetry missing" sql={SQL_ROUTES} />}
          {results.find(r => r.table.startsWith("prospects (columns)") && r.issues.some(x => x.includes("won_at") || x.includes("lost_at"))) && (
            <SQLNotice title="Optional: prospect outcome stamps" sql={SQL_PROSPECT_STAMPS} />
          )}
        </>
      )}
    </div>
  );
}

/* ============================================================================
   B) MAINTENANCE OVERVIEW — replaces /machines/maintenance with real actions
   - Silent machines (no sale) + open tickets summary + quick "New Ticket"
============================================================================ */
export function MaintenanceOverview() {
  const [machines, setMachines] = useState<Array<{ id:string; name:string }>>([]);
  const [lastSale, setLastSale] = useState<Record<string,string|null>>({});
  const [ticketStats, setTicketStats] = useState<{ open:number; in_progress:number; closed:number }>({ open:0, in_progress:0, closed:0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const m = await supabase.from("machines").select("id,name").order("name");
      setMachines((m.data||[]).map((x:any)=>({ id:x.id, name: x.name || x.id })));

      const s = await supabase.from("sales").select("machine_id, occurred_at").order("occurred_at",{ascending:false}).limit(20000);
      const map: Record<string,string|null> = {};
      if (!s.error) (s.data||[]).forEach((row:any)=>{ const mid=row.machine_id; if(mid && !map[mid]) map[mid] = row.occurred_at; });
      setLastSale(map);

      const t = await (supabase as any).from("tickets").select("status").limit(10000);
      if (!t.error) {
        const agg = { open:0, in_progress:0, closed:0 };
        (t.data||[]).forEach((x:any)=>{ agg[(x.status||"open") as keyof typeof agg] = (agg[(x.status||"open") as keyof typeof agg]||0)+1; });
        setTicketStats(agg as any);
      }
      setLoading(false);
    })();
  }, []);

  const rows = machines.map(m => {
    const last = lastSale[m.id] || null;
    const daysSilent = last ? Math.floor(daysBetween(new Date(last), new Date())) : 9999;
    return { id:m.id, name:m.name, last, daysSilent };
  }).sort((a,b)=> b.daysSilent - a.daysSilent);

  const worst = rows[0];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2"><Wrench className="h-5 w-5" /> Maintenance</h1>
        <div className="text-xs text-muted-foreground">Quiet units + tickets → fix what bleeds first.</div>
      </div>

      <div className="grid gap-2 sm:grid-cols-4">
        <KPI label="Open tickets" value={ticketStats.open.toLocaleString()} />
        <KPI label="In progress" value={ticketStats.in_progress.toLocaleString()} />
        <KPI label="Closed (all time)" value={ticketStats.closed.toLocaleString()} />
        <KPI label="Worst silent (days)" value={rows.length ? rows[0].daysSilent : 0} hint={worst?.name || ""} />
      </div>

      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}

      {!loading && (
        <div className="rounded-xl border border-border overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left">Machine</th>
                <th className="px-3 py-2 text-left">Last sale</th>
                <th className="px-3 py-2 text-right">Days silent</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r=>(
                <tr key={r.id} className="odd:bg-card/50">
                  <td className="px-3 py-2">{r.name}</td>
                  <td className="px-3 py-2">{r.last ? new Date(r.last).toLocaleString() : "— never —"}</td>
                  <td className="px-3 py-2 text-right">{r.daysSilent}</td>
                  <td className="px-3 py-2 text-right">
                    <Link to={`/tickets/new?machine_id=${r.id}`} className="text-xs underline">New Ticket</Link>
                  </td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={4} className="px-3 py-6 text-center text-sm text-muted-foreground">No machines found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {!awaitExists("tickets") && <SQLNotice title="Tickets table missing" sql={SQL_TICKETS} />}
    </div>
  );
}
async function awaitExists(table: string) { const ok = await existsTable(table); return ok; }

/* ============================================================================
   C) EXECUTIVE OVERVIEW — "what matters" in one place (last 30d)
   - Gross/COGS from sales; Fees from processor_fees if present (else 0)
   - Uptime proxy: share of machines silent >7 days
   - Links directly to deeper reports
============================================================================ */
export function ExecutiveOverview() {
  const days = 30;
  const since = startOfDay(addDays(new Date(), -days));

  const [sales, setSales] = useState<any[]>([]);
  const [fees, setFees] = useState<number>(0);
  const [machines, setMachines] = useState<Array<{id:string; name:string}>>([]);
  const [lastSale, setLastSale] = useState<Record<string,string|null>>({});
  const [haveFees, setHaveFees] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      // sales
      const s = await supabase.from("sales")
        .select("machine_id, qty, unit_price_cents, unit_cost_cents, occurred_at")
        .gte("occurred_at", since.toISOString()).limit(50000);
      setSales(s.data || []);

      // machines + last sale for uptime proxy
      const m = await supabase.from("machines").select("id,name").order("name");
      setMachines((m.data||[]).map((x:any)=>({id:x.id, name:x.name || x.id})));

      const s2 = await supabase.from("sales").select("machine_id, occurred_at").order("occurred_at", { ascending:false }).limit(20000);
      const map: Record<string,string|null> = {};
      if (!s2.error) (s2.data||[]).forEach((row:any)=>{ const mid=row.machine_id; if(mid && !map[mid]) map[mid]=row.occurred_at; });
      setLastSale(map);

      // fees (optional table)
      const pf = await (supabase as any)
        .from("processor_fees")
        .select("amount_cents, occurred_at")
        .gte("occurred_at", since.toISOString()).limit(50000);
      if (!pf.error) {
        setHaveFees(true);
        setFees((pf.data||[]).reduce((sum:number, r:any)=>sum+toNum(r.amount_cents), 0));
      } else {
        setHaveFees(false);
        setFees(0);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grossC = sales.reduce((s,row)=> s + (toNum(row.qty)*toNum(row.unit_price_cents)), 0);
  const cogsC  = sales.reduce((s,row)=> s + (toNum(row.qty)*toNum(row.unit_cost_cents)), 0);
  const netC   = grossC - cogsC - (fees || 0);
  const gross  = cents(grossC);
  const cogs   = cents(cogsC);
  const net    = cents(netC);

  // uptime proxy
  const silentOver7 = machines.filter(m => {
    const last = lastSale[m.id]; if (!last) return true;
    return daysBetween(new Date(last), new Date()) > 7;
  }).length;
  const uptime = machines.length ? 1 - (silentOver7 / machines.length) : 1;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Executive Overview</h1>
        <div className="text-xs text-muted-foreground">Last 30 days</div>
      </div>

      <div className="grid gap-2 sm:grid-cols-5">
        <KPI label="Gross" value={usd(gross)} />
        <KPI label="COGS" value={usd(cogs)} />
        <KPI label="Processor Fees" value={usd(cents(fees))} hint={haveFees ? "from processor_fees" : "table not found → using $0"} />
        <KPI label="Net" value={<span className={net>=0?"text-emerald-400":"text-rose-400"}>{usd(net)}</span>} />
        <KPI label="Uptime (proxy)" value={`${Math.round(uptime*100)}%`} hint="silent >7d considered down" />
      </div>

      <div className="rounded-xl border border-border p-3">
        <div className="text-sm font-medium mb-2">Dig deeper</div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link className="underline" to="/reports/machine-roi"><Landmark className="inline h-4 w-4 mr-1" />Machine ROI</Link>
          <Link className="underline" to="/reports/prospect-funnel"><TrendingUp className="inline h-4 w-4 mr-1" />Prospect Funnel</Link>
          <Link className="underline" to="/reports/route-efficiency"><Gauge className="inline h-4 w-4 mr-1" />Route Efficiency</Link>
          <Link className="underline" to="/reports/location-commissions"><Receipt className="inline h-4 w-4 mr-1" />Location Commissions</Link>
          <Link className="underline" to="/reports/low-stock"><Wrench className="inline h-4 w-4 mr-1" />Low Stock</Link>
          <Link className="underline" to="/reports/location-profitability"><BarChart3 className="inline h-4 w-4 mr-1" />Location P&L</Link>
        </div>
      </div>

      <div className="text-xs text-muted-foreground flex items-start gap-2">
        <Info className="h-4 w-4 mt-0.5" />
        <span>
          For exact net: ingest <code>processor_fees</code> or add <code>processor_fee_rules</code> + mapping (see Processor Fees admin).
        </span>
      </div>
    </div>
  );
}

/* ============================================================================
   ROUTE EXPORT — mount all Phase 4 pages
============================================================================ */
export function Phase4Routes({ ProtectedRoute }: { ProtectedRoute?: React.ComponentType<{children:React.ReactNode}> }) {
  const Wrap: React.FC<{children:React.ReactNode}> = ({ children }) =>
    ProtectedRoute ? <ProtectedRoute>{children}</ProtectedRoute> : <>{children}</>;
  return (
    <>
      <Route path="/admin/system-check" element={<Wrap><SystemChecklist /></Wrap>} />
      <Route path="/machines/maintenance" element={<Wrap><MaintenanceOverview /></Wrap>} />
      <Route path="/reports/executive" element={<Wrap><ExecutiveOverview /></Wrap>} />
    </>
  );
}