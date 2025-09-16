import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Play, CheckCircle2, XCircle, RefreshCw, Layers, Package, MapPin, Factory, DollarSign,
  Landmark, CreditCard, ShieldCheck, Wrench, ListChecks, Scale, BarChart3, ClipboardList
} from "lucide-react";

/** ---------- tiny helpers ---------- */
type Any = Record<string, any>;
const iso = (d=new Date()) => d.toISOString();
const daysAgo = (n:number) => { const d = new Date(); d.setDate(d.getDate()-n); return d; };
const pretty = (e:any) => {
  try { return JSON.stringify({ message: e?.message || String(e), code: e?.code, details: e?.details, hint: e?.hint }, null, 2); }
  catch { return String(e); }
};
async function hasColumn(table:string, column:string) {
  const r = await (supabase as any).from(table).select(column).limit(1);
  return !r.error;
}
async function hasTable(table:string) {
  const r = await (supabase as any).from(table).select("id").limit(1);
  return !r.error;
}

/** ---------- main page ---------- */
export default function QASmoke() {
  const [log, setLog] = useState<string[]>([]);
  const [err, setErr] = useState<string|null>(null);
  const [busy, setBusy] = useState(false);
  const [safeMode, setSafeMode] = useState(false);

  const [flags, setFlags] = useState({
    sales_unit_cost: false,
    sales_payment_method: false,
    machine_finance_table: false,
    processors_table: false,
    mappings_table: false,
    insurance_policies_table: false,
    insurance_allocations_table: false,
    ticket_sla_policies_table: false,
    processor_settlements_table: false,
  });

  const [ids, setIds] = useState<{ product?:string; location?:string; machine?:string; processor?:string; policy?:string; ticket?:string; }>({});

  const say = (s:string) => setLog(l => [...l, s]);
  const clear = () => { setLog([]); setErr(null); };

  /** ---------- detection ---------- */
  async function detectSchema() {
    const f = { ...flags };
    f.sales_unit_cost                = await hasColumn("sales","unit_cost_cents");
    f.sales_payment_method           = await hasColumn("sales","payment_method");
    f.machine_finance_table          = await hasTable("machine_finance");
    f.processors_table               = await hasTable("payment_processors");
    f.mappings_table                 = await hasTable("machine_processor_mappings");
    f.insurance_policies_table       = await hasTable("insurance_policies");
    f.insurance_allocations_table    = await hasTable("insurance_allocations");
    f.ticket_sla_policies_table      = await hasTable("ticket_sla_policies");
    f.processor_settlements_table    = await hasTable("processor_settlements");
    setFlags(f);
  }

  /** ---------- ensure base entities ---------- */
  async function ensureProduct() {
    const got = await supabase.from("products").select("id, sku").eq("sku","QA-SODA-12").maybeSingle();
    if (!got.error && got.data) return got.data.id as string;
    
    // Bootstrap QA org if needed
    await supabase.rpc('bootstrap_qa_org');
    
    const ins = await supabase.from("products").insert({ sku:"QA-SODA-12", name:"QA Soda 12oz", cost_cents: 70 }).select("id").single();
    if (ins.error) throw ins.error; return ins.data.id as string;
  }
  async function ensureLocation() {
    const got = await supabase.from("locations").select("id, name").eq("name","QA Test Site").maybeSingle();
    if (!got.error && got.data) return got.data.id as string;
    
    // Bootstrap QA org if needed
    await supabase.rpc('bootstrap_qa_org');
    
    // commission fields if exist
    const payload: Any = { name:"QA Test Site" };
    if (await hasColumn("locations","commission_model"))   payload.commission_model = "percent_gross";
    if (await hasColumn("locations","commission_pct_bps")) payload.commission_pct_bps = 1000;
    const ins = await (supabase as any).from("locations").insert(payload).select("id").single();
    if (ins.error) throw ins.error; return ins.data.id as string;
  }
  async function ensureMachine(location_id:string) {
    const got = await supabase.from("machines").select("id, name, location_id").eq("name","QA-001").maybeSingle();
    if (!got.error && got.data) {
      if (!got.data.location_id) await supabase.from("machines").update({ location_id }).eq("id", got.data.id);
      return got.data.id as string;
    }
    
    // Bootstrap QA org if needed
    await supabase.rpc('bootstrap_qa_org');
    
    const ins = await supabase.from("machines").insert({ name:"QA-001", location_id }).select("id").single();
    if (ins.error) throw ins.error; return ins.data.id as string;
  }

  /** ---------- test steps (writes) ---------- */
  async function stepBase() {
    if (safeMode) { say("Safe Mode: skipping Base (writes)."); return; }
    say("Creating base: Product, Location, Machine…");
    const pid = await ensureProduct();  setIds(i => ({ ...i, product: pid }));
    const lid = await ensureLocation(); setIds(i => ({ ...i, location: lid }));
    const mid = await ensureMachine(lid); setIds(i => ({ ...i, machine: mid }));
    say("✔ Base created/verified.");
  }
  async function stepSales() {
    if (safeMode) { say("Safe Mode: skipping Sales (writes)."); return; }
    const { product, machine } = ids;
    if (!product || !machine) throw new Error("Base missing — run Base step first.");
    say("Adding 10 sales over last 7 days…");
    const rows: Any[] = [];
    for (let i=0;i<10;i++) {
      const d = daysAgo(Math.floor(Math.random()*7));
      rows.push({
        machine_id: machine,
        product_id: product,
        qty: 1,
        unit_price_cents: 200,
        [flags.sales_unit_cost ? "unit_cost_cents" : "unit_price_cents"]: flags.sales_unit_cost ? 70 : 200,
        occurred_at: iso(d),
        ...(flags.sales_payment_method ? { payment_method: "card" } : {}),
      });
    }
    const ins = await (supabase as any).from("sales").insert(rows);
    if (ins.error) throw ins.error;
    say("✔ Sales inserted.");
  }
  async function stepFinance() {
    if (safeMode) { say("Safe Mode: skipping Finance (writes)."); return; }
    if (!flags.machine_finance_table) { say("machine_finance not present — skipping."); return; }
    const { machine } = ids; if (!machine) throw new Error("Base missing — run Base step first.");
    const probe = await supabase.from("machine_finance").select("machine_id").eq("machine_id", machine).maybeSingle();
    if (!probe.error && probe.data) { say("Finance exists — skipping."); return; }
    const ins = await (supabase as any).from("machine_finance").insert({
      machine_id: machine, purchase_price: 3500, monthly_payment: 110, apr: 9.9, acquisition_type: "finance"
    });
    if (ins.error) throw ins.error;
    say("✔ Finance added.");
  }
  async function stepProcessor() {
    if (safeMode) { say("Safe Mode: skipping Processor mapping (writes)."); return; }
    if (!flags.processors_table || !flags.mappings_table) { say("processor tables missing — skipping."); return; }
    const p = await supabase.from("payment_processors").select("id").eq("name","Cantaloupe").maybeSingle();
    let pid = p.data?.id as string|undefined;
    if (!pid) {
      const ins = await (supabase as any).from("payment_processors").insert({ name:"Cantaloupe" }).select("id").single();
      if (ins.error) throw ins.error; pid = ins.data.id;
    }
    setIds(i => ({ ...i, processor: pid }));
    const { machine } = ids; if (!machine) throw new Error("Base missing — run Base step first.");
    const map = await supabase.from("machine_processor_mappings").select("id").eq("machine_id", machine).eq("processor_id", pid).maybeSingle();
    if (!map.error && map.data) { say("Processor mapping exists — skipping."); return; }
    const ins2 = await (supabase as any).from("machine_processor_mappings").insert({ machine_id: machine, processor_id: pid });
    if (ins2.error) throw ins2.error;
    say("✔ Processor mapping added.");
  }
  async function stepInsurance() {
    if (safeMode) { say("Safe Mode: skipping Insurance (writes)."); return; }
    if (!flags.insurance_policies_table || !flags.insurance_allocations_table) { say("insurance tables missing — skipping."); return; }
    const { machine } = ids; if (!machine) throw new Error("Base missing — run Base step first.");
    const today = new Date(); const y = today.getFullYear(); const m = today.getMonth();
    const start = new Date(y, m, 1).toISOString().slice(0,10);
    const end   = new Date(y, m+1, 0).toISOString().slice(0,10);
    // policy (idempotent)
    let polId: string | undefined;
    const exist = await supabase.from("insurance_policies").select("id").eq("policy_number","QA-TEST-001").maybeSingle();
    if (!exist.error && exist.data) {
      polId = exist.data.id;
    } else {
      const ins = await (supabase as any).from("insurance_policies").insert({
        name:"QA Liability Monthly", carrier:"QA Insurance Co", policy_number:"QA-TEST-001",
        coverage_start:start, coverage_end:end, monthly_premium_cents: 3000
      }).select("id").single();
      if (ins.error) throw ins.error; polId = ins.data.id;
    }
    setIds(i => ({ ...i, policy: polId! }));
    // allocation (idempotent)
    const alloc = await supabase.from("insurance_allocations")
      .select("id").eq("policy_id", polId!).eq("level","machine").eq("machine_id", machine).maybeSingle();
    if (!alloc.error && alloc.data) { say("Insurance allocation exists — skipping."); return; }
    const ins2 = await (supabase as any).from("insurance_allocations").insert({
      policy_id: polId!, level:"machine", machine_id: machine, flat_monthly_cents: 1500
    });
    if (ins2.error) throw ins2.error;
    say("✔ Insurance allocation added.");
  }
  async function stepTicket() {
    if (safeMode) { say("Safe Mode: skipping Ticket (writes)."); return; }
    const { machine, location } = ids;
    if (!machine || !location) throw new Error("Base missing — run Base step first.");
    let due: string | null = null;
    if (flags.ticket_sla_policies_table) {
      const sla = await (supabase as any).from("ticket_sla_policies").select("minutes_to_resolve").eq("priority","normal").eq("active",true).maybeSingle();
      if (!sla.error && sla.data) {
        const d = new Date(); d.setMinutes(d.getMinutes() + (Number(sla.data.minutes_to_resolve)||1440));
        due = iso(d);
      }
    }
    const ins = await (supabase as any).from("tickets").insert({
      title:"QA: coin jam", status:"open", priority:"normal",
      machine_id: machine, location_id: location, due_at: due
    }).select("id").single();
    if (ins.error) throw ins.error;
    setIds(i => ({ ...i, ticket: ins.data.id }));
    say("✔ Ticket opened.");
  }

  /** ---------- verification (reads) ---------- */
  async function verifySales() {
    if (safeMode) { say("Safe Mode: skipping sales verification (no writes were made)."); return; }
    const { machine } = ids; if (!machine) throw new Error("No machine id; run Base.");
    const from = daysAgo(8).toISOString();
    const r = await supabase
      .from("sales")
      .select("id", { count: "exact", head: true })
      .gte("occurred_at", from)
      .eq("machine_id", machine);
    if (r.error) throw r.error;
    if ((r.count ?? 0) <= 0) throw new Error("No recent sales found.");
    say(`✔ Sales verified: ${r.count} rows in last 7d.`);
  }
  async function verifyROI() {
    // Minimum: sales table exists + unit_cost optional + finance/insurance optional
    const okSales = await hasTable("sales");
    if (!okSales) throw new Error("sales table missing");
    say("✔ ROI dependencies reachable (sales present; finance/insurance optional).");
  }
  async function verifyProductProf() {
    const r = await supabase.from("products").select("id").eq("sku","QA-SODA-12").maybeSingle();
    if (r.error || !r.data) throw new Error("QA product missing.");
    say("✔ Product Profitability dependency verified (QA product present).");
  }
  async function verifyProcessor() {
    if (!flags.processors_table) { say("processor table missing — skipping verify."); return; }
    const r = await supabase.from("payment_processors").select("id").eq("name","Cantaloupe").maybeSingle();
    if (r.error || !r.data) throw new Error("Processor 'Cantaloupe' not found.");
    say("✔ Processor verified.");
  }
  async function verifyTicket() {
    if (safeMode) { say("Safe Mode: skipping ticket verification (no writes were made)."); return; }
    const r = await supabase.from("tickets").select("id").ilike("title","QA:%").limit(1);
    if (r.error || !r.data?.length) throw new Error("No QA ticket found.");
    say("✔ Ticket verified.");
  }

  /** ---------- Orchestration ---------- */
  async function runAll() {
    setBusy(true); setErr(null); clear();
    try {
      say("Detecting schema…");
      await detectSchema();

      // Create base and optional features
      await stepBase();
      await stepSales();
      await stepFinance();
      await stepProcessor();
      await stepInsurance();
      await stepTicket();

      // Verify reads / reports dependencies
      await verifySales();
      await verifyROI();
      await verifyProductProf();
      await verifyProcessor();
      await verifyTicket();

      say("✅ All checks passed. Open the reports and pages via the links below.");
    } catch (e:any) {
      setErr(pretty(e));
      say(`❌ Smoke failed\n${pretty(e)}`);
    } finally {
      setBusy(false);
    }
  }

  /** ---------- UI ---------- */
  return (
    <div className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <div className="text-xl font-semibold flex items-center gap-2">
          <ListChecks className="h-5 w-5" /> QA Smoke — End-to-End Test
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSafeMode(s => !s)}
            disabled={busy}
            className={`inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted ${safeMode ? 'bg-amber-500/10 border-amber-500/30' : 'bg-card'}`}
            title="Safe Mode skips writes (no inserts/updates)"
          >
            {safeMode ? 'Safe Mode: ON' : 'Safe Mode: OFF'}
          </button>
          <button onClick={runAll} disabled={busy} className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted disabled:opacity-50">
            <Play className="h-4 w-4" /> Run All
          </button>
          <button onClick={async()=>{ setErr(null); clear(); await detectSchema(); }} disabled={busy} className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted disabled:opacity-50">
            <RefreshCw className="h-4 w-4" /> Re-detect schema
          </button>
        </div>
      </header>

      {err && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs whitespace-pre-wrap">
          <div className="font-medium mb-1">Error</div>
          {err}
          <div className="mt-2 text-[11px] opacity-80">
            Tip: If you see RLS/permission errors, open <Link to="/ops/console" className="underline">Ops Console</Link> → copy the temporary dev-open policy and paste into Supabase SQL to unblock testing (remember to tighten later).
          </div>
        </div>
      )}

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
          <StepCard title="Base entities" icon={<Layers className="h-4 w-4" />} actions={[
            { label: "Run", onClick: stepBase, icon: <Play className="h-4 w-4" /> }
          ]}/>
          <StepCard title="Sales (7d)" icon={<DollarSign className="h-4 w-4" />} actions={[
            { label: "Run", onClick: stepSales, icon: <Play className="h-4 w-4" /> }
          ]}/>
          <StepCard title="Finance" icon={<Landmark className="h-4 w-4" />} note={flags.machine_finance_table ? "supported" : "missing — will be skipped"} actions={[
            { label: "Run", onClick: stepFinance, icon: <Play className="h-4 w-4" /> }
          ]}/>
          <StepCard title="Processor Map" icon={<CreditCard className="h-4 w-4" />} note={(flags.processors_table && flags.mappings_table) ? "supported" : "missing — will be skipped"} actions={[
            { label: "Run", onClick: stepProcessor, icon: <Play className="h-4 w-4" /> }
          ]}/>
          <StepCard title="Insurance" icon={<ShieldCheck className="h-4 w-4" />} note={(flags.insurance_policies_table && flags.insurance_allocations_table) ? "supported" : "missing — will be skipped"} actions={[
            { label: "Run", onClick: stepInsurance, icon: <Play className="h-4 w-4" /> }
          ]}/>
          <StepCard title="Open Ticket" icon={<Wrench className="h-4 w-4" />} actions={[
            { label: "Run", onClick: stepTicket, icon: <Play className="h-4 w-4" /> }
          ]}/>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="font-medium mb-2">Sanity Links (open after Run All)</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
          <Nav to="/ops/console" label="Ops Console (Health)" icon={<Scale className="h-4 w-4" />} />
          <Nav to="/reports/machine-roi" label="Machine ROI" icon={<Scale className="h-4 w-4" />} />
          <Nav to="/reports/product-profitability" label="Product Profitability" icon={<BarChart3 className="h-4 w-4" />} />
          <Nav to="/finance/processors" label="Payment Processors" icon={<CreditCard className="h-4 w-4" />} />
          <Nav to="/tickets" label="Tickets" icon={<Wrench className="h-4 w-4" />} />
          <Nav to="/machines" label="Machines" icon={<Factory className="h-4 w-4" />} />
          <Nav to="/locations" label="Locations" icon={<MapPin className="h-4 w-4" />} />
          <Nav to="/products" label="Products" icon={<Package className="h-4 w-4" />} />
          <Nav to="/sales" label="Sales Entry" icon={<DollarSign className="h-4 w-4" />} />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="font-medium mb-2">Log</div>
        <div className="text-xs grid gap-1">
          {log.length===0 ? <div className="opacity-60">No recent actions.</div> : log.map((l, i)=>(
            <div key={i} className="rounded-md border border-border bg-background px-2 py-1">{l}</div>
          ))}
        </div>
      </section>
    </div>
  );
}

/** ---------- small presentational bits ---------- */
function StepCard({ title, icon, note, actions }:{
  title: string; icon: React.ReactNode; note?: string;
  actions: { label:string; onClick: ()=>void; icon?: React.ReactNode }[];
}) {
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">{icon}{title}</div>
        <div className="flex items-center gap-2">
          {actions.map((a, i)=>(
            <button key={i} onClick={a.onClick} className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs hover:bg-muted">
              {a.icon}{a.label}
            </button>
          ))}
        </div>
      </div>
      {note && <div className="text-[11px] text-muted-foreground mt-1">{note}</div>}
    </div>
  );
}
function Nav({ to, label, icon }:{ to:string; label:string; icon:React.ReactNode; }) {
  return (
    <Link to={to} className="rounded-lg border border-border bg-background px-3 py-2 hover:bg-muted inline-flex items-center gap-2">
      {icon}{label}
    </Link>
  );
}