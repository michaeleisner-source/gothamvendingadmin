import React, { useEffect, useMemo, useState } from "react";
import { Link, Route, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import {
  AlertTriangle, CheckCircle2, Info, Package2, DollarSign, Landmark, Gauge, Layers,
} from "lucide-react";

/* =============================== helpers =============================== */
const usd = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD" });
const toNum = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const cents = (v: any) => (Number.isFinite(Number(v)) ? Number(v) / 100 : 0);
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

/* small banner for missing tables */
function SQLNotice({ title, sql }: { title: string; sql: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 mb-4">
      <div className="text-sm font-medium flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-500"/>{title}
      </div>
      <div className="mt-2 text-xs text-muted-foreground">Run this once in Supabase → SQL Editor, then reload:</div>
      <pre className="mt-2 text-xs overflow-auto rounded bg-muted p-2">{sql}</pre>
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

/* ======================================================================
   A) INVENTORY — LOW STOCK REPORT  (par levels + auto-deduct wiring)
   - Uses inventory_levels if present; shows SQL to create + triggers
   - Optional: auto-deduct from sales if sales has product_id
====================================================================== */

const INVENTORY_SQL = `-- Core inventory per machine + product
create table if not exists public.inventory_levels (
  machine_id uuid references public.machines(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  qty int default 0,
  par_level int default 0,
  last_counted_at timestamptz default now(),
  primary key(machine_id, product_id)
);
create index if not exists idx_inv_machine on public.inventory_levels(machine_id);
create index if not exists idx_inv_product on public.inventory_levels(product_id);

-- OPTIONAL: auto-deduct on sales if your sales table includes product_id
create or replace function public.deduct_inventory_on_sale()
returns trigger language plpgsql as $$
begin
  if NEW.product_id is null then
    return NEW; -- cannot deduct per SKU without product_id
  end if;

  insert into public.inventory_levels (machine_id, product_id, qty, par_level)
  values (NEW.machine_id, NEW.product_id, 0, 0)
  on conflict (machine_id, product_id) do nothing;

  update public.inventory_levels
    set qty = greatest(0, qty - coalesce(NEW.qty, 0)),
        last_counted_at = now()
  where machine_id = NEW.machine_id and product_id = NEW.product_id;

  return NEW;
end $$;

drop trigger if exists trg_sales_inventory_deduct on public.sales;
create trigger trg_sales_inventory_deduct
after insert on public.sales
for each row execute function public.deduct_inventory_on_sale();`;

type LowRow = {
  machine_id: string; machine: string; product_id: string; product: string;
  qty: number; par: number; deficit: number;
};

export function LowStockReport() {
  const [tableOk, setTableOk] = useState<boolean | null>(null);
  const [rows, setRows] = useState<LowRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const probe = await (supabase as any).from("inventory_levels").select("machine_id").limit(1);
      setTableOk(!probe.error);
      if (probe.error) { setLoading(false); return; }

      // join to show names if available
      const inv = await (supabase as any)
        .from("inventory_levels")
        .select("machine_id, product_id, qty, par_level");
      const machines = await supabase.from("machines").select("id, name");
      const products = await supabase.from("products").select("id, name");

      const mName = new Map<string,string>((machines.data||[]).map((m:any)=>[m.id, m.name || m.id]));
      const pName = new Map<string,string>((products.data||[]).map((p:any)=>[p.id, p.name || p.id]));

      const list: LowRow[] = (inv.data||[]).map((r:any) => {
        const qty = toNum(r.qty); const par = toNum(r.par_level);
        return {
          machine_id: r.machine_id, machine: mName.get(r.machine_id) || r.machine_id,
          product_id: r.product_id, product: pName.get(r.product_id) || r.product_id,
          qty, par, deficit: Math.max(0, par - qty),
        };
      }).filter(x => x.par > 0 && x.qty < x.par).sort((a,b)=> (b.deficit - a.deficit));

      setRows(list); setLoading(false);
    })();
  }, []);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2"><Package2 className="h-5 w-5"/> Low Stock Alert</h1>
        <div className="text-xs text-muted-foreground">Shows SKUs below PAR by machine.</div>
      </div>

      {tableOk === false && <SQLNotice title="inventory_levels table not found" sql={INVENTORY_SQL}/>}

      <div className="grid gap-2 sm:grid-cols-3">
        <KPI label="Items below PAR" value={rows.length.toLocaleString()} />
        <KPI label="Machines impacted" value={new Set(rows.map(r=>r.machine_id)).size.toString()} />
        <KPI label="Top deficit" value={rows.length ? `${rows[0].product} (${rows[0].deficit})` : "—"} />
      </div>

      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}

      {!loading && tableOk && (
        <div className="rounded-xl border border-border overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left">Machine</th>
                <th className="px-3 py-2 text-left">Product</th>
                <th className="px-3 py-2 text-right">Qty</th>
                <th className="px-3 py-2 text-right">PAR</th>
                <th className="px-3 py-2 text-right">Deficit</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={`${r.machine_id}-${r.product_id}`} className="odd:bg-card/50">
                  <td className="px-3 py-2">{r.machine}</td>
                  <td className="px-3 py-2">{r.product}</td>
                  <td className="px-3 py-2 text-right">{r.qty}</td>
                  <td className="px-3 py-2 text-right">{r.par}</td>
                  <td className="px-3 py-2 text-right font-medium">{r.deficit}</td>
                  <td className="px-3 py-2 text-right">
                    <Link to={`/picklists`} className="text-xs underline">Add to Picklist</Link>
                  </td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={6} className="px-3 py-6 text-center text-sm text-muted-foreground">No items below PAR.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-xs text-muted-foreground flex items-start gap-2">
        <Info className="h-4 w-4 mt-0.5"/>
        <span>
          To enable auto-deduct on sales, your <code>sales</code> rows should include <code>product_id</code>. The SQL above creates a trigger that decrements <code>inventory_levels.qty</code> per sale.
        </span>
      </div>
    </div>
  );
}

/* ======================================================================
   B) MACHINE FINANCE ADMIN — keep ROI real (capex + monthly costs)
   - Reads machine_finance if present, else shows SQL to create
   - Inline edit: purchase_price_cents, start_date, monthly_payment_cents, apr
====================================================================== */

const MACHINE_FINANCE_SQL = `create table if not exists public.machine_finance (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  machine_id uuid not null references public.machines(id) on delete cascade,
  purchase_price numeric,
  purchased_at date,
  monthly_payment numeric,
  apr numeric,
  created_at timestamptz default now()
);
create index if not exists idx_machine_finance_machine on public.machine_finance(machine_id);`;

type FinanceRow = {
  machine_id: string; machine: string; mf_id?: string|null;
  purchase_price?: number|null; purchased_at?: string|null;
  monthly_payment?: number|null; apr?: number|null;
};

export function MachineFinanceAdmin() {
  const [tableOk, setTableOk] = useState<boolean | null>(null);
  const [rows, setRows] = useState<FinanceRow[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  async function load() {
    const m = await supabase.from("machines").select("id,name").order("name");
    const mf = await (supabase as any).from("machine_finance").select("id, machine_id, purchase_price, purchased_at, monthly_payment, apr");
    const tableExists = !mf.error;
    setTableOk(tableExists);

    const byMachine: Record<string, any> = {};
    (mf.data || []).forEach((x:any)=> byMachine[x.machine_id] = x);

    const list: FinanceRow[] = (m.data||[]).map((x:any) => {
      const f = byMachine[x.id] || null;
      return {
        machine_id: x.id,
        machine: x.name || x.id,
        mf_id: f?.id || null,
        purchase_price: f?.purchase_price ?? null,
        purchased_at: f?.purchased_at ?? null,
        monthly_payment: f?.monthly_payment ?? null,
        apr: f?.apr ?? null,
      };
    });
    setRows(list);
  }

  useEffect(() => { load(); }, []);

  async function save(r: FinanceRow) {
    setSaving(r.machine_id);
    if (tableOk === false) { setSaving(null); return; }

    if (r.mf_id) {
      const { error } = await (supabase as any).from("machine_finance").update({
        purchase_price: r.purchase_price ?? null,
        purchased_at: r.purchased_at ?? null,
        monthly_payment: r.monthly_payment ?? null,
        apr: r.apr ?? null
      }).eq("id", r.mf_id);
      if (error) alert(error.message);
    } else {
      const { error } = await (supabase as any).from("machine_finance").insert({
        machine_id: r.machine_id,
        acquisition_type: 'purchase',
        purchase_price: r.purchase_price ?? null,
        purchased_at: r.purchased_at ?? null,
        monthly_payment: r.monthly_payment ?? null,
        apr: r.apr ?? null
      });
      if (error) alert(error.message);
    }
    await load(); setSaving(null);
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2"><Landmark className="h-5 w-5"/> Machine Finance Admin</h1>
        <div className="text-xs text-muted-foreground">Edit capex & monthly costs powering ROI/payback.</div>
      </div>

      {tableOk === false && <SQLNotice title="machine_finance table not found" sql={MACHINE_FINANCE_SQL}/>}

      <div className="rounded-xl border border-border overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-3 py-2 text-left">Machine</th>
              <th className="px-3 py-2 text-right">Acquisition ($)</th>
              <th className="px-3 py-2 text-left">Start Date</th>
              <th className="px-3 py-2 text-right">Monthly ($)</th>
              <th className="px-3 py-2 text-right">APR (%)</th>
              <th className="px-3 py-2 text-right">Save</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.machine_id} className="odd:bg-card/50">
                <td className="px-3 py-2">{r.machine}</td>
                <td className="px-3 py-2 text-right">
                  <input
                    type="number" className="w-28 bg-background border border-border rounded px-2 py-1 text-right"
                    value={r.purchase_price ? r.purchase_price.toString() : ""}
                    onChange={(e)=>r.purchase_price = Number(e.target.value||0)}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="date" className="bg-background border border-border rounded px-2 py-1"
                    value={r.purchased_at ?? ""} onChange={(e)=>r.purchased_at = e.target.value}
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <input
                    type="number" className="w-24 bg-background border border-border rounded px-2 py-1 text-right"
                    value={r.monthly_payment ? r.monthly_payment.toString() : ""}
                    onChange={(e)=>r.monthly_payment = Number(e.target.value||0)}
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <input
                    type="number" step="0.01" className="w-20 bg-background border border-border rounded px-2 py-1 text-right"
                    value={r.apr ?? ""} onChange={(e)=>r.apr = Number(e.target.value||0)}
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={()=>save(r)} disabled={saving===r.machine_id}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-xs hover:bg-muted"
                  >
                    {saving===r.machine_id ? "Saving…" : "Save"}
                  </button>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={6} className="px-3 py-6 text-center text-sm text-muted-foreground">No machines found.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-muted-foreground flex items-start gap-2">
        <Info className="h-4 w-4 mt-0.5"/><span>Once saved, your ROI report will use these amounts for acquisition and monthly costs.</span>
      </div>
    </div>
  );
}

/* ======================================================================
   C) PROCESSOR FEES — rules + mapping → fees simulation
   - Uses payment_processors & machine_processor_mappings if present
   - If missing, shows SQL to scaffold both + fee rules table
====================================================================== */

const PROCESSOR_SQL = `-- Minimal processors + mapping + rules
create table if not exists public.payment_processors (
  id uuid primary key default gen_random_uuid(),
  name text not null
);
create table if not exists public.machine_processor_mappings (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references public.machines(id) on delete cascade,
  processor_id uuid not null references public.payment_processors(id) on delete cascade,
  created_at timestamptz default now()
);
create table if not exists public.processor_fee_rules (
  id uuid primary key default gen_random_uuid(),
  processor_id uuid not null references public.payment_processors(id) on delete cascade,
  percent_bps int default 300,       -- 3.00% = 300 bps
  fixed_cents int default 0,
  effective_date date default current_date
);
create index if not exists idx_proc_rules_proc on public.processor_fee_rules(processor_id);`;

type RuleRow = { id?:string; processor_id: string; processor?: string; percent_bps: number; fixed_cents: number; effective_date: string };

export function ProcessorFeesAdmin() {
  const [haveCore, setHaveCore] = useState<boolean | null>(null);
  const [processors, setProcessors] = useState<Array<{id:string; name:string}>>([]);
  const [rules, setRules] = useState<RuleRow[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  async function load() {
    const p = await supabase.from("payment_processors").select("id,name").order("name");
    const ok = !p.error;
    setHaveCore(ok);
    if (ok) {
      setProcessors((p.data||[]).map((x:any)=>({ id:x.id, name:x.name })));
      const rr = await (supabase as any).from("processor_fee_rules").select("id, processor_id, percent_bps, fixed_cents, effective_date");
      const nameById: Record<string,string> = {};
      (p.data||[]).forEach((x:any)=>nameById[x.id]=x.name);
      setRules((rr.data||[]).map((r:any)=>({ ...r, processor: nameById[r.processor_id] || r.processor_id })));
    }
  }
  useEffect(()=>{ load(); }, []);

  async function addRule(procId: string) {
    setSaving("new");
    const { error } = await (supabase as any).from("processor_fee_rules").insert({
      processor_id: procId, percent_bps: 300, fixed_cents: 0, effective_date: new Date().toISOString().slice(0,10)
    });
    setSaving(null);
    if (error) alert(error.message); else load();
  }
  async function saveRule(r: RuleRow) {
    if (!r.id) return;
    setSaving(r.id);
    const { error } = await (supabase as any).from("processor_fee_rules").update({
      percent_bps: r.percent_bps, fixed_cents: r.fixed_cents, effective_date: r.effective_date
    }).eq("id", r.id);
    setSaving(null);
    if (error) alert(error.message);
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2"><DollarSign className="h-5 w-5"/> Processor Fees Admin</h1>
        <div className="text-xs text-muted-foreground">Set % and per-tx fees by processor.</div>
      </div>

      {haveCore === false && <SQLNotice title="Processors core tables not found" sql={PROCESSOR_SQL}/>}

      {haveCore && (
        <>
          <div className="rounded-xl border border-border p-3">
            <div className="text-sm font-medium mb-2">Add rule</div>
            <div className="flex flex-wrap gap-2">
              {processors.map(p => (
                <button key={p.id} disabled={saving==="new"}
                  onClick={()=>addRule(p.id)}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-xs hover:bg-muted">
                  + {p.name}
                </button>
              ))}
              {!processors.length && <div className="text-xs text-muted-foreground">Add processors in <code>payment_processors</code> then refresh.</div>}
            </div>
          </div>

          <div className="rounded-xl border border-border overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left">Processor</th>
                  <th className="px-3 py-2 text-right">% (bps)</th>
                  <th className="px-3 py-2 text-right">Fixed ($)</th>
                  <th className="px-3 py-2 text-left">Effective</th>
                  <th className="px-3 py-2 text-right">Save</th>
                </tr>
              </thead>
              <tbody>
                {rules.map(r => (
                  <tr key={r.id} className="odd:bg-card/50">
                    <td className="px-3 py-2">{r.processor}</td>
                    <td className="px-3 py-2 text-right">
                      <input type="number" className="w-24 bg-background border border-border rounded px-2 py-1 text-right"
                        value={r.percent_bps} onChange={(e)=>r.percent_bps = Math.round(Number(e.target.value||0))}/>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input type="number" step="0.01" className="w-24 bg-background border border-border rounded px-2 py-1 text-right"
                        value={(r.fixed_cents/100).toString()} onChange={(e)=>r.fixed_cents = Math.round(Number(e.target.value||0)*100)}/>
                    </td>
                    <td className="px-3 py-2">
                      <input type="date" className="bg-background border border-border rounded px-2 py-1"
                        value={r.effective_date} onChange={(e)=>r.effective_date = e.target.value}/>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button disabled={saving===r.id} onClick={()=>saveRule(r)}
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-xs hover:bg-muted">
                        {saving===r.id ? "Saving…" : "Save"}
                      </button>
                    </td>
                  </tr>
                ))}
                {!rules.length && <tr><td colSpan={5} className="px-3 py-6 text-center text-sm text-muted-foreground">No rules yet.</td></tr>}
              </tbody>
            </table>
          </div>

          <ProcessorFeesSimulation />
        </>
      )}
    </div>
  );
}

/* quick simulation widget (last N days) */
function ProcessorFeesSimulation() {
  const [sp] = useSearchParams();
  const days = Math.max(7, Math.min(120, Number(sp.get("days")) || 30));
  const since = startOfDay(addDays(new Date(), -days));

  const [mapOk, setMapOk] = useState<boolean | null>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [m2p, setM2p] = useState<Record<string,string>>({});
  const [rulesByProc, setRulesByProc] = useState<Record<string, {bps:number; fixedC:number}>>({});

  useEffect(() => {
    (async () => {
      const m = await (supabase as any).from("machine_processor_mappings").select("machine_id, processor_id").limit(10000);
      setMapOk(!m.error);
      if (m.error) return;
      const map: Record<string,string> = {};
      (m.data||[]).forEach((x:any)=>{ map[x.machine_id] = x.processor_id; });
      setM2p(map);

      const rr = await (supabase as any).from("processor_fee_rules").select("processor_id, percent_bps, fixed_cents, effective_date");
      const rules: Record<string,{bps:number; fixedC:number}> = {};
      (rr.data||[]).forEach((r:any)=> {
        const key = r.processor_id;
        const ex = rules[key]; // naive: keep latest (you can refine by date later)
        if (!ex || (r.effective_date > ex["effective_date"])) {
          rules[key] = { bps: toNum(r.percent_bps), fixedC: toNum(r.fixed_cents) } as any;
          (rules[key] as any).effective_date = r.effective_date;
        }
      });
      Object.values(rules).forEach((r:any)=> delete r.effective_date);
      setRulesByProc(rules);

      const s = await supabase
        .from("sales")
        .select("machine_id, qty, unit_price_cents, occurred_at")
        .gte("occurred_at", since.toISOString())
        .limit(50000);
      if (!s.error) setSales(s.data || []);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const procAgg = useMemo(() => {
    const agg: Record<string,{grossC:number; estFeesC:number}> = {};
    sales.forEach((row:any) => {
      const mid = row.machine_id; if (!mid) return;
      const pid = m2p[mid]; if (!pid) return;
      const rule = rulesByProc[pid] || { bps: 300, fixedC: 0 };
      const grossC = toNum(row.qty) * toNum(row.unit_price_cents);
      const feeC = Math.round(grossC * (rule.bps/10000)) + rule.fixedC; // per row approximation
      const prev = agg[pid] || { grossC: 0, estFeesC: 0 };
      agg[pid] = { grossC: prev.grossC + grossC, estFeesC: prev.estFeesC + feeC };
    });
    return agg;
  }, [sales, m2p, rulesByProc]);

  const rows = Object.entries(procAgg).map(([pid, a]) => ({
    processor_id: pid, gross: cents(a.grossC), fees: cents(a.estFeesC), rate: a.grossC ? (a.estFeesC/a.grossC)*100 : 0
  })).sort((a,b)=> b.fees - a.fees);

  const totals = rows.reduce((t,r)=>({ gross:t.gross+r.gross, fees:t.fees+r.fees }), {gross:0, fees:0});

  return (
    <div className="rounded-xl border border-border p-3 mt-4 space-y-2">
      <div className="text-sm font-medium">Fees Simulation (last {days} days)</div>
      <div className="grid gap-2 sm:grid-cols-3">
        <KPI label="Gross" value={usd(totals.gross)} />
        <KPI label="Estimated Fees" value={usd(totals.fees)} />
        <KPI label="Avg Rate" value={`${totals.gross? (totals.fees/totals.gross*100).toFixed(2):"0.00"}%`} />
      </div>
      <div className="rounded-xl border border-border overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-3 py-2 text-left">Processor</th>
              <th className="px-3 py-2 text-right">Gross</th>
              <th className="px-3 py-2 text-right">Est. Fees</th>
              <th className="px-3 py-2 text-right">Rate</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.processor_id} className="odd:bg-card/50">
                <td className="px-3 py-2">{r.processor_id}</td>
                <td className="px-3 py-2 text-right">{usd(r.gross)}</td>
                <td className="px-3 py-2 text-right">{usd(r.fees)}</td>
                <td className="px-3 py-2 text-right">{r.rate.toFixed(2)}%</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={4} className="px-3 py-6 text-center text-sm text-muted-foreground">No mapped sales in range.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-muted-foreground flex items-start gap-2">
        <Info className="h-4 w-4 mt-0.5"/>
        <span>
          This simulates fees by applying your rules to sales per machine via <code>machine_processor_mappings</code>.
          For exact reconciliation, add a <code>processor_settlements</code> ingestion later.
        </span>
      </div>
    </div>
  );
}

/* ======================================================================
   D) LOCATION PROFITABILITY — money by site (last N days)
   - Tries machines.location_id if present
====================================================================== */

const LOC_MIN_SQL = `-- Optional: if you don't have location binding
alter table public.machines add column if not exists location_id uuid references public.locations(id);
create index if not exists idx_machines_location on public.machines(location_id);`;

type LocRow = { id: string; name: string; gross: number; cogs: number; net: number };

export function LocationProfitabilityReport() {
  const [sp] = useSearchParams();
  const days = Math.max(7, Math.min(180, Number(sp.get("days")) || 60));
  const since = startOfDay(addDays(new Date(), -days));

  const [haveBinding, setHaveBinding] = useState<boolean | null>(null);
  const [locs, setLocs] = useState<Record<string,string>>({});
  const [sales, setSales] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const probe = await supabase.from("machines").select("id, location_id").limit(1);
      setHaveBinding(!probe.error);
      if (probe.error) return;

      const m = await supabase.from("machines").select("id, location_id").limit(10000);
      const map: Record<string,string> = {};
      (m.data||[]).forEach((x:any)=> { if (x.location_id) map[x.id] = x.location_id; });
      setLocs(map);

      const s = await supabase
        .from("sales")
        .select("machine_id, qty, unit_price_cents, unit_cost_cents, occurred_at")
        .gte("occurred_at", since.toISOString())
        .limit(50000);
      if (!s.error) setSales(s.data||[]);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const agg: Record<string,{grossC:number; cogsC:number}> = {};
  sales.forEach((row:any) => {
    const locId = locs[row.machine_id]; if (!locId) return;
    const gross = toNum(row.qty) * toNum(row.unit_price_cents);
    const cogs = toNum(row.qty) * toNum(row.unit_cost_cents);
    const prev = agg[locId] || { grossC:0, cogsC:0 };
    agg[locId] = { grossC: prev.grossC + gross, cogsC: prev.cogsC + cogs };
  });

  const rows: LocRow[] = Object.entries(agg).map(([locId, a]) => ({
    id: locId, name: locId, gross: cents(a.grossC), cogs: cents(a.cogsC), net: cents(a.grossC - a.cogsC)
  })).sort((a,b)=> b.net - a.net);

  const totals = rows.reduce((t,r)=>({ gross:t.gross+r.gross, cogs:t.cogs+r.cogs, net:t.net+r.net }), {gross:0,cogs:0,net:0});

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2"><Gauge className="h-5 w-5"/> Location Profitability</h1>
        <div className="text-xs text-muted-foreground">Window: last {days} days · <Link to="?days=30" className="underline">30</Link> · <Link to="?days=60" className="underline">60</Link> · <Link to="?days=120" className="underline">120</Link></div>
      </div>

      {haveBinding === false && <SQLNotice title="machines.location_id missing (optional but recommended)" sql={LOC_MIN_SQL}/>}

      <div className="grid gap-2 sm:grid-cols-3">
        <KPI label="Locations" value={rows.length.toString()} />
        <KPI label="Total Net" value={<span className={totals.net>=0?"text-emerald-400":"text-rose-400"}>{usd(totals.net)}</span>} />
        <KPI label="Total Gross" value={usd(totals.gross)} />
      </div>

      <div className="rounded-xl border border-border overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-3 py-2 text-left">Location</th>
              <th className="px-3 py-2 text-right">Gross</th>
              <th className="px-3 py-2 text-right">COGS</th>
              <th className="px-3 py-2 text-right">Net</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.id} className="odd:bg-card/50">
                <td className="px-3 py-2">{r.name}</td>
                <td className="px-3 py-2 text-right">{usd(r.gross)}</td>
                <td className="px-3 py-2 text-right">{usd(r.cogs)}</td>
                <td className={`px-3 py-2 text-right ${r.net>=0?"text-emerald-400":"text-rose-400"}`}>{usd(r.net)}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={4} className="px-3 py-6 text-center text-sm text-muted-foreground">No location-linked sales in range.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ======================================================================
   E) SKU VELOCITY — product mix / top movers (last N days)
====================================================================== */

export function SkuVelocityReport() {
  const [sp] = useSearchParams();
  const days = Math.max(7, Math.min(120, Number(sp.get("days")) || 30));
  const since = startOfDay(addDays(new Date(), -days));

  const [prods, setProds] = useState<Record<string,string>>({});
  const [sales, setSales] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const p = await supabase.from("products").select("id,name");
      const m = new Map<string,string>((p.data||[]).map((x:any)=>[x.id, x.name || x.id]));
      setProds(Object.fromEntries(m));

      const s = await supabase
        .from("sales")
        .select("product_id, qty, unit_price_cents, unit_cost_cents, occurred_at")
        .gte("occurred_at", since.toISOString())
        .limit(50000);
      if (!s.error) setSales(s.data||[]);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const agg: Record<string,{units:number; grossC:number; cogsC:number}> = {};
  sales.forEach((row:any)=>{
    const pid = row.product_id; if (!pid) return;
    const units = toNum(row.qty);
    const grossC = units * toNum(row.unit_price_cents);
    const cogsC = units * toNum(row.unit_cost_cents);
    const prev = agg[pid] || { units:0, grossC:0, cogsC:0 };
    agg[pid] = { units: prev.units + units, grossC: prev.grossC + grossC, cogsC: prev.cogsC + cogsC };
  });

  const rows = Object.entries(agg).map(([pid,a])=>({
    product_id: pid, product: prods[pid] || pid,
    units: a.units, gross: cents(a.grossC), net: cents(a.grossC - a.cogsC),
  })).sort((a,b)=> b.units - a.units);

  const totals = rows.reduce((t,r)=>({ units:t.units+r.units, gross:t.gross+r.gross, net:t.net+r.net }), {units:0,gross:0,net:0});

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2"><Layers className="h-5 w-5"/> SKU Velocity Report</h1>
        <div className="text-xs text-muted-foreground">Window: last {days} days · <Link to="?days=14" className="underline">14</Link> · <Link to="?days=30" className="underline">30</Link> · <Link to="?days=60" className="underline">60</Link></div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <KPI label="Units" value={totals.units.toLocaleString()} />
        <KPI label="Gross" value={usd(totals.gross)} />
        <KPI label="Net" value={<span className={totals.net>=0?"text-emerald-400":"text-rose-400"}>{usd(totals.net)}</span>} />
      </div>

      <div className="rounded-xl border border-border overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-3 py-2 text-left">Product</th>
              <th className="px-3 py-2 text-right">Units</th>
              <th className="px-3 py-2 text-right">Gross</th>
              <th className="px-3 py-2 text-right">Net</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.product_id} className="odd:bg-card/50">
                <td className="px-3 py-2">{r.product}</td>
                <td className="px-3 py-2 text-right">{r.units.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{usd(r.gross)}</td>
                <td className={`px-3 py-2 text-right ${r.net>=0?"text-emerald-400":"text-rose-400"}`}>{usd(r.net)}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={4} className="px-3 py-6 text-center text-sm text-muted-foreground">No product-linked sales in range.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ======================================================================
   ROUTES EXPORT — mount all new pages
====================================================================== */
export function Phase3Routes({ ProtectedRoute }: { ProtectedRoute?: React.ComponentType<{children:React.ReactNode}> }) {
  const Wrap: React.FC<{children:React.ReactNode}> = ({ children }) =>
    ProtectedRoute ? <ProtectedRoute>{children}</ProtectedRoute> : <>{children}</>;

  return (
    <React.Fragment>
      <Route path="/reports/low-stock" element={<Wrap><LowStockReport/></Wrap>} />
      <Route path="/machines/finance-admin" element={<Wrap><MachineFinanceAdmin/></Wrap>} />
      <Route path="/finance/processor-fees" element={<Wrap><ProcessorFeesAdmin/></Wrap>} />
      <Route path="/reports/location-profitability" element={<Wrap><LocationProfitabilityReport/></Wrap>} />
      <Route path="/reports/sku-velocity" element={<Wrap><SkuVelocityReport/></Wrap>} />
    </React.Fragment>
  );
}