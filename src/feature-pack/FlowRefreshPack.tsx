import React, { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Route, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useDemo } from "@/lib/demo";
import {
  Factory, LayoutDashboard, Clipboard, Building2, MapPinned, Settings2, ClipboardList, ClipboardCheck,
  Box, Package2, Truck, Route as RouteIcon, DollarSign, TrendingUp, BarChart3, ShieldAlert, Trash2,
  UserCircle2, ChevronDown, Percent, Receipt, Coins, Landmark, Scale, Wrench, TicketCheck, Plus, AlertTriangle, CheckCircle2
} from "lucide-react";

/* ---------------------------- UTILITIES ---------------------------- */
const isNum = (v: any) => Number.isFinite(Number(v));
const num = (v: any) => (isNum(v) ? Number(v) : 0);
const cents = (n?: number | null) => (isNum(n) ? Number(n) / 100 : 0);
const toCents = (dollars: number) => Math.round(dollars * 100);
const fmt = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD" });
const daysBetween = (a: Date, b: Date) => Math.abs(a.getTime() - b.getTime()) / 86400000;
const safeDate = (v?: string | null) => (v ? new Date(v) : undefined);

/* ===================================================================

   PART 1 — REFINED SIDEBAR (clean workflow)

   - Pipeline = Leads only
   - New: Sites & Contracts (houses Locations)
   - Machines area remains machines/setup/slots/maintenance
   - Ops, Finance, Reports, Admin unchanged
   - QA Launcher appears in demo mode

   Use:
     import { SidebarFlowRefresh } from "@/feature-pack/FlowRefreshPack";
     export default SidebarFlowRefresh  // if replacing your Sidebar file

   Or copy the NavGroup/NavItem/NavChild patterns into your existing sidebar.

=================================================================== */

export function SidebarFlowRefresh() {
  const { isDemo } = useDemo();
  const [open, setOpen] = useState<Record<string, boolean>>({
    pipeline: true,
    sites: true,
    machines: true,
    supply: true,
    ops: true,
    finance: true,
    support: true,
    reports: true,
    admin: true,
  });
  const toggle = (key: string) => setOpen((s) => ({ ...s, [key]: !s[key] }));

  return (
    <aside className="h-screen w-72 bg-background border-r border-border flex flex-col">
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-xl bg-muted grid place-items-center">
            <Factory className="size-4" />
          </div>
          <div className="font-semibold tracking-tight">Gotham Vending</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <SectionLabel>Dashboard</SectionLabel>
        <NavItem to="/" icon={LayoutDashboard}>Dashboard</NavItem>

        <SectionLabel>Today</SectionLabel>
        <NavItem to="/ops" icon={LayoutDashboard}>Daily Ops</NavItem>

        <NavGroup label="Pipeline (Leads)" icon={MapPinned} isOpen={open.pipeline} onToggle={() => toggle("pipeline")}>
          <NavItem to="/prospects" icon={Clipboard}>Prospects</NavItem>
          {/* Locations removed from Pipeline to reduce confusion */}
        </NavGroup>

        <NavGroup label="Sites & Contracts" icon={Building2} isOpen={open.sites} onToggle={() => toggle("sites")}>
          <NavItem to="/locations" icon={Building2}>Locations</NavItem>
          {/* (Optional future) Contracts page could live here */}
        </NavGroup>

        <NavGroup label="Machines" icon={Settings2} isOpen={open.machines} onToggle={() => toggle("machines")}>
          <NavItem to="/machines" icon={Factory}>Machines</NavItem>
          <NavItem to="/setup" icon={ClipboardCheck}>Machine Setup</NavItem>
          <NavItem to="/slots" icon={ClipboardList}>Slot Planner</NavItem>
          <NavItem to="/machines/maintenance" icon={Wrench}>Maintenance</NavItem>
        </NavGroup>

        <NavGroup label="Supply & Stock" icon={Box} isOpen={open.supply} onToggle={() => toggle("supply")}>
          <NavItem to="/products" icon={Package2}>Products</NavItem>
          <NavItem to="/suppliers" icon={ClipboardList}>Suppliers</NavItem>
          <NavChild to="/purchase-orders">Purchase Orders</NavChild>
          <NavChild to="/purchase-orders/new">New Purchase Order</NavChild>
          <NavItem to="/inventory" icon={ClipboardList}>Inventory</NavItem>
          <NavItem to="/restock" icon={ClipboardCheck}>Restock</NavItem>
          <NavItem to="/picklists" icon={Clipboard}>Picklists</NavItem>
        </NavGroup>

        <NavGroup label="Operations" icon={RouteIcon} isOpen={open.ops} onToggle={() => toggle("ops")}>
          <NavItem to="/delivery-routes" icon={Truck}>Delivery Routes</NavItem>
          <NavItem to="/tickets" icon={TicketCheck}>Tickets</NavItem>
          <NavItem to="/staff" icon={UserCircle2}>Staff</NavItem>
        </NavGroup>

        <NavGroup label="Finance" icon={DollarSign} isOpen={open.finance} onToggle={() => toggle("finance")}>
          <NavItem to="/sales" icon={DollarSign}>Sales Entry</NavItem>
          <NavItem to="/finance/processors" icon={Receipt}>Payment Processors</NavItem>
          <NavItem to="/finance/commissions" icon={Percent}>Commissions</NavItem>
          <NavItem to="/finance/expenses" icon={Scale}>Expenses</NavItem>
          <NavItem to="/finance/loans" icon={Landmark}>Loans</NavItem>
          <NavItem to="/cost-analysis" icon={TrendingUp}>Cost Analysis</NavItem>
        </NavGroup>

        <NavGroup label="Reports" icon={BarChart3} isOpen={open.reports} onToggle={() => toggle("reports")}>
          <NavItem to="/reports" icon={BarChart3}>Profit Reports</NavItem>
          <NavChild to="/reports/sales-summary">Sales Summary (7d)</NavChild>
          <NavChild to="/reports/machine-roi">Machine ROI</NavChild>
          <NavChild to="/reports/maintenance-backlog">Maintenance Backlog</NavChild>
          {/* Add more: Silent Machines, Low Inventory, etc. */}
        </NavGroup>

        <NavGroup label="Oversight & Admin" icon={ShieldAlert} isOpen={open.admin} onToggle={() => toggle("admin")}>
          <NavItem to="/audit" icon={ShieldAlert}>Audit</NavItem>
          <NavItem to="/deletion-logs" icon={Trash2}>Deletion Logs</NavItem>
          <NavItem to="/account" icon={UserCircle2}>Account</NavItem>
          {isDemo && <NavItem to="/qa" icon={ClipboardList}>QA Launcher</NavItem>}
        </NavGroup>
      </nav>

      <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
        <div>v2.1 · Flow Refresh</div>
      </div>
    </aside>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-2 pt-2 pb-1 text-[11px] uppercase tracking-wider text-muted-foreground">{children}</div>;
}

function NavGroup({ label, icon: Icon, isOpen, onToggle, children }: any) {
  return (
    <div className="mt-3">
      <button className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-muted" onClick={onToggle} aria-expanded={isOpen}>
        <span className="flex items-center gap-2"><Icon className="size-4" /><span className="text-sm font-medium">{label}</span></span>
        <ChevronDown className={`size-4 transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`} />
      </button>
      <div className={`overflow-hidden transition-[max-height,opacity] duration-300 ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="mt-1 ml-1 border-l border-border pl-3">{children}</div>
      </div>
    </div>
  );
}

function NavItem({ to, icon: Icon, children }: any) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 px-2 py-2 rounded-lg text-sm hover:bg-muted ${
          isActive ? "bg-muted ring-1 ring-border" : ""
        }`
      }
    >
      <Icon className="size-4" />
      <span>{children}</span>
    </NavLink>
  );
}
function NavChild({ to, children }: any) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block text-sm px-2 py-1.5 rounded-md hover:bg-muted ${isActive ? "bg-muted ring-1 ring-border" : ""}`
      }
    >
      {children}
    </NavLink>
  );
}

/* ===================================================================

   PART 2 — "NEW TICKET" FLOW

   - A full /tickets/new page to create tickets.
   - A visible "New Ticket" button on Maintenance page header.
   - Works even if the `tickets` table is missing: shows SQL to create it.

   Use:
     <FlowRefreshRoutes ProtectedRoute={ProtectedRoute}/> in your <Routes>

=================================================================== */

/** Ideal/target columns. Missing columns are tolerated where possible. */
type Ticket = {
  id?: string;
  machine_id?: string | null;
  title?: string | null;
  issue?: string | null;
  category?: string | null;       // mech, bill, card, inventory, other
  status?: string | null;         // open, in_progress, closed
  priority?: string | null;       // low, medium, high, urgent
  created_at?: string | null;
  updated_at?: string | null;
  resolved_at?: string | null;
  labor_minutes?: number | null;
  labor_cost_cents?: number | null;
  parts_cost_cents?: number | null;
  assigned_to?: string | null;    // staff id/email (optional)
};

const TICKETS_SQL = `-- Run in Supabase SQL Editor (safe to run once)
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid references public.machines(id) on delete set null,
  title text not null,
  issue text,
  category text check (category in ('mech','bill','card','inventory','other')) default 'other',
  status text check (status in ('open','in_progress','closed')) default 'open',
  priority text check (priority in ('low','medium','high','urgent')) default 'medium',
  labor_minutes int,
  labor_cost_cents int,
  parts_cost_cents int,
  assigned_to text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  resolved_at timestamptz
);

create index if not exists idx_tickets_machine on public.tickets(machine_id);
create index if not exists idx_tickets_status on public.tickets(status);
`;

export function NewTicketPage() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const machineFromQuery = sp.get("machine_id") || "";
  const [machines, setMachines] = useState<Array<{ id: string; name?: string | null }>>([]);
  const [tableExists, setTableExists] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [form, setForm] = useState<Ticket>({
    machine_id: machineFromQuery || null,
    title: "",
    issue: "",
    category: "other",
    status: "open",
    priority: "medium",
    labor_minutes: null,
    labor_cost_cents: null,
    parts_cost_cents: null,
    assigned_to: null,
  });

  useEffect(() => {
    (async () => {
      // machines for select
      const { data: ms } = await supabase.from("machines").select("id, name").order("name", { ascending: true });
      setMachines((ms || []) as any[]);
      // probe tickets table
      const probe = await (supabase as any).from("tickets").select("id").limit(1);
      setTableExists(!probe.error);
    })();
  }, []);

  function upd<K extends keyof Ticket>(k: K, v: Ticket[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    setErr(null); setOk(null); setSaving(true);
    try {
      const payload: any = {
        machine_id: form.machine_id || null,
        title: form.title?.trim(),
        issue: form.issue?.trim() || null,
        category: form.category || "other",
        status: form.status || "open",
        priority: form.priority || "medium",
        labor_minutes: form.labor_minutes ?? null,
        labor_cost_cents: form.labor_cost_cents ?? null,
        parts_cost_cents: form.parts_cost_cents ?? null,
        assigned_to: form.assigned_to ?? null,
      };
      if (!payload.title) { setErr("Title is required."); setSaving(false); return; }

      const { error } = await (supabase as any).from("tickets").insert(payload);
      if (error) throw error;
      setOk("Ticket created.");
      setTimeout(() => navigate("/machines/maintenance"), 600);
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2"><TicketCheck className="h-5 w-5" /> New Ticket</h1>
        <Link to="/machines/maintenance" className="rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted">Back to Maintenance</Link>
      </div>

      {tableExists === false && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-sm font-medium flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> Tickets table missing</div>
          <div className="mt-2 text-xs text-muted-foreground">Run this once in Supabase → SQL Editor, then reload:</div>
          <pre className="mt-2 text-xs overflow-auto rounded bg-muted p-2">{TICKETS_SQL}</pre>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-3 space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            <span className="text-muted-foreground">Machine</span>
            <select
              value={form.machine_id || ""}
              onChange={(e) => upd("machine_id", e.target.value || null)}
              className="w-full mt-1 rounded-md bg-background border border-border px-3 py-2 text-sm"
            >
              <option value="">— Not specified —</option>
              {machines.map(m => <option key={m.id} value={m.id}>{m.name || m.id}</option>)}
            </select>
          </label>

          <label className="text-sm">
            <span className="text-muted-foreground">Priority</span>
            <select value={form.priority || "medium"} onChange={(e) => upd("priority", e.target.value)} className="w-full mt-1 rounded-md bg-background border border-border px-3 py-2 text-sm">
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>

          <label className="text-sm md:col-span-2">
            <span className="text-muted-foreground">Title *</span>
            <input value={form.title || ""} onChange={(e) => upd("title", e.target.value)} placeholder="e.g., Coil jam in column B3"
                   className="w-full mt-1 rounded-md bg-background border border-border px-3 py-2 text-sm" />
          </label>

          <label className="text-sm md:col-span-2">
            <span className="text-muted-foreground">Details</span>
            <textarea value={form.issue || ""} onChange={(e) => upd("issue", e.target.value)} rows={4}
                      className="w-full mt-1 rounded-md bg-background border border-border px-3 py-2 text-sm" />
          </label>

          <label className="text-sm">
            <span className="text-muted-foreground">Category</span>
            <select value={form.category || "other"} onChange={(e) => upd("category", e.target.value)} className="w-full mt-1 rounded-md bg-background border border-border px-3 py-2 text-sm">
              <option value="mech">Mechanical</option>
              <option value="bill">Bill Acceptor</option>
              <option value="card">Card Reader</option>
              <option value="inventory">Inventory</option>
              <option value="other">Other</option>
            </select>
          </label>

          <label className="text-sm">
            <span className="text-muted-foreground">Assign To (optional)</span>
            <input value={form.assigned_to || ""} onChange={(e) => upd("assigned_to", e.target.value)} placeholder="email or staff id"
                   className="w-full mt-1 rounded-md bg-background border border-border px-3 py-2 text-sm" />
          </label>

          <div className="grid grid-cols-3 gap-3 md:col-span-2">
            <label className="text-sm">
              <span className="text-muted-foreground">Labor (minutes)</span>
              <input type="number" min={0} value={form.labor_minutes ?? ""} onChange={(e) => upd("labor_minutes", e.target.value === "" ? null : Number(e.target.value))}
                     className="w-full mt-1 rounded-md bg-background border border-border px-3 py-2 text-sm" />
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Labor Cost ($)</span>
              <input type="number" step="0.01" min={0} value={form.labor_cost_cents != null ? (form.labor_cost_cents / 100).toFixed(2) : ""}
                     onChange={(e) => upd("labor_cost_cents", e.target.value === "" ? null : toCents(Number(e.target.value)))}
                     className="w-full mt-1 rounded-md bg-background border border-border px-3 py-2 text-sm" />
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Parts Cost ($)</span>
              <input type="number" step="0.01" min={0} value={form.parts_cost_cents != null ? (form.parts_cost_cents / 100).toFixed(2) : ""}
                     onChange={(e) => upd("parts_cost_cents", e.target.value === "" ? null : toCents(Number(e.target.value)))}
                     className="w-full mt-1 rounded-md bg-background border border-border px-3 py-2 text-sm" />
            </label>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted">
            <Plus className="h-4 w-4" /> Create Ticket
          </button>
          {ok && <span className="text-sm text-emerald-500 inline-flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> {ok}</span>}
          {err && <span className="text-sm text-rose-400 inline-flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> {err}</span>}
        </div>
      </div>
    </div>
  );
}

/* ---------- Maintenance Dashboard (with a visible "New Ticket" CTA) ---------- */
/* If you're already using my MachineOps pack, you can let this route override
   your existing /machines/maintenance path so you get the new CTA immediately. */

type MaintTicket = {
  id: string;
  machine_id?: string | null;
  title?: string | null;
  issue?: string | null;
  priority?: string | null;
  status?: string | null;
  created_at?: string | null;
  labor_cost_cents?: number | null;
  parts_cost_cents?: number | null;
};

export function MaintenanceWithCreate() {
  const [rows, setRows] = useState<MaintTicket[]>([]);
  const [table, setTable] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true); setErr(null);
      const candidates = ["tickets", "maintenance", "machine_maintenance"];
      let picked: string | null = null, data: any = [], lastErr: string | null = null;
      for (const t of candidates) {
        const res = await (supabase as any).from(t).select("*").order("created_at", { ascending: false }).limit(500);
        if (!res.error) { picked = t; data = res.data || []; break; }
        lastErr = res.error.message;
      }
      if (!picked) { setErr(`No maintenance table found. Tried: ${candidates.join(", ")}. Last error: ${lastErr}`); setLoading(false); return; }
      setTable(picked);
      setRows(data as MaintTicket[]);
      setLoading(false);
    })();
  }, []);

  const open = rows.filter(r => (r.status || "open").toLowerCase() !== "closed");
  const backlogCost = open.reduce((sum, r) => sum + cents(r.labor_cost_cents) + cents(r.parts_cost_cents), 0);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2"><Wrench className="h-5 w-5" /> Maintenance</h1>
        <div className="flex items-center gap-2">
          <Link to="/tickets/new" className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted">
            <Plus className="h-4 w-4" /> New Ticket
          </Link>
          <div className="text-xs text-muted-foreground">Source: <code>{table || "—"}</code></div>
        </div>
      </div>

      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {err && <div className="text-sm text-rose-400">Error: {err}</div>}

      {!loading && !err && (
        <>
          <div className="grid gap-2 sm:grid-cols-3">
            <KPI label="Open Tickets" value={open.length.toLocaleString()} />
            <KPI label="Backlog Cost" value={fmt(backlogCost)} />
            <KPI label="Unresolved %" value={`${rows.length ? Math.round((open.length / rows.length) * 100) : 0}%`} />
          </div>

          <div className="rounded-xl border border-border overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left">Ticket</th>
                  <th className="px-3 py-2 text-left">Machine</th>
                  <th className="px-3 py-2 text-left">Priority</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Created</th>
                  <th className="px-3 py-2 text-right">Labor</th>
                  <th className="px-3 py-2 text-right">Parts</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id} className="odd:bg-card/50">
                    <td className="px-3 py-2">{t.title || t.issue || t.id}</td>
                    <td className="px-3 py-2 text-xs">{t.machine_id || "—"}</td>
                    <td className="px-3 py-2">{(t.priority || "medium").toUpperCase()}</td>
                    <td className="px-3 py-2">{(t.status || "open").toUpperCase()}</td>
                    <td className="px-3 py-2 text-xs">{t.created_at ? new Date(t.created_at).toLocaleString() : "—"}</td>
                    <td className="px-3 py-2 text-right">{fmt(cents(t.labor_cost_cents))}</td>
                    <td className="px-3 py-2 text-right">{fmt(cents(t.parts_cost_cents))}</td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr><td colSpan={7} className="px-3 py-6 text-center text-sm text-muted-foreground">No tickets yet. Click "New Ticket".</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function KPI({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

/* -------------------------- ROUTE MOUNTER -------------------------- */
/* Add this to your <Routes> to enable the new flow pieces. */
export function FlowRefreshRoutes({ ProtectedRoute }: { ProtectedRoute?: React.ComponentType<{ children: React.ReactNode }> }) {
  return (
    <React.Fragment>
      {/* New Ticket page */}
      <Route path="/tickets/new" element={<NewTicketPage />} />
      {/* Maintenance page with New Ticket CTA (safe to override existing) */}
      <Route path="/machines/maintenance" element={<MaintenanceWithCreate />} />
    </React.Fragment>
  );
}