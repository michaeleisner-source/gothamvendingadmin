import React, { useEffect, useMemo, useState } from "react";
import { Route } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Copy, AlertTriangle, CheckCircle2, Info, BarChart3, RefreshCw, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/** Review Snapshot — one-click JSON of the app's health + flow signals
 *  Use this right after publish; paste JSON back to me for deep review.
 */

type Snap = {
  meta: {
    router: "hash" | "browser";
    demo: boolean;
    nav_profile: string | null;
    time_utc: string;
  };
  counts: Record<string, number | null>;
  schema: {
    have: string[];
    missing: string[];
    salesTenderColumn: string | null;
    ticketsAssignable: boolean | null;
  };
  money30d: {
    gross: number; // $
    cogs: number;  // $
    fees: number;  // $
    net: number;   // $
    tender?: { method: string; gross: number; units: number }[];
  };
  maintenance: {
    open: number;
    in_progress: number;
    closed: number;
    silent_over_7d: number;
    worst_silent: Array<{ machine: string; daysSilent: number; lastSale?: string | null }>;
  };
  inventory?: {
    below_par_count: number;
    top_deficits: Array<{ machine: string; product: string; deficit: number }>;
  };
};

const TABLES = [
  "prospects","locations","machines","products","inventory_levels","sales","tickets",
  "delivery_routes","machine_finance","payment_processors",
  "machine_processor_mappings","deletion_logs"
];

async function tableExists(t: string) {
  const r = await supabase.from(t as any).select("*").limit(1);
  return !r.error;
}
async function tableCount(t: string) {
  const r: any = await supabase.from(t as any).select("*", { count: "exact", head: true });
  return r?.count ?? null;
}
async function colExists(t: string, c: string) {
  const r = await supabase.from(t as any).select(c).limit(1);
  return !r.error;
}
const usd = (n: number) => Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
const toNum = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const cents = (v: any) => (Number.isFinite(Number(v)) ? Number(v) / 100 : 0);
const daysBetween = (a: Date, b: Date) => Math.abs(a.getTime() - b.getTime()) / 86400000;

