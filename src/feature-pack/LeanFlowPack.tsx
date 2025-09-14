import React, { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Route, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useDemo } from "@/lib/demo";
import {
  Factory, LayoutDashboard, Clipboard, Building2, MapPinned, Settings2, ClipboardList, ClipboardCheck,
  Box, Package2, Truck, Route as RouteIcon, DollarSign, TrendingUp, BarChart3, ShieldAlert, Trash2,
  UserCircle2, ChevronDown, Wrench, TicketCheck, Plus, AlertTriangle, CheckCircle2, Timer, BarChart4
} from "lucide-react";

/* ---------------------------- shared utils ---------------------------- */
const centsToDollars = (c?: number | null) => (Number.isFinite(Number(c)) ? Number(c) / 100 : 0);
const dollars = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD" });
const daysAgo = (d?: string | null) => (d ? Math.floor((Date.now() - new Date(d).getTime()) / 86400000) : null);

// Helper for tickets table (since it doesn't exist in schema yet)
const ticketsTable = () => (supabase as any).from("tickets");

/* =====================================================================
   PART A — LEAN SIDEBAR (flow clarity)
===================================================================== */
export function SidebarLean() {
  const { isDemo } = useDemo();
  const [open, setOpen] = useState<Record<string, boolean>>({
    pipeline: true, sites: true, machines: true, stock: true, ops: true, finance: true, reports: true, admin: true,
  });
  const toggle = (k: string) => setOpen(s => ({ ...s, [k]: !s[k] }));

  return (
    <aside className="h-screen w-72 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col">
      <div className="px-4 py-4 border-b border-sidebar-border flex items-center gap-2">
        <div className="size-8 rounded-xl bg-sidebar-accent grid place-items-center"><Factory className="size-4"/></div>
        <div className="font-semibold">Gotham Vending</div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <Section>Dashboard</Section>
        <Item to="/" icon={LayoutDashboard}>Dashboard</Item>

        <Group label="Pipeline (Leads)" icon={MapPinned} open={open.pipeline} onClick={() => toggle("pipeline")}>
          <Item to="/prospects" icon={Clipboard}>Prospects</Item>
        </Group>

        <Group label="Sites & Contracts" icon={Building2} open={open.sites} onClick={() => toggle("sites")}>
          <Item to="/locations" icon={Building2}>Locations</Item>
        </Group>

        <Group label="Machines" icon={Settings2} open={open.machines} onClick={() => toggle("machines")}>
          <Item to="/machines" icon={Factory}>Machines</Item>
          <Item to="/setup" icon={ClipboardCheck}>Machine Setup</Item>
          <Item to="/slots" icon={ClipboardList}>Slot Planner</Item>
          <Item to="/machines/maintenance" icon={Wrench}>Maintenance</Item>
          <Child to="/machines/finance-admin">Finance Admin</Child>
        </Group>

        <Group label="Supply & Stock" icon={Box} open={open.stock} onClick={() => toggle("stock")}>
          <Item to="/products" icon={Package2}>Products</Item>
          <Item to="/suppliers" icon={ClipboardList}>Suppliers</Item>
          <Child to="/purchase-orders">Purchase Orders</Child>
          <Child to="/purchase-orders/new">New Purchase Order</Child>
          <Item to="/inventory" icon={ClipboardList}>Inventory</Item>
          <Item to="/restock" icon={ClipboardCheck}>Restock</Item>
          <Item to="/picklists" icon={Clipboard}>Picklists</Item>
        </Group>

        <Group label="Operations" icon={RouteIcon} open={open.ops} onClick={() => toggle("ops")}>
          <Item to="/delivery-routes" icon={Truck}>Delivery Routes</Item>
          <Item to="/tickets" icon={TicketCheck}>Tickets</Item>
          <Item to="/staff" icon={UserCircle2}>Staff</Item>
        </Group>

        <Group label="Finance" icon={DollarSign} open={open.finance} onClick={() => toggle("finance")}>
          <Item to="/sales" icon={DollarSign}>Sales Entry</Item>
          <Item to="/finance/processors" icon={ClipboardList}>Payment Processors</Item>
          <Child to="/finance/processors/statements">Processor Statements</Child>
          <Child to="/finance/processor-fees">Processor Fees Admin</Child>
          <Item to="/finance/commissions" icon={PercentIcon}>Commissions</Item>
          <Item to="/finance/expenses" icon={ClipboardList}>Expenses</Item>
          <Item to="/finance/loans" icon={ClipboardList}>Loans</Item>
          <Item to="/cost-analysis" icon={TrendingUp}>Cost Analysis</Item>
        </Group>

        <Group label="Reports" icon={BarChart3} open={open.reports} onClick={() => toggle("reports")}>
          <Item to="/reports" icon={BarChart3}>Profit Reports</Item>
          <Child to="/reports/sales-summary">Sales Summary (7d)</Child>
          <Child to="/reports/silent-machines">Silent Machines</Child>
          <Child to="/reports/machine-roi">Machine ROI</Child>
          <Child to="/reports/prospect-funnel">Prospect Funnel</Child>
          <Child to="/reports/route-efficiency">Route Efficiency</Child>
          <Child to="/inventory/overview">Inventory Overview</Child>
          <Child to="/inventory/alerts">Low Stock Alerts</Child>
          <Child to="/reports/low-stock">Low Stock Report</Child>
          <Child to="/reports/location-profitability">Location Profitability</Child>
          <Child to="/reports/sku-velocity">SKU Velocity</Child>
        </Group>

        <Group label="Oversight & Admin" icon={ShieldAlert} open={open.admin} onClick={() => toggle("admin")}>
          <Item to="/admin/system-check" icon={ShieldAlert}>System Check</Item>
          <Item to="/reports/executive" icon={BarChart3}>Executive Overview</Item>
          <Item to="/audit" icon={ShieldAlert}>Audit</Item>
          <Item to="/deletion-logs" icon={Trash2}>Deletion Logs</Item>
          <Item to="/account" icon={UserCircle2}>Account</Item>
          {isDemo && <Item to="/qa" icon={ClipboardList}>QA Launcher</Item>}
        </Group>
      </nav>

      <div className="px-4 py-3 border-t border-sidebar-border text-xs text-muted-foreground">v3.1 · Lean Flow (schema-aware)</div>
    </aside>
  );
}
function Section({ children }: { children: React.ReactNode }) {
  return <div className="px-2 pt-2 pb-1 text-[11px] uppercase tracking-wider text-muted-foreground">{children}</div>;
}
function Group({ label, icon: Icon, open, onClick, children }: any) {
  return (
    <div className="mt-3">
      <button className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-sidebar-accent" onClick={onClick} aria-expanded={open}>
        <span className="flex items-center gap-2"><Icon className="size-4"/><span className="text-sm font-medium">{label}</span></span>
        <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : "rotate-0"}`} />
      </button>
      <div className={`overflow-hidden transition-[max-height,opacity] duration-300 ${open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="mt-1 ml-1 border-l border-sidebar-border pl-3">{children}</div>
      </div>
    </div>
  );
}
function Item({ to, icon: Icon, children }: any) {
  return (
    <NavLink to={to} className={({ isActive }) =>
      `flex items-center gap-2 px-2 py-2 rounded-lg text-sm hover:bg-sidebar-accent ${isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : ""}`}>
      <Icon className="size-4"/><span>{children}</span>
    </NavLink>
  );
}
function Child({ to, children }: any) {
  return (
    <NavLink to={to} className={({ isActive }) =>
      `block text-sm px-2 py-1.5 rounded-md hover:bg-sidebar-accent ${isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : ""}`}>
      {children}
    </NavLink>
  );
}
function PercentIcon(props:any){ return <svg {...props} viewBox="0 0 24 24" className={"size-4"}><path fill="currentColor" d="M18.5 5.5a2.5 2.5 0 1 1-5.001-.001A2.5 2.5 0 0 1 18.5 5.5m-8 13a2.5 2.5 0 1 1-5.001-.001A2.5 2.5 0 0 1 10.5 18.5M5 19L19 5"/></svg>}

/* =====================================================================
   PART B — PROSPECTS KANBAN (auto-maps your schema)
   Route: /prospects
===================================================================== */
type ProspectRow = Record<string, any>;

export function ProspectsBoard() {
  const navigate = useNavigate();
  const [tableOk, setTableOk] = useState<boolean | null>(null);
  const [rows, setRows] = useState<ProspectRow[]>([]);
  const [creating, setCreating] = useState(false);

  // Derive display + write targets from any row we got back
  const stages = ["new","contacted","site_visit","proposal","won","lost"] as const;

  useEffect(() => {
    (async () => {
      // Probe table
      const probe = await supabase.from("prospects").select("*").limit(1);
      setTableOk(!probe.error);
      if (probe.error) return;

      // Load all columns (no hardcoded list, stays future-proof)
      const { data } = await supabase.from("prospects").select("*").order("created_at", { ascending: false }).limit(2000);
      setRows(data || []);
    })();
  }, []);

  const colMap = useMemo(() => {
    // Decide which column names to use based on the actual data (first row wins)
    const sample = rows[0] || {};
    const pick = (...names: string[]) => names.find(n => n in sample) || names[0]; // fall back to first
    return {
      name: pick("business_name", "name", "company_name"),
      stage: pick("stage", "status"),
      contact_email: pick("contact_email", "email"),
      contact_phone: pick("contact_phone", "phone"),
      potential_machines: pick("potential_machines"),
      est_daily_traffic: pick("est_daily_traffic"),
      notes: pick("notes"),
      created_at: pick("created_at"),
      source: pick("source"),
    };
  }, [rows]);

  function get(r: ProspectRow, k: keyof typeof colMap) {
    const col = colMap[k] as string; return (col && r[col] != null) ? r[col] : null;
  }

  async function createQuick() {
    setCreating(true);
    // Try inserting using either 'business_name' or 'name'
    const payloadA: any = { [colMap.name || "business_name"]: "New prospect", [colMap.stage || "stage"]: "new" };
    let res = await (supabase.from("prospects") as any).insert(payloadA).select("id").single();
    if (res.error && colMap.name !== "business_name") {
      // Retry alternate
      const alt = colMap.name === "name" ? "business_name" : "name";
      res = await (supabase.from("prospects") as any).insert({ [alt]: "New prospect", [colMap.stage || "stage"]: "new" }).select("id").single();
    }
    setCreating(false);
    if (!res.error && res.data?.id) navigate(`/prospects?id=${res.data.id}`);
  }

  async function move(id: string, newStage: string) {
    // Try to update whichever stage column exists; fallback to the other
    const tryUpdate = async (col: string) =>
      await supabase.from("prospects").update({ [col]: newStage, updated_at: new Date().toISOString() }).eq("id", id);

    let { error } = await tryUpdate(colMap.stage || "stage");
    if (error && (colMap.stage === "stage")) { ({ error } = await tryUpdate("status")); }
    if (!error) {
      setRows(r => r.map(x => x.id === id ? { ...x, [colMap.stage || "stage"]: newStage, status: newStage } : x));
    } else {
      alert(`Could not move prospect: ${error.message}`);
    }
  }

  async function convertToLocation(p: ProspectRow) {
    const displayName = p[colMap.name] || "New Location";
    const payload: any = { name: displayName, notes: `Converted from prospect ${p.id}` };
    const res = await supabase.from("locations").insert(payload).select("id").single();
    if (res.error) { alert(`Failed to create location: ${res.error.message}`); return; }
    await move(p.id, "won");
    navigate(`/locations/${res.data.id}`);
  }

  const byStage: Record<string, ProspectRow[]> = useMemo(() => {
    const m: Record<string, ProspectRow[]> = {}; stages.forEach(s => m[s] = []);
    rows.forEach(r => {
      const s = (get(r, "stage") as string) || "new";
      if (m[s]) m[s].push(r);
      else (m["new"].push(r));
    });
    return m;
  }, [rows, colMap]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2"><MapPinned className="h-5 w-5"/> Prospects</h1>
        <button onClick={createQuick} className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          <Plus className="h-4 w-4"/> New Prospect
        </button>
      </div>

      {tableOk === false && (
        <SQLNotice title="Prospects table missing" sql={`-- Example schema (safe to run once)
create table if not exists public.prospects (
  id uuid primary key default gen_random_uuid(),
  business_name text, name text,
  contact_email text, contact_phone text,
  source text,
  potential_machines int,
  est_daily_traffic int,
  stage text check (stage in ('new','contacted','site_visit','proposal','won','lost')) default 'new',
  status text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_prospects_stage on public.prospects(stage);`} />
      )}

      <div className="grid lg:grid-cols-6 md:grid-cols-3 gap-3">
        {stages.map(stage => (
          <div key={stage} className="rounded-xl border border-border bg-card p-2">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">{stage.replace("_"," ")}</div>
            <div className="space-y-2">
              {byStage[stage].map(p => {
                const displayName = (p[colMap.name] ?? "") || "—";
                const contact = (p[colMap.contact_phone] || p[colMap.contact_email] || "no contact");
                const pm = p[colMap.potential_machines] ?? "—";
                const traffic = p[colMap.est_daily_traffic] ?? "—";
                return (
                  <div key={p.id} className="rounded-lg border border-border bg-card p-2">
                    <div className="text-sm font-medium">{displayName}</div>
                    <div className="text-xs text-muted-foreground">{p[colMap.source] || "—"} · {contact}</div>
                    <div className="text-xs text-muted-foreground">Potential: {pm} machines · Traffic: {traffic}</div>
                    <div className="flex gap-2 mt-2">
                      <select className="rounded bg-background border border-border text-xs px-2 py-1"
                        value={(p[colMap.stage] as string) || "new"} onChange={(e) => move(p.id, e.target.value)}>
                        {stages.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {stage !== "won" && stage !== "lost" && (
                        <button onClick={() => convertToLocation(p)} className="text-xs px-2 py-1 rounded border border-border hover:bg-muted">Convert → Location</button>
                      )}
                    </div>
                  </div>
                );
              })}
              {!byStage[stage].length && <div className="text-xs text-muted-foreground">—</div>}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border p-3">
        <div className="text-sm font-medium flex items-center gap-2"><BarChart4 className="h-4 w-4"/> Funnel snapshot</div>
        <div className="text-xs text-muted-foreground mt-1">Move cards to see conversion; export later for deep analytics.</div>
      </div>
    </div>
  );
}

/* =====================================================================
   PART C — SILENT MACHINES (uptime/attention report)
   Route: /reports/silent-machines
===================================================================== */
export function SilentMachinesReport() {
  const [machines, setMachines] = useState<Array<{id:string; name?:string|null}>>([]);
  const [lastSale, setLastSale] = useState<Record<string,string|null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const m = await supabase.from("machines").select("id, name").order("name",{ascending:true});
      if (!m.error) setMachines(m.data || []);

      const s = await supabase
        .from("sales")
        .select("machine_id, occurred_at")
        .order("occurred_at",{ascending:false})
        .limit(10000);
      const map: Record<string,string|null> = {};
      if (!s.error) {
        (s.data || []).forEach((row:any) => {
          const mid = row.machine_id;
          if (mid && !map[mid]) map[mid] = row.occurred_at;
        });
      }
      setLastSale(map);
      setLoading(false);
    })();
  }, []);

  const rows = machines.map(m => {
    const last = lastSale[m.id] || null;
    const days = daysAgo(last);
    return { id: m.id, name: m.name || m.id, last_sale_at: last, days_silent: days ?? 9999 };
  }).sort((a,b) => b.days_silent - a.days_silent);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2"><Timer className="h-5 w-5"/> Silent Machines</h1>
        <div className="text-xs text-muted-foreground">Based on latest recorded sale; create a ticket if a unit is quiet too long.</div>
      </div>

      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}

      {!loading && (
        <div className="rounded-xl border border-border overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left">Machine</th>
                <th className="px-3 py-2 text-left">Last Sale</th>
                <th className="px-3 py-2 text-right">Days Silent</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="odd:bg-card/50">
                  <td className="px-3 py-2">{r.name}</td>
                  <td className="px-3 py-2">{r.last_sale_at ? new Date(r.last_sale_at).toLocaleString() : "— never —"}</td>
                  <td className="px-3 py-2 text-right font-medium">{r.days_silent}</td>
                  <td className="px-3 py-2 text-right">
                    <Link to={`/tickets/new?machine_id=${r.id}`} className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs hover:bg-muted">
                      <Plus className="h-4 w-4"/> New Ticket
                    </Link>
                  </td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={4} className="px-3 py-6 text-center text-sm text-muted-foreground">No machines.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* =====================================================================
   PART D — MACHINE TICKETS PANEL + /tickets/new
===================================================================== */
const TICKETS_SQL = `-- Tickets table (safe to run once)
create table if not exists public.tickets (
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

export function MachineTicketsPanel() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tableOk, setTableOk] = useState<boolean | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const probe = await ticketsTable().select("id").limit(1);
      setTableOk(!probe.error);
      setLoading(true);
      if (!probe.error) {
        const { data } = await ticketsTable().select("*").eq("machine_id", id).order("created_at",{ascending:false});
        setRows(data || []);
      }
      setLoading(false);
    })();
  }, [id]);

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold flex items-center gap-2"><TicketCheck className="h-4 w-4"/> Tickets for machine</div>
        <button onClick={() => navigate(`/tickets/new?machine_id=${id}`)} className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs hover:bg-muted">
          <Plus className="h-4 w-4"/> New Ticket
        </button>
      </div>

      {tableOk === false && <SQLNotice title="Tickets table missing" sql={TICKETS_SQL}/>}

      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}

      {!loading && tableOk && (
        <div className="rounded-xl border border-border overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left">Title</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Priority</th>
                <th className="px-3 py-2 text-right">Labor</th>
                <th className="px-3 py-2 text-right">Parts</th>
                <th className="px-3 py-2 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="odd:bg-card/50">
                  <td className="px-3 py-2">{r.title}</td>
                  <td className="px-3 py-2">{(r.status || "open").toUpperCase()}</td>
                  <td className="px-3 py-2">{(r.priority || "medium").toUpperCase()}</td>
                  <td className="px-3 py-2 text-right">{dollars(centsToDollars(r.labor_cost_cents))}</td>
                  <td className="px-3 py-2 text-right">{dollars(centsToDollars(r.parts_cost_cents))}</td>
                  <td className="px-3 py-2 text-xs">{r.created_at ? new Date(r.created_at).toLocaleString() : "—"}</td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={6} className="px-3 py-6 text-center text-sm text-muted-foreground">No tickets yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function NewTicketPage() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const prefillMachine = sp.get("machine_id") || "";
  const [tableOk, setTableOk] = useState<boolean | null>(null);
  const [machines, setMachines] = useState<Array<{id:string; name?:string|null}>>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string|null>(null);
  const [ok, setOk] = useState<string|null>(null);

  const [f, setF] = useState<any>({ machine_id: prefillMachine, title: "", issue: "", status: "open", priority: "medium" });

  useEffect(() => {
    (async () => {
      const probe = await ticketsTable().select("id").limit(1);
      setTableOk(!probe.error);
      const m = await supabase.from("machines").select("id,name").order("name",{ascending:true});
      if (!m.error) setMachines(m.data || []);
    })();
  }, []);

  async function save() {
    setErr(null); setOk(null); setSaving(true);
    if (!f.title?.trim()) { setErr("Title required"); setSaving(false); return; }
    const { error } = await ticketsTable().insert({
      machine_id: f.machine_id || null, title: f.title, issue: f.issue || null, status: f.status, priority: f.priority
    });
    setSaving(false);
    if (error) { setErr(error.message); return; }
    setOk("Ticket created");
    setTimeout(() => navigate("/machines/maintenance"), 500);
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2"><TicketCheck className="h-5 w-5"/> New Ticket</h1>
        <Link to="/machines/maintenance" className="rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted">Back</Link>
      </div>
      {tableOk === false && <SQLNotice title="Tickets table missing" sql={TICKETS_SQL}/>}

      <div className="rounded-xl border border-border bg-card p-3 space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="text-muted-foreground">Machine</span>
            <select value={f.machine_id || ""} onChange={(e)=>setF({...f, machine_id: e.target.value || ""})}
              className="w-full mt-1 rounded-md bg-background border border-border px-3 py-2 text-sm">
              <option value="">— Not specified —</option>
              {machines.map(m => <option key={m.id} value={m.id}>{m.name || m.id}</option>)}
            </select>
          </label>
          <label className="text-sm">
            <span className="text-muted-foreground">Priority</span>
            <select value={f.priority} onChange={(e)=>setF({...f, priority:e.target.value})}
              className="w-full mt-1 rounded-md bg-background border border-border px-3 py-2 text-sm">
              <option value="urgent">Urgent</option><option value="high">High</option>
              <option value="medium">Medium</option><option value="low">Low</option>
            </select>
          </label>
          <label className="text-sm md:col-span-2">
            <span className="text-muted-foreground">Title *</span>
            <input value={f.title} onChange={(e)=>setF({...f, title:e.target.value})}
              className="w-full mt-1 rounded-md bg-background border border-border px-3 py-2 text-sm" />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="text-muted-foreground">Details</span>
            <textarea rows={4} value={f.issue || ""} onChange={(e)=>setF({...f, issue:e.target.value})}
              className="w-full mt-1 rounded-md bg-background border border-border px-3 py-2 text-sm" />
          </label>
        </div>
        <div className="flex gap-2">
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted">
            <Plus className="h-4 w-4"/> Create Ticket
          </button>
          {ok && <span className="text-sm text-emerald-500 inline-flex items-center gap-1"><CheckCircle2 className="h-4 w-4"/>{ok}</span>}
          {err && <span className="text-sm text-rose-400 inline-flex items-center gap-1"><AlertTriangle className="h-4 w-4"/>{err}</span>}
        </div>
      </div>
    </div>
  );
}

/* ------------------------ tiny helpers ------------------------ */
function SQLNotice({ title, sql }: { title: string; sql: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 mb-3">
      <div className="text-sm font-medium flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500"/>{title}</div>
      <div className="mt-2 text-xs text-muted-foreground">Run this once in Supabase → SQL Editor, then reload:</div>
      <pre className="mt-2 text-xs overflow-auto rounded bg-muted p-2">{sql}</pre>
    </div>
  );
}

/* =====================================================================
   PART E — ROUTES MOUNTER (unchanged)
===================================================================== */
export function LeanFlowRoutes({ ProtectedRoute }: { ProtectedRoute?: React.ComponentType<{children:React.ReactNode}> }) {
  const Wrap: React.FC<{children:React.ReactNode}> = ({ children }) =>
    ProtectedRoute ? <ProtectedRoute>{children}</ProtectedRoute> : <>{children}</>;

  return (
    <>
      <Route path="/prospects" element={<Wrap><ProspectsBoard/></Wrap>} />
      <Route path="/reports/silent-machines" element={<Wrap><SilentMachinesReport/></Wrap>} />
      <Route path="/machines/:id/tickets" element={<Wrap><MachineTicketsPanel/></Wrap>} />
      <Route path="/tickets/new" element={<Wrap><NewTicketPage/></Wrap>} />
    </>
  );
}