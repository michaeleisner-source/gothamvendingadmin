import React, { useEffect, useMemo, useState } from "react";
import { Link, Route, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import {
  Landmark, TrendingUp, Route as RouteIcon,
  AlertTriangle, CheckCircle2, Info
} from "lucide-react";

/* =============================== helpers =============================== */
const fmtUSD = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD" });
const toNum = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const cents = (v: any) => (Number.isFinite(Number(v)) ? Number(v) / 100 : 0);
const daysBetween = (a: Date, b: Date) => Math.abs(a.getTime() - b.getTime()) / 86400000;
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/* Small SQL banner */
function SQLNotice({ title, sql }: { title: string; sql: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 mb-4">
      <div className="text-sm font-medium flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500"/>{title}</div>
      <div className="mt-2 text-xs text-muted-foreground">Run this once in Supabase → SQL Editor, then reload:</div>
      <pre className="mt-2 text-xs overflow-auto rounded bg-muted p-2">{sql}</pre>
    </div>
  );
}

/* =============================== MACHINE ROI ===============================

Data strategy:
- Machines: id, name, purchase/acquisition cost from either:
  - machine_finance.purchase_price OR machines.purchase_price_cents/acquisition_cost_cents
  - monthly fixed fees from machine_finance.monthly_payment OR machines.monthly_fee_cents/telemetry_fee_cents (if present)
- Sales window (default 90d, override with ?days=NN): sales.qty * unit_price_cents, COGS via unit_cost_cents (if present)
- Processor fees if processor_fees table exists (machine_id, amount_cents, occurred_at); else 0
- Net profit = gross - cogs - processor_fees
- Monthly net = (net / days) * 30.4
- Payback months = acquisition_cost / monthly_net (if monthly_net > 0)

Handles missing tables gracefully, with SQL hints.
============================================================================ */

const MACHINE_FINANCE_SQL = `-- Enhanced finance to support real ROI calculations
DO $$
BEGIN
  -- Check if machine_finance table exists and has the right columns
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'machine_finance') THEN
    CREATE TABLE public.machine_finance (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id uuid NOT NULL,
      machine_id uuid NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
      acquisition_type text NOT NULL CHECK (acquisition_type IN ('purchase', 'lease', 'loan')),
      purchase_price numeric,
      supplier_id uuid REFERENCES public.suppliers(id),
      purchased_at date,
      term_months integer,
      apr numeric,
      monthly_payment numeric,
      first_payment_date date,
      balloon_payment numeric,
      salvage_value numeric DEFAULT 0,
      depreciation_method text DEFAULT 'straight_line',
      life_months integer,
      insured boolean DEFAULT false,
      insurance_monthly numeric,
      insurance_provider text,
      insurance_policy_no text,
      telemetry_monthly numeric,
      data_plan_monthly numeric,
      lender text,
      notes text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
    
    CREATE INDEX idx_machine_finance_machine ON public.machine_finance(machine_id);
    CREATE INDEX idx_machine_finance_org ON public.machine_finance(org_id);
  END IF;
END $$;`;

const PROCESSOR_FEES_SQL = `-- Real-time processor fees tracking
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'processor_fees') THEN
    CREATE TABLE public.processor_fees (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id uuid NOT NULL,
      machine_id uuid REFERENCES public.machines(id) ON DELETE SET NULL,
      processor_id uuid REFERENCES public.payment_processors(id),
      transaction_id text,
      amount_cents integer NOT NULL,
      fee_type text DEFAULT 'transaction', -- 'transaction', 'monthly', 'setup'
      occurred_at timestamptz NOT NULL DEFAULT now(),
      created_at timestamptz DEFAULT now()
    );
    
    CREATE INDEX idx_procfees_machine ON public.processor_fees(machine_id);
    CREATE INDEX idx_procfees_date ON public.processor_fees(occurred_at);
    CREATE INDEX idx_procfees_org ON public.processor_fees(org_id);
  END IF;
END $$;`;

type RoiRow = {
  id: string; name: string;
  acquisitionUsd: number; monthlyFixedUsd: number;
  grossUsd: number; cogsUsd: number; feesUsd: number;
  netUsd: number; monthlyNetUsd: number; paybackMonths: number | null;
};

export function MachineROIReport() {
  const [sp] = useSearchParams();
  const days = Math.max(7, Math.min(365, Number(sp.get("days")) || 90));
  const since = startOfDay(addDays(new Date(), -days));

  const [machines, setMachines] = useState<Array<{id:string, name?:string|null}>>([]);
  const [finance, setFinance] = useState<Record<string, {capexC?:number; monthlyC?:number}>>({});
  const [haveFinance, setHaveFinance] = useState<boolean | null>(null);

  const [salesAgg, setSalesAgg] = useState<Record<string,{grossC:number; cogsC:number}>>({});
  const [feesAgg, setFeesAgg] = useState<Record<string, number>>({});
  const [haveFees, setHaveFees] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      // machines
      const m = await supabase.from("machines").select("id, name");
      const list = (m.data || []) as any[];
      setMachines(list.map(x => ({ id: x.id, name: x.name || x.id })));

      // try machine_finance with real calculations
      const mf = await supabase.from("machine_finance").select("machine_id, purchase_price, monthly_payment, insurance_monthly, telemetry_monthly, data_plan_monthly").limit(10000);
      if (!mf.error) {
        setHaveFinance(true);
        const financeMap: Record<string,{capexC?:number; monthlyC?:number}> = {};
        (mf.data || []).forEach((r:any) => {
          const totalMonthly = (toNum(r.monthly_payment) + toNum(r.insurance_monthly) + toNum(r.telemetry_monthly) + toNum(r.data_plan_monthly));
          financeMap[r.machine_id] = {
            capexC: toNum(r.purchase_price) * 100, // convert to cents
            monthlyC: totalMonthly * 100 // convert to cents
          };
        });
        setFinance(financeMap);
      } else {
        setHaveFinance(false);
        // Fallback with placeholder data
        const placeholderFinance: Record<string,{capexC?:number; monthlyC?:number}> = {};
        list.forEach(x => {
          placeholderFinance[x.id] = {
            capexC: 500000, // $5000 placeholder
            monthlyC: 10000  // $100 placeholder
          };
        });
        setFinance(placeholderFinance);
      }

      // sales with proper COGS calculation
      const s = await supabase
        .from("sales")
        .select("machine_id, qty, unit_price_cents, unit_cost_cents, occurred_at")
        .gte("occurred_at", since.toISOString())
        .limit(50000);
      const sAgg: Record<string,{grossC:number; cogsC:number}> = {};
      if (!s.error) {
        (s.data || []).forEach((row:any) => {
          const mid = row.machine_id; if (!mid) return;
          const gross = toNum(row.qty) * toNum(row.unit_price_cents);
          const cogs = toNum(row.qty) * toNum(row.unit_cost_cents);
          const prev = sAgg[mid] || { grossC:0, cogsC:0 };
          sAgg[mid] = { grossC: prev.grossC + gross, cogsC: prev.cogsC + cogs };
        });
      }
      setSalesAgg(sAgg);

      // processor fees (real calculation)
      const pf = await (supabase as any)
        .from("processor_fees")
        .select("machine_id, amount_cents, occurred_at")
        .gte("occurred_at", since.toISOString())
        .limit(50000);
      if (!pf.error) {
        setHaveFees(true);
        const fAgg: Record<string, number> = {};
        (pf.data || []).forEach((r:any) => {
          if (!r.machine_id) return;
          fAgg[r.machine_id] = (fAgg[r.machine_id] || 0) + toNum(r.amount_cents);
        });
        setFeesAgg(fAgg);
      } else {
        setHaveFees(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const rows: RoiRow[] = useMemo(() => {
    return machines.map(m => {
      const f = finance[m.id] || {};
      const s = salesAgg[m.id] || { grossC:0, cogsC:0 };
      const feesC = feesAgg[m.id] || 0;

      const acquisitionUsd = cents(f.capexC || 0);
      const monthlyFixedUsd = cents(f.monthlyC || 0);
      const grossUsd = cents(s.grossC);
      const cogsUsd = cents(s.cogsC);
      const feesUsd = cents(feesC);
      const netUsd = grossUsd - cogsUsd - feesUsd;
      const monthlyNetUsd = (netUsd / days) * 30.4; // normalize
      const paybackMonths = monthlyNetUsd > 0 && acquisitionUsd > 0 ? (acquisitionUsd / monthlyNetUsd) : null;

      return { id: m.id, name: m.name, acquisitionUsd, monthlyFixedUsd, grossUsd, cogsUsd, feesUsd, netUsd, monthlyNetUsd, paybackMonths };
    }).sort((a,b) => (a.paybackMonths || 1e9) - (b.paybackMonths || 1e9)); // best payback first
  }, [machines, finance, salesAgg, feesAgg, days]);

  const totals = rows.reduce((t, r) => ({
    gross: t.gross + r.grossUsd,
    cogs: t.cogs + r.cogsUsd,
    fees: t.fees + r.feesUsd,
    net: t.net + r.netUsd
  }), { gross:0, cogs:0, fees:0, net:0 });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2"><Landmark className="h-5 w-5"/> Machine ROI Analysis</h1>
        <div className="text-xs text-muted-foreground">
          Window: last {days} days · <Link to="?days=30" className="underline">30</Link> · <Link to="?days=90" className="underline">90</Link> · <Link to="?days=180" className="underline">180</Link>
        </div>
      </div>

      {haveFinance === false && <SQLNotice title="Machine finance table missing - using placeholder data" sql={MACHINE_FINANCE_SQL} />}
      {haveFees === false && <SQLNotice title="Processor fees table missing - fees set to $0" sql={PROCESSOR_FEES_SQL} />}

      <div className="grid gap-2 sm:grid-cols-4">
        <KPI label="Gross Revenue" value={fmtUSD(totals.gross)} />
        <KPI label="Cost of Goods" value={fmtUSD(totals.cogs)} />
        <KPI label="Processing Fees" value={fmtUSD(totals.fees)} />
        <KPI label="Net Profit" value={<span className={totals.net>=0?"text-emerald-400":"text-rose-400"}>{fmtUSD(totals.net)}</span>} />
      </div>

      <div className="rounded-xl border border-border overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-3 py-2 text-left">Machine</th>
              <th className="px-3 py-2 text-right">Acquisition Cost</th>
              <th className="px-3 py-2 text-right">Monthly Fixed</th>
              <th className="px-3 py-2 text-right">Gross Revenue</th>
              <th className="px-3 py-2 text-right">COGS</th>
              <th className="px-3 py-2 text-right">Processing Fees</th>
              <th className="px-3 py-2 text-right">Net Profit</th>
              <th className="px-3 py-2 text-right">Monthly Net</th>
              <th className="px-3 py-2 text-right">Payback (months)</th>
              <th className="px-3 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="odd:bg-card/50">
                <td className="px-3 py-2 font-medium">{r.name}</td>
                <td className="px-3 py-2 text-right">{fmtUSD(r.acquisitionUsd)}</td>
                <td className="px-3 py-2 text-right">{fmtUSD(r.monthlyFixedUsd)}</td>
                <td className="px-3 py-2 text-right">{fmtUSD(r.grossUsd)}</td>
                <td className="px-3 py-2 text-right">{fmtUSD(r.cogsUsd)}</td>
                <td className="px-3 py-2 text-right">{fmtUSD(r.feesUsd)}</td>
                <td className={`px-3 py-2 text-right font-medium ${r.netUsd>=0?"text-emerald-600":"text-rose-600"}`}>{fmtUSD(r.netUsd)}</td>
                <td className="px-3 py-2 text-right">{fmtUSD(r.monthlyNetUsd)}</td>
                <td className="px-3 py-2 text-right font-medium">{r.paybackMonths ? r.paybackMonths.toFixed(1) : "—"}</td>
                <td className="px-3 py-2 text-center">
                  <Link to={`/machines/${r.id}`} className="text-xs text-primary hover:underline">View Details</Link>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={10} className="px-3 py-6 text-center text-sm text-muted-foreground">No machines found or no sales data in selected period.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-muted-foreground flex items-start gap-2">
        <Info className="h-4 w-4 mt-0.5 flex-shrink-0"/>
        <span>Monthly net profit is annualized from period data. Payback calculated as acquisition cost ÷ monthly net profit. 
        Add real finance data in <code>machine_finance</code> table and processor fees in <code>processor_fees</code> for accurate calculations.</span>
      </div>
    </div>
  );
}

/* =============================== PROSPECT FUNNEL ===============================

- Auto-detects stage/status column, created_at, won_at/lost_at if present
- KPIs: counts by stage, win rate (won / (won+lost)), avg/median cycle time to win
- SQL hint to add won_at / lost_at if missing

============================================================================ */

const PROSPECTS_ENHANCE_SQL = `-- Enhanced prospect tracking for cycle time analysis
DO $$
BEGIN
  -- Add timestamp columns for precise funnel analysis
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'prospects' AND column_name = 'won_at') THEN
    ALTER TABLE public.prospects ADD COLUMN won_at timestamptz;
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'prospects' AND column_name = 'lost_at') THEN
    ALTER TABLE public.prospects ADD COLUMN lost_at timestamptz;
  END IF;
  
  -- Add trigger to automatically stamp won_at/lost_at when stage changes
  CREATE OR REPLACE FUNCTION update_prospect_timestamps()
  RETURNS TRIGGER AS $trigger$
  BEGIN
    IF NEW.stage = 'won' AND OLD.stage != 'won' THEN
      NEW.won_at = now();
    ELSIF NEW.stage = 'lost' AND OLD.stage != 'lost' THEN
      NEW.lost_at = now();
    END IF;
    NEW.updated_at = now();
    RETURN NEW;
  END;
  $trigger$ LANGUAGE plpgsql;
  
  DROP TRIGGER IF EXISTS prospect_stage_timestamps ON public.prospects;
  CREATE TRIGGER prospect_stage_timestamps
    BEFORE UPDATE ON public.prospects
    FOR EACH ROW
    EXECUTE FUNCTION update_prospect_timestamps();
END $$;`;

type ProspectRow = Record<string, any>;

export function ProspectFunnelReport() {
  const [rows, setRows] = useState<ProspectRow[]>([]);
  const [tableOk, setTableOk] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const probe = await supabase.from("prospects").select("*").limit(1);
      setTableOk(!probe.error);
      if (probe.error) return;
      const all = await supabase.from("prospects").select("*").order("created_at", { ascending: false }).limit(5000);
      setRows(all.data || []);
    })();
  }, []);

  const sample = rows[0] || {};
  const pick = (...names: string[]) => names.find(n => n in sample) || names[0];

  const col = {
    name: pick("business_name","name","company_name"),
    stage: pick("stage","status"),
    created_at: pick("created_at"),
    won_at: pick("won_at"),
    lost_at: pick("lost_at")
  };

  const byStage = useMemo(() => {
    const map: Record<string, ProspectRow[]> = {};
    rows.forEach(r => {
      const s = (r[col.stage] || "new") as string;
      map[s] = map[s] || []; map[s].push(r);
    });
    return map;
  }, [rows, col.stage]);

  const won = rows.filter(r => (r[col.stage] || "").toLowerCase() === "won");
  const lost = rows.filter(r => (r[col.stage] || "").toLowerCase() === "lost");

  // Cycle time (days) for WON prospects
  const wonDurations = won.map(r => {
    const c = r[col.created_at] ? new Date(r[col.created_at]) : null;
    const w = r[col.won_at] ? new Date(r[col.won_at]) : null;
    if (c && w) return daysBetween(c, w);
    // fallback: if won_at missing, assume updated recently
    if (c && !w) return daysBetween(c, new Date());
    return null;
  }).filter(Boolean) as number[];

  const avg = (arr:number[]) => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
  const median = (arr:number[]) => {
    if (!arr.length) return 0; const s=[...arr].sort((a,b)=>a-b); const m=Math.floor(s.length/2);
    return s.length%2? s[m] : (s[m-1]+s[m])/2;
  };

  const winRate = (won.length + lost.length) ? (won.length / (won.length + lost.length)) : 0;

  const stageOrder = ["new","contacted","site_visit","proposal","won","lost"];
  const stageCards = stageOrder.map(s => ({ 
    stage: s, 
    count: (byStage[s]||[]).length,
    displayName: s.replace("_", " ").toUpperCase()
  }));

  // Calculate conversion rates between stages
  const totalProspects = rows.length;
  const conversionRates = stageCards.map(s => ({
    ...s,
    conversionRate: totalProspects > 0 ? (s.count / totalProspects) * 100 : 0
  }));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2"><TrendingUp className="h-5 w-5"/> Prospect Funnel Analysis</h1>
        <div className="text-xs text-muted-foreground">Based on <code>prospects</code> table · {rows.length} total prospects</div>
      </div>

      {tableOk === false && <SQLNotice title="Prospects table not found" sql={`-- Your prospects table should have these columns:
CREATE TABLE IF NOT EXISTS public.prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  stage text DEFAULT 'new' CHECK (stage IN ('new','contacted','site_visit','proposal','won','lost')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);`} />}

      <div className="grid gap-2 sm:grid-cols-5">
        <KPI label="Total Prospects" value={rows.length.toLocaleString()} />
        <KPI label="Won" value={<span className="text-emerald-600">{won.length.toLocaleString()}</span>} />
        <KPI label="Lost" value={<span className="text-rose-600">{lost.length.toLocaleString()}</span>} />
        <KPI label="Win Rate" value={<span className="text-primary">{Math.round(winRate*100)}%</span>} />
        <KPI label="Avg Days to Win" value={Math.round(avg(wonDurations)).toString()} />
      </div>

      <div className="rounded-xl border border-border overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              {conversionRates.map(s => (
                <th key={s.stage} className="px-3 py-2 text-left">{s.displayName}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {conversionRates.map(c => (
                <td key={c.stage} className="px-3 py-2">
                  <div className="font-medium">{c.count}</div>
                  <div className="text-xs text-muted-foreground">{c.conversionRate.toFixed(1)}%</div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <KPI label="Median Days to Win" value={Math.round(median(wonDurations)).toString()} />
        <KPI label="Active Pipeline" value={(totalProspects - won.length - lost.length).toString()} />
      </div>

      {(!("won_at" in sample) || !("lost_at" in sample)) && (
        <SQLNotice title="Enhance with precise cycle time tracking" sql={PROSPECTS_ENHANCE_SQL}/>
      )}
    </div>
  );
}

/* =============================== ROUTE EFFICIENCY ===============================

Enhanced delivery route analysis with revenue attribution and efficiency metrics.

============================================================================ */

const ROUTES_ENHANCED_SQL = `-- Complete route efficiency tracking system
DO $$
BEGIN
  -- Delivery routes table
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'delivery_routes') THEN
    CREATE TABLE public.delivery_routes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id uuid NOT NULL,
      name text NOT NULL,
      description text,
      active boolean DEFAULT true,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
    CREATE INDEX idx_delivery_routes_org ON public.delivery_routes(org_id);
  END IF;
  
  -- Route runs with telemetry
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'route_runs') THEN
    CREATE TABLE public.route_runs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id uuid NOT NULL,
      route_id uuid NOT NULL REFERENCES public.delivery_routes(id) ON DELETE CASCADE,
      run_date date NOT NULL,
      start_time timestamptz,
      end_time timestamptz,
      miles numeric,
      fuel_cost numeric,
      driver_id uuid REFERENCES public.staff(id),
      notes text,
      created_at timestamptz DEFAULT now()
    );
    CREATE INDEX idx_route_runs_route ON public.route_runs(route_id);
    CREATE INDEX idx_route_runs_date ON public.route_runs(run_date);
  END IF;
  
  -- Machine to route mapping
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'machines' AND column_name = 'route_id') THEN
    ALTER TABLE public.machines ADD COLUMN route_id uuid REFERENCES public.delivery_routes(id);
    CREATE INDEX idx_machines_route ON public.machines(route_id);
  END IF;
END $$;`;

type RouteRow = { 
  id: string; name: string; 
  grossUsd: number; miles: number; hours: number; runs: number;
  rpm: number; rph: number; efficiency: number;
};

export function RouteEfficiencyReport() {
  const [sp] = useSearchParams();
  const days = Math.max(7, Math.min(120, Number(sp.get("days")) || 30));
  const since = startOfDay(addDays(new Date(), -days));

  const [routes, setRoutes] = useState<Array<{id:string; name:string}>>([]);
  const [haveRoutes, setHaveRoutes] = useState<boolean | null>(null);
  const [runs, setRuns] = useState<Array<{route_id:string; miles:number; hours:number}>>([]);
  const [haveRuns, setHaveRuns] = useState<boolean | null>(null);
  const [machineRoute, setMachineRoute] = useState<Record<string,string>>({});
  const [salesGross, setSalesGross] = useState<Record<string, number>>({}); // keyed by route_id
  const [routeBinding, setRouteBinding] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      // routes
      const r = await (supabase as any).from("delivery_routes").select("id,name").order("name");
      if (!r.error) {
        setHaveRoutes(true);
        setRoutes((r.data || []).map((x:any)=>({ id:x.id, name:x.name || x.id })));
      } else {
        setHaveRoutes(false);
      }

      // runs with calculated hours
      const rr = await (supabase as any).from("route_runs").select("route_id, miles, start_time, end_time, run_date").gte("run_date", since.toISOString().slice(0,10));
      if (!rr.error) {
        setHaveRuns(true);
        const compact = (rr.data || []).map((x:any)=>{
          let hours = 0;
          if (x.start_time && x.end_time) {
            const start = new Date(x.start_time);
            const end = new Date(x.end_time);
            hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          }
          return { route_id:x.route_id, miles: Number(x.miles)||0, hours: Math.max(hours, 0) };
        });
        setRuns(compact);
      } else {
        setHaveRuns(false);
      }

      // machine to route mapping
      const mProbe = await supabase.from("machines").select("id, route_id").limit(1);
      if (!mProbe.error) {
        setRouteBinding(true);
        const mAll = await supabase.from("machines").select("id, route_id").limit(10000);
        const map: Record<string,string> = {};
        (mAll.data || []).forEach((x:any)=>{ if (x.route_id) map[x.id] = x.route_id; });
        setMachineRoute(map);

        // sales attribution to routes
        const s = await supabase.from("sales")
          .select("machine_id, qty, unit_price_cents, occurred_at")
          .gte("occurred_at", since.toISOString())
          .limit(50000);
        const routeGross: Record<string, number> = {};
        if (!s.error) {
          (s.data || []).forEach((row:any)=>{
            const mid = row.machine_id; if (!mid) return;
            const rid = map[mid]; if (!rid) return;
            const gross = toNum(row.qty) * toNum(row.unit_price_cents);
            routeGross[rid] = (routeGross[rid] || 0) + gross;
          });
        }
        setSalesGross(routeGross);
      } else {
        setRouteBinding(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const runAgg = useMemo(() => {
    const agg: Record<string,{miles:number; hours:number; runs:number}> = {};
    runs.forEach(r => {
      const prev = agg[r.route_id] || { miles:0, hours:0, runs:0 };
      agg[r.route_id] = { 
        miles: prev.miles + r.miles, 
        hours: prev.hours + r.hours, 
        runs: prev.runs + 1 
      };
    });
    return agg;
  }, [runs]);

  const rows: RouteRow[] = useMemo(() => {
    const idToName: Record<string,string> = {};
    routes.forEach(r => idToName[r.id] = r.name);
    const ids = new Set<string>([...routes.map(r=>r.id), ...Object.keys(runAgg), ...Object.keys(salesGross)]);
    return [...ids].map(id => {
      const name = idToName[id] || id;
      const grossUsd = cents(salesGross[id] || 0);
      const miles = runAgg[id]?.miles || 0;
      const hours = runAgg[id]?.hours || 0;
      const runs = runAgg[id]?.runs || 0;
      const rpm = miles > 0 ? (grossUsd / miles) : 0;
      const rph = hours > 0 ? (grossUsd / hours) : 0;
      // Efficiency score: revenue per mile per hour (composite metric)
      const efficiency = (miles > 0 && hours > 0) ? grossUsd / (miles * hours) : 0;
      return { id, name, grossUsd, miles, hours, runs, rpm, rph, efficiency };
    }).sort((a,b)=> (b.efficiency - a.efficiency));
  }, [routes, runAgg, salesGross]);

  const totals = rows.reduce((t, r) => ({
    gross: t.gross + r.grossUsd,
    miles: t.miles + r.miles,
    hours: t.hours + r.hours,
    runs: t.runs + r.runs
  }), { gross:0, miles:0, hours:0, runs:0 });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2"><RouteIcon className="h-5 w-5"/> Route Efficiency Analysis</h1>
        <div className="text-xs text-muted-foreground">
          Window: last {days} days · <Link to="?days=14" className="underline">14</Link> · <Link to="?days=30" className="underline">30</Link> · <Link to="?days=60" className="underline">60</Link>
        </div>
      </div>

      {haveRoutes === false && <SQLNotice title="Delivery routes system not configured" sql={ROUTES_ENHANCED_SQL}/>}
      {haveRuns === false && <SQLNotice title="Route runs tracking not configured" sql={ROUTES_ENHANCED_SQL}/>}
      {routeBinding === false && <SQLNotice title="Machine-to-route mapping missing" sql={ROUTES_ENHANCED_SQL}/>}

      <div className="grid gap-2 sm:grid-cols-4">
        <KPI label="Active Routes" value={rows.length.toString()} />
        <KPI label="Total Revenue" value={fmtUSD(totals.gross)} />
        <KPI label="Total Miles" value={totals.miles.toFixed(0)} />
        <KPI label="Total Runs" value={totals.runs.toString()} />
      </div>

      <div className="rounded-xl border border-border overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-3 py-2 text-left">Route</th>
              <th className="px-3 py-2 text-right">Revenue</th>
              <th className="px-3 py-2 text-right">Miles</th>
              <th className="px-3 py-2 text-right">Hours</th>
              <th className="px-3 py-2 text-right">Runs</th>
              <th className="px-3 py-2 text-right">$/Mile</th>
              <th className="px-3 py-2 text-right">$/Hour</th>
              <th className="px-3 py-2 text-right">Efficiency Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="odd:bg-card/50">
                <td className="px-3 py-2 font-medium">{r.name}</td>
                <td className="px-3 py-2 text-right">{fmtUSD(r.grossUsd)}</td>
                <td className="px-3 py-2 text-right">{r.miles.toFixed(1)}</td>
                <td className="px-3 py-2 text-right">{r.hours.toFixed(1)}</td>
                <td className="px-3 py-2 text-right">{r.runs}</td>
                <td className="px-3 py-2 text-right">{fmtUSD(r.rpm)}</td>
                <td className="px-3 py-2 text-right">{fmtUSD(r.rph)}</td>
                <td className="px-3 py-2 text-right font-medium">{r.efficiency.toFixed(2)}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={8} className="px-3 py-6 text-center text-sm text-muted-foreground">No routes configured or insufficient data.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-muted-foreground flex items-start gap-2">
        <Info className="h-4 w-4 mt-0.5 flex-shrink-0"/>
        <span>
          Efficiency Score = Revenue ÷ (Miles × Hours). Higher scores indicate more profitable routes. 
          Configure machine-to-route mapping and track route runs with start/end times for accurate analysis.
        </span>
      </div>
    </div>
  );
}

/* =============================== shared KPI component =============================== */
function KPI({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

/* =============================== ROUTES EXPORT =============================== */
export function BusinessIntelligenceRoutes({ ProtectedRoute }: { ProtectedRoute?: React.ComponentType<{children:React.ReactNode}> }) {
  const Wrap: React.FC<{children:React.ReactNode}> = ({ children }) =>
    ProtectedRoute ? <ProtectedRoute>{children}</ProtectedRoute> : <>{children}</>;

  return (
    <>
      <Route path="/reports/machine-roi" element={<Wrap><MachineROIReport/></Wrap>} />
      <Route path="/reports/prospect-funnel" element={<Wrap><ProspectFunnelReport/></Wrap>} />
      <Route path="/reports/route-efficiency" element={<Wrap><RouteEfficiencyReport/></Wrap>} />
    </>
  );
}