export function ReviewSnapshotPage() {
  const [snap, setSnap] = useState<Snap | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      // Meta
      const router = window.location.hash.startsWith("#/") ? "hash" : "browser";
      const demo = (import.meta.env.VITE_PUBLIC_DEMO === "true") || (new URL(window.location.href).searchParams.get("demo") === "1");
      const nav_profile = (import.meta.env.VITE_NAV_PROFILE || null);

      // Counts + schema presence
      const counts: Record<string, number | null> = {};
      const have: string[] = [];
      const missing: string[] = [];

      for (const t of TABLES) {
        const ex = await tableExists(t);
        if (ex) { have.push(t); counts[t] = await tableCount(t); }
        else { missing.push(t); counts[t] = null; }
      }

      // Tender column detection
      let salesTenderColumn: string | null = null;
      for (const c of ["payment_method","tender","tender_type"]) {
        if (await colExists("sales", c)) { salesTenderColumn = c; break; }
      }

      // Tickets assignability
      let ticketsAssignable: boolean | null = null;
      if (have.includes("tickets")) ticketsAssignable = await colExists("tickets","assigned_to");

      // Money (30d)
      const since = new Date(); since.setDate(since.getDate() - 30);
      let grossC = 0, cogsC = 0, feesC = 0;
      const s = await supabase.from("sales")
        .select("qty,unit_price_cents,unit_cost_cents,occurred_at" + (salesTenderColumn ? `,${salesTenderColumn}` : ""))
        .gte("occurred_at", since.toISOString()).limit(50000);
      const rows = s.error ? [] : (s.data || []);
      const tenderAgg: Record<string,{grossC:number;units:number}> = {};
      for (const r of rows) {
        const g = toNum((r as any).qty) * toNum((r as any).unit_price_cents);
        const c = toNum((r as any).qty) * toNum((r as any).unit_cost_cents);
        grossC += g; cogsC += c;
        if (salesTenderColumn) {
          const key = ((r as any)[salesTenderColumn] || "card").toString().toLowerCase();
          tenderAgg[key] = tenderAgg[key] || { grossC:0, units:0 };
          tenderAgg[key].grossC += g;
          tenderAgg[key].units += toNum((r as any).qty);
        }
      }
      // Optional processor settlements table (closest equivalent)
      const pf = await supabase.from("processor_settlements").select("fee_cents, occurred_on").gte("occurred_on", since.toISOString().split('T')[0]);
      if (!pf.error) feesC = (pf.data || []).reduce((s:number,r:any)=> s + toNum(r.fee_cents), 0);

      // Maintenance
      let silent_over_7d = 0;
      let worst: Array<{ machine: string; daysSilent: number; lastSale?: string | null }> = [];
      let open=0, in_progress=0, closed=0;

      const m = await supabase.from("machines").select("id,name").order("name");
      const machines = m.error ? [] : (m.data || []);
      const last = await supabase.from("sales").select("machine_id,occurred_at").order("occurred_at",{ascending:false}).limit(20000);
      const lastMap: Record<string,string|undefined> = {};
      if (!last.error) (last.data||[]).forEach((r:any)=>{ const mid=r.machine_id; if (mid && !lastMap[mid]) lastMap[mid] = r.occurred_at; });

      const now = new Date();
      const silentRows = machines.map(mm => {
        const ls = lastMap[mm.id] || null;
        const days = ls ? Math.floor(daysBetween(new Date(ls), now)) : 9999;
        return { machine: mm.name || mm.id, daysSilent: days, lastSale: ls };
      }).sort((a,b)=> b.daysSilent - a.daysSilent);

      silent_over_7d = silentRows.filter(r=> r.daysSilent > 7).length;
      worst = silentRows.slice(0, 10);

      const t = await supabase.from("tickets").select("status,created_at,resolved_at").limit(20000);
      if (!t.error && t.data) {
        (t.data||[]).forEach((x:any) => {
          const st = (x.status || "open") as string;
          if (st === "open") open++;
          else if (st === "in_progress") in_progress++;
          else if (st === "closed" || st === "resolved") closed++;
        });
      }

      // Inventory deficits (if table exists)
      let invSummary: Snap["inventory"] | undefined = undefined;
      if (have.includes("inventory_levels")) {
        const inv = await supabase.from("inventory_levels").select("machine_id,product_id,current_qty,par_level");
        const machines2 = await supabase.from("machines").select("id,name");
        const products = await supabase.from("products").select("id,name");
        const mName = new Map<string,string>((machines2.data||[]).map((x:any)=>[x.id, x.name || x.id]));
        const pName = new Map<string,string>((products.data||[]).map((x:any)=>[x.id, x.name || x.id]));

        const deficits = (inv.data||[])
          .map((r:any) => ({ machine: mName.get(r.machine_id)||r.machine_id, product: pName.get(r.product_id)||r.product_id, deficit: Math.max(0, toNum(r.par_level)-toNum(r.current_qty)) }))
          .filter(x => x.deficit > 0)
          .sort((a,b)=> b.deficit - a.deficit);
        invSummary = {
          below_par_count: deficits.length,
          top_deficits: deficits.slice(0, 10),
        };
      }

      const tender = salesTenderColumn
        ? Object.entries(tenderAgg).map(([method,a])=>({ method, gross: usd(cents(a.grossC)), units: a.units }))
        : undefined;

      const snap: Snap = {
        meta: {
          router,
          demo,
          nav_profile,
          time_utc: new Date().toISOString(),
        },
        counts,
        schema: {
          have,
          missing,
          salesTenderColumn,
          ticketsAssignable,
        },
        money30d: {
          gross: usd(cents(grossC)),
          cogs: usd(cents(cogsC)),
          fees: usd(cents(feesC)),
          net: usd(cents(grossC - cogsC - feesC)),
          tender,
        },
        maintenance: {
          open, in_progress, closed,
          silent_over_7d,
          worst_silent: worst,
        },
        inventory: invSummary,
      };

      setSnap(snap);
      setLoading(false);
    })();
  }, []);

  async function copyJSON() {
    if (!snap) return;
    await navigator.clipboard.writeText(JSON.stringify(snap, null, 2));
    setCopied(true);
    setTimeout(()=>setCopied(false), 1200);
  }

  return (
    <TooltipProvider>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold flex items-center gap-2"><BarChart3 className="h-5 w-5"/> Review Snapshot</h1>
          <div className="flex items-center gap-2">
            <button onClick={()=>window.location.reload()} className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted">
              <RefreshCw className="h-4 w-4"/> Refresh
            </button>
            <button onClick={copyJSON} className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted">
              <Copy className="h-4 w-4"/>{copied ? "Copied!" : "Copy JSON"}
            </button>
          </div>
        </div>

        {loading && <div className="text-sm text-muted-foreground">Collecting signals…</div>}

        {!loading && snap && (
          <>
            <div className="grid gap-2 sm:grid-cols-4">
              <Card label="Router" value={snap.meta.router} ok tooltip="Shows whether your app uses hash routing (#/) or browser routing. Hash routing is more compatible with static hosting." />
              <Card label="Demo" value={snap.meta.demo ? "on" : "off"} ok tooltip="Indicates if demo mode is active, which affects data and features shown to users." />
              <Card label="Sales (30d gross)" value={`$${snap.money30d.gross.toLocaleString()}`} ok tooltip="Total gross revenue from all sales in the last 30 days, before costs and fees." />
              <Card label="Silent >7d" value={snap.maintenance.silent_over_7d} ok={snap.maintenance.silent_over_7d === 0} tooltip="Number of machines that haven't recorded any sales in over 7 days. Could indicate maintenance issues." />
            </div>

            <Section title="Schema presence" tooltip="Shows which database tables exist in your system vs. which are missing. Helps identify incomplete features.">
              <Row label="Have" value={snap.schema.have.join(", ") || "—"} />
              <Row label="Missing" value={snap.schema.missing.join(", ") || "—"} warn={!!snap.schema.missing.length} />
              <Row label="Tender column" value={snap.schema.salesTenderColumn || "—"} />
              <Row label="Tickets assignable" value={snap.schema.ticketsAssignable ? "yes" : "no"} warn={snap.schema.ticketsAssignable === false} />
            </Section>

            <Section title="Money (last 30 days)" tooltip="Financial performance summary showing revenue, costs, and profit margins for the past month.">
              <Row label="Gross" value={`$${snap.money30d.gross.toLocaleString()}`} />
              <Row label="COGS" value={`$${snap.money30d.cogs.toLocaleString()}`} />
              <Row label="Processor fees" value={`$${snap.money30d.fees.toLocaleString()}`} />
              <Row label="Net" value={<span className={snap.money30d.net >= 0 ? "text-emerald-400" : "text-rose-400"}>${snap.money30d.net.toLocaleString()}</span>} />
              {snap.money30d.tender && <Row label="Tender split" value={snap.money30d.tender.map(t=>`${t.method}:${t.units}u/$${t.gross.toLocaleString()}`).join("  ·  ")} />}
            </Section>

            <Section title="Maintenance" tooltip="Machine health and support ticket status. Tracks machines needing attention and outstanding service requests.">
              <Row label="Tickets (open/in-progress/closed)" value={`${snap.maintenance.open}/${snap.maintenance.in_progress}/${snap.maintenance.closed}`} />
              <Row label="Silent >7 days" value={snap.maintenance.silent_over_7d} warn={snap.maintenance.silent_over_7d>0} />
              <div className="rounded-xl border border-border overflow-auto mt-2">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left">Machine</th>
                      <th className="px-3 py-2 text-right">Days silent</th>
                      <th className="px-3 py-2 text-left">Last sale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snap.maintenance.worst_silent.map((w,i)=>(
                      <tr key={i} className="odd:bg-card/50">
                        <td className="px-3 py-2">{w.machine}</td>
                        <td className="px-3 py-2 text-right">{w.daysSilent}</td>
                        <td className="px-3 py-2">{w.lastSale ? new Date(w.lastSale).toLocaleString() : "— never —"}</td>
                      </tr>
                    ))}
                    {!snap.maintenance.worst_silent.length && <tr><td className="px-3 py-6 text-center text-muted-foreground" colSpan={3}>No machines found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </Section>

            {snap.inventory && (
              <Section title="Inventory" tooltip="Stock levels across your machines. Shows which products are running low compared to their target levels.">
                <Row label="Below-PAR items" value={snap.inventory.below_par_count} warn={snap.inventory.below_par_count>0} />
                <div className="rounded-xl border border-border overflow-auto mt-2">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-3 py-2 text-left">Machine</th>
                        <th className="px-3 py-2 text-left">Product</th>
                        <th className="px-3 py-2 text-right">Deficit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {snap.inventory.top_deficits.map((d,i)=>(
                        <tr key={i} className="odd:bg-card/50">
                          <td className="px-3 py-2">{d.machine}</td>
                          <td className="px-3 py-2">{d.product}</td>
                          <td className="px-3 py-2 text-right">{d.deficit}</td>
                        </tr>
                      ))}
                      {!snap.inventory.top_deficits.length && <tr><td className="px-3 py-6 text-center text-muted-foreground" colSpan={3}>No deficits.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </Section>
            )}

            <Section title="Raw JSON (what you'll paste to me)" tooltip="The complete diagnostic data in JSON format. Copy this and share it for detailed system analysis.">
              <pre className="text-xs bg-muted p-2 rounded overflow-auto">{JSON.stringify(snap, null, 2)}</pre>
              <div className="text-xs text-muted-foreground mt-2 flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5" />
                <span>Copy JSON → paste it here in chat. I'll give you targeted recommendations (keep / fix / prune + reports & SQL).</span>
              </div>
            </Section>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}


function Card({ label, value, ok, tooltip }: { label: string; value: React.ReactNode; ok?: boolean; tooltip?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-sm text-muted-foreground flex items-center gap-1">
        {label}
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-3 w-3 cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="text-lg font-semibold flex items-center gap-2">
        {ok === undefined ? null : ok ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <AlertTriangle className="h-4 w-4 text-amber-400" />}
        {value}
      </div>
    </div>
  );
}

function Section({ title, children, tooltip }: { title: string; children: React.ReactNode; tooltip?: string }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="text-sm font-medium mb-2 flex items-center gap-2">
        {title}
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4 cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, warn }: { label: string; value: React.ReactNode; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm py-1">
      <div className="text-muted-foreground">{label}</div>
      <div className={warn ? "text-amber-400" : ""}>{value}</div>
    </div>
  );
}

/** Route helper you'll import in App.tsx */
export function ReviewSnapshotRoutes({ ProtectedRoute }: { ProtectedRoute?: React.ComponentType<{children:React.ReactNode}> }) {
  const Wrap: React.FC<{children:React.ReactNode}> = ({ children }) =>
    ProtectedRoute ? <ProtectedRoute>{children}</ProtectedRoute> : <>{children}</>;
  return (
    <>
      <Route path="/admin/review-snapshot" element={<Wrap><ReviewSnapshotPage /></Wrap>} />
    </>
  );
}