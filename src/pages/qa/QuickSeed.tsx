import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Layers, Package, MapPin, Factory, DollarSign, Landmark, CreditCard, ShieldCheck,
  Wrench, CheckCircle2, XCircle, RefreshCw, ListChecks, Scale, BarChart3
} from "lucide-react";

/** tiny helpers */
type Any = Record<string, any>;
const iso = (d=new Date()) => d.toISOString();
const money = (c?: number|null) => typeof c === "number" ? `$${(c/100).toFixed(2)}` : "—";
const daysAgo = (n:number) => { const d = new Date(); d.setDate(d.getDate()-n); return d; };
const pretty = (e:any) => {
  try { return JSON.stringify({message:e?.message||String(e), code:e?.code, details:e?.details, hint:e?.hint}, null, 2); }
  catch { return String(e); }
};

export default function QuickSeed() {
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string|null>(null);

  const say = (s:string)=> setLog(l=>[...l, s]);
  const clear = ()=> { setLog([]); setErr(null); };

  /** schema feature checks so we don't error on missing columns/tables */
  const [flags, setFlags] = useState({
    sales_unit_cost: false,
    sales_payment_method: false,
    machine_finance: false,
    processors: false,
    mappings: false,
    insurance_policies: false,
    insurance_allocations: false,
    ticket_sla_policies: false,
    processor_settlements: false,
  });

  const [ids, setIds] = useState<{product?:string; location?:string; machine?:string; processor?:string; policy?:string; ticket?:string;}>({});

  async function col(table:string, column:string) {
    const r = await (supabase as any).from(table).select(column).limit(1);
    return !r.error; // false if column doesn't exist
  }
  async function tbl(table:string) {
    const r = await (supabase as any).from(table).select("id").limit(1);
    return !r.error;
  }

  async function detect() {
    const f = { ...flags };
    f.sales_unit_cost = await col("sales","unit_cost_cents");
    f.sales_payment_method = await col("sales","payment_method");
    f.machine_finance = await col("machine_finance","monthly_payment");
    f.processors = await tbl("payment_processors");
    f.mappings = await tbl("machine_processor_mappings");
    f.insurance_policies = await tbl("insurance_policies");
    f.insurance_allocations = await tbl("insurance_allocations");
    f.ticket_sla_policies = await tbl("ticket_sla_policies");
    f.processor_settlements = await tbl("processor_settlements");
    setFlags(f);
  }

  async function ensureProduct() {
    const got = await supabase.from("products").select("id, sku, name, cost_cents").eq("sku","QA-SODA-12").maybeSingle();
    if (!got.error && got.data) return got.data.id as string;
    const ins = await supabase.from("products").insert({ sku:"QA-SODA-12", name:"QA Soda 12oz", cost_cents: 70 }).select("id").single();
    if (ins.error) throw ins.error; return ins.data.id as string;
  }
  async function ensureLocation() {
    const got = await supabase.from("locations").select("id, name").eq("name","QA Test Site").maybeSingle();
    if (!got.error && got.data) return got.data.id as string;
    // commission fields if present
    let payload: Any = { name:"QA Test Site" };
    const cm = await col("locations","commission_model");
    const bps = await col("locations","commission_pct_bps");
    if (cm) payload.commission_model = "percent_gross";
    if (bps) payload.commission_pct_bps = 1000;
    const ins = await supabase.from("locations").insert(payload as any).select("id").single();
    if (ins.error) throw ins.error; return ins.data.id as string;
  }
  async function ensureMachine(location_id:string) {
    const got = await supabase.from("machines").select("id, name, location_id").eq("name","QA-001").maybeSingle();
    if (!got.error && got.data) {
      if (!got.data.location_id) await supabase.from("machines").update({ location_id }).eq("id", got.data.id);
      return got.data.id as string;
    }
    const ins = await supabase.from("machines").insert({ name:"QA-001", location_id }).select("id").single();
    if (ins.error) throw ins.error; return ins.data.id as string;
  }

  async function seedBase() {
    setBusy(true); setErr(null); clear();
    try {
      say("Detecting schema features…");
      await detect();

      say("Creating Product…");
      const pid = await ensureProduct(); setIds(i=>({ ...i, product: pid }));

      say("Creating Location…");
      const lid = await ensureLocation(); setIds(i=>({ ...i, location: lid }));

      say("Creating Machine…");
      const mid = await ensureMachine(lid); setIds(i=>({ ...i, machine: mid }));

      say("✔ Base complete.");
    } catch (e:any) {
      setErr(pretty(e)); say(`❌ Base failed\n${pretty(e)}`);
    } finally { setBusy(false); }
  }

  async function addSales() {
    setBusy(true); setErr(null);
    try {
      const { product, machine } = ids;
      if (!product || !machine) throw new Error("Run Base first.");
      say("Recording 10 sales over the last 7 days…");
      const rows: Any[] = [];
      for (let i=0;i<10;i++) {
        const d = daysAgo(Math.floor(Math.random()*7));
        const saleData: Any = {
          machine_id: machine, 
          product_id: product, 
          qty: 1,
          unit_price_cents: 200,
          occurred_at: iso(d),
        };
        
        if (flags.sales_unit_cost) {
          saleData.unit_cost_cents = 70;
        }
        
        if (flags.sales_payment_method) {
          saleData.payment_method = "card";
        }
        
        rows.push(saleData);
      }
      const ins = await supabase.from("sales").insert(rows as any);
      if (ins.error) throw ins.error;
      say("✔ Sales added.");
    } catch (e:any) { setErr(pretty(e)); say(`❌ Sales failed\n${pretty(e)}`); }
    finally { setBusy(false); }
  }

  async function addFinance() {
    setBusy(true); setErr(null);
    try {
      if (!flags.machine_finance) { say("machine_finance columns missing — skipping."); return; }
      const { machine } = ids; if (!machine) throw new Error("Run Base first.");
      const probe = await supabase.from("machine_finance").select("machine_id").eq("machine_id", machine).maybeSingle();
      if (!probe.error && probe.data) { say("Finance exists — skipping."); return; }
      const ins = await supabase.from("machine_finance").insert({
        machine_id: machine, 
        monthly_payment: 110.00, 
        purchase_price: 3500.00, 
        apr: 9.9,
        acquisition_type: "financed"
      } as any);
      if (ins.error) throw ins.error;
      say("✔ Finance added.");
    } catch (e:any) { setErr(pretty(e)); say(`❌ Finance failed\n${pretty(e)}`); }
    finally { setBusy(false); }
  }

  async function addProcessorMap() {
    setBusy(true); setErr(null);
    try {
      if (!flags.processors || !flags.mappings) { say("processor tables missing — skipping."); return; }
      const p = await supabase.from("payment_processors").select("id").eq("name","Cantaloupe").maybeSingle();
      let pid = p.data?.id as string|undefined;
      if (!pid) {
        const ins = await supabase.from("payment_processors").insert({ 
          name:"Cantaloupe" 
        } as any).select("id").single();
        if (ins.error) throw ins.error; pid = ins.data.id;
      }
      setIds(i=>({ ...i, processor: pid }));
      const { machine } = ids;
      if (!machine) throw new Error("Run Base first.");
      const map = await supabase.from("machine_processor_mappings").select("id").eq("machine_id", machine).eq("processor_id", pid).maybeSingle();
      if (!map.error && map.data) { say("Mapping exists — skipping."); return; }
      const ins2 = await supabase.from("machine_processor_mappings").insert({ 
        machine_id: machine, 
        processor_id: pid 
      } as any);
      if (ins2.error) throw ins2.error;
      say("✔ Processor mapping added.");
    } catch (e:any) { setErr(pretty(e)); say(`❌ Processor failed\n${pretty(e)}`); }
    finally { setBusy(false); }
  }

  async function addInsurance() {
    setBusy(true); setErr(null);
    try {
      if (!flags.insurance_policies || !flags.insurance_allocations) { say("insurance tables missing — skipping."); return; }
      const { machine } = ids; if (!machine) throw new Error("Run Base first.");
      const today = new Date(); const y = today.getFullYear(); const m = today.getMonth();
      const start = new Date(y, m, 1).toISOString().slice(0,10);
      const end   = new Date(y, m+1, 0).toISOString().slice(0,10);
      const pol = await supabase.from("insurance_policies").insert({
        name:"QA Liability Monthly",
        carrier:"QA Insurance Co",
        policy_number:"QA-TEST-001",
        coverage_start:start, coverage_end:end,
        monthly_premium_cents: 3000
      } as any).select("id").single().then(r => (!r.error ? r : supabase.from("insurance_policies").select("id").eq("name","QA Liability Monthly").maybeSingle()));
      if (pol.error || !pol.data) throw pol.error || new Error("policy not created");
      setIds(i=>({ ...i, policy: pol.data.id }));

      const alloc = await supabase.from("insurance_allocations")
        .select("id").eq("policy_id", pol.data.id).eq("level","machine").eq("machine_id", machine).maybeSingle();
      if (!alloc.error && alloc.data) { say("Allocation exists — skipping."); return; }

      const ins = await supabase.from("insurance_allocations").insert({
        policy_id: pol.data.id, level:"machine", machine_id: machine, flat_monthly_cents: 1500
      } as any);
      if (ins.error) throw ins.error;
      say("✔ Insurance allocation added.");
    } catch (e:any) { setErr(pretty(e)); say(`❌ Insurance failed\n${pretty(e)}`); }
    finally { setBusy(false); }
  }

  async function openTicket() {
    setBusy(true); setErr(null);
    try {
      const { machine, location } = ids;
      if (!machine || !location) throw new Error("Run Base first.");
      let due: string | null = null;
      if (flags.ticket_sla_policies) {
        const sla = await supabase.from("ticket_sla_policies").select("minutes_to_resolve").eq("priority","normal").eq("active",true).maybeSingle();
        if (!sla.error && sla.data) {
          const d = new Date(); d.setMinutes(d.getMinutes() + (Number(sla.data.minutes_to_resolve)||1440));
          due = iso(d);
        }
      }
      const ins = await supabase.from("tickets").insert({
        title:"QA: coin jam", status:"open", priority:"normal",
        machine_id: machine, location_id: location, due_at: due
      } as any).select("id").single();
      if (ins.error) throw ins.error;
      setIds(i=>({ ...i, ticket: ins.data.id }));
      say("✔ Ticket opened.");
    } catch (e:any) { setErr(pretty(e)); say(`❌ Ticket failed\n${pretty(e)}`); }
    finally { setBusy(false); }
  }

  const canRun = useMemo(()=>!busy, [busy]);

  return (
    <div className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <div className="text-xl font-semibold flex items-center gap-2"><ListChecks className="h-5 w-5" /> Quick Seed — Demo Data</div>
        <div className="flex items-center gap-2">
          <button onClick={async()=>{clear(); await detect();}} className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted">
            <RefreshCw className="h-4 w-4" /> Re-detect schema
          </button>
        </div>
      </header>

      {err && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs whitespace-pre-wrap">
          <div className="font-medium mb-1">Error</div>{err}
        </div>
      )}

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
          <ActionCard icon={<Layers className="h-4 w-4" />} title="Run Base (product/site/machine)" onClick={seedBase} disabled={!canRun} />
          <ActionCard icon={<DollarSign className="h-4 w-4" />} title="Add 10 Sales (last 7d)" onClick={addSales} disabled={!canRun} />
          <ActionCard icon={<Landmark className="h-4 w-4" />} title="Add Finance (if supported)" onClick={addFinance} disabled={!canRun} />
          <ActionCard icon={<CreditCard className="h-4 w-4" />} title="Map Processor (if supported)" onClick={addProcessorMap} disabled={!canRun} />
          <ActionCard icon={<ShieldCheck className="h-4 w-4" />} title="Add Insurance (if supported)" onClick={addInsurance} disabled={!canRun} />
          <ActionCard icon={<Wrench className="h-4 w-4" />} title="Open Ticket" onClick={openTicket} disabled={!canRun} />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="font-medium mb-2">Sanity Links</div>
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

function ActionCard({ icon, title, onClick, disabled }:{
  icon: React.ReactNode; title: string; onClick: ()=>void; disabled: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled} className="rounded-lg border border-border bg-background px-3 py-2 hover:bg-muted disabled:opacity-50 text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">{icon}{title}</div>
        {disabled ? <XCircle className="h-5 w-5 text-rose-500/60" /> : <CheckCircle2 className="h-5 w-5 text-emerald-500/80" />}
      </div>
      <div className="text-xs text-muted-foreground mt-1">Click to run.</div>
    </button>
  );
}

function Nav({ to, label, icon }:{ to:string; label:string; icon:React.ReactNode; }) {
  return (
    <Link to={to} className="rounded-lg border border-border bg-background px-3 py-2 hover:bg-muted inline-flex items-center gap-2">
      {icon}{label}
    </Link>
  );
}