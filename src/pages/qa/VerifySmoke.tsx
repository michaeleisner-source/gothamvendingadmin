import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePageSEO } from "@/hooks/usePageSEO";
import { HelpTooltip } from "@/components/ui/HelpTooltip";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Rocket,
  Layers,
  ListChecks,
  DollarSign,
  Factory,
  MapPin,
  Package,
  ShieldCheck,
  Landmark,
  CreditCard,
  Wrench,
  FileText,
  Scale,
  User,
} from "lucide-react";
import { Link } from "react-router-dom";

/** ---------- tiny utils ---------- */
type Any = Record<string, any>;
const iso = (d: Date) => d.toISOString();
const startOfMonth = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d = new Date()) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const money = (c?: number | null) => (typeof c === "number" ? `$${(c / 100).toFixed(2)}` : "—");
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
const prettyErr = (e: any) => {
  if (!e) return "";
  try {
    return JSON.stringify(
      { message: e.message ?? String(e), code: e.code, details: e.details, hint: e.hint },
      null,
      2
    );
  } catch {
    return String(e);
  }
};

/** ---------- ENSURE HELPERS (schema-safe + RLS friendly) ---------- */
async function ensureProduct(sku: string, name: string, costCents: number, say: (s: string)=>void) {
  const probe = await supabase.from("products").select("id, sku").eq("sku", sku).maybeSingle();
  if (!probe.error && probe.data) { say(`Product '${sku}' exists.`); return probe.data.id as string; }
  if (probe.error && probe.error.code === "PGRST301") throw new Error("RLS blocked products read.");
  const ins = await supabase.from("products").insert({ sku, name, cost_cents: costCents }).select("id").single();
  if (ins.error) throw ins.error; say("✔ Created product."); return ins.data.id as string;
}
async function ensureLocation(name: string, commission: Any, say: (s: string)=>void) {
  const probe = await supabase.from("locations").select("id, name").eq("name", name).maybeSingle();
  if (!probe.error && probe.data) { say(`Location '${name}' exists.`); return probe.data.id as string; }
  if (probe.error && probe.error.code === "PGRST301") throw new Error("RLS blocked locations read.");
  let ins = await supabase.from("locations").insert({ name, ...commission }).select("id").maybeSingle();
  if (ins.error && String(ins.error.message).includes("column")) {
    ins = await supabase.from("locations").insert({ name }).select("id").maybeSingle();
  }
  if (ins.error || !ins.data) throw ins.error || new Error("Failed to create location");
  say("✔ Created location."); return ins.data.id as string;
}
async function ensureMachine(code: string, location_id: string, say: (s: string)=>void) {
  const probe = await supabase.from("machines").select("id, name, location_id").eq("name", code).maybeSingle();
  if (!probe.error && probe.data) {
    if (!probe.data.location_id && location_id) await supabase.from("machines").update({ location_id }).eq("id", probe.data.id);
    say(`Machine '${code}' ready.`); return probe.data.id as string;
  }
  if (probe.error && probe.error.code === "PGRST301") throw new Error("RLS blocked machines read.");
  const ins = await supabase.from("machines").insert({ name: code, location_id }).select("id").single();
  if (ins.error) throw ins.error; say("✔ Created machine."); return ins.data.id as string;
}
async function ensureProcessor(name: string, say: (s: string)=>void) {
  const chkTbl = await supabase.from("payment_processors").select("id").limit(1);
  if (chkTbl.error) throw new Error("payment_processors missing (run SQL migration).");
  const got = await supabase.from("payment_processors").select("id").eq("name", name).maybeSingle();
  if (!got.error && got.data) { say(`Processor '${name}' exists.`); return got.data.id as string; }
  const ins = await supabase.from("payment_processors").insert({ name, org_id: "00000000-0000-0000-0000-000000000000" }).select("id").single();
  if (ins.error) throw ins.error; say("✔ Created processor."); return ins.data.id as string;
}
async function ensureMapping(machine_id: string, processor_id: string, say: (s: string)=>void) {
  const chk = await supabase.from("machine_processor_mappings").select("id").limit(1);
  if (chk.error) throw new Error("machine_processor_mappings missing (run SQL migration).");
  const got = await supabase.from("machine_processor_mappings").select("id").eq("machine_id", machine_id).eq("processor_id", processor_id).maybeSingle();
  if (!got.error && got.data) { say("Mapping exists."); return; }
  const ins = await supabase.from("machine_processor_mappings").insert({ machine_id, processor_id, org_id: "00000000-0000-0000-0000-000000000000" });
  if (ins.error) throw ins.error; say("✔ Mapped machine → processor.");
}
async function ensureFinance(machine_id: string, payCents: number, capexCents: number, say: (s: string)=>void) {
  const chk = await supabase.from("machine_finance").select("machine_id").eq("machine_id", machine_id).maybeSingle();
  if (!chk.error && chk.data) { say("Finance row exists."); return; }
  const ins = await supabase.from("machine_finance").insert({
    machine_id, monthly_payment: payCents / 100, purchase_price: capexCents / 100, apr: 9.9, 
    acquisition_type: "lease", org_id: "00000000-0000-0000-0000-000000000000"
  }).select("machine_id").single();
  if (ins.error && String(ins.error.message).includes("column")) {
    const ins2 = await supabase.from("machine_finance").insert({ 
      machine_id, acquisition_type: "lease", org_id: "00000000-0000-0000-0000-000000000000" 
    });
    if (ins2.error) throw ins.error;
    say("✔ Created minimal finance row.");
    return;
  }
  if (ins.error) throw ins.error; say("✔ Created finance row.");
}
async function ensurePolicy(name: string, monthlyPremiumCents: number, say: (s: string)=>void) {
  const chkTbl = await supabase.from("insurance_policies").select("id").limit(1);
  if (chkTbl.error) throw new Error("insurance_policies missing (run SQL migration).");
  const today = new Date(); const ps = startOfMonth(today); const pe = endOfMonth(today);
  const got = await supabase.from("insurance_policies")
    .select("id").eq("name", name)
    .lte("coverage_start", pe.toISOString().slice(0,10))
    .gte("coverage_end",   ps.toISOString().slice(0,10))
    .maybeSingle();
  if (!got.error && got.data) { say("Policy exists."); return got.data.id as string; }
  const ins = await supabase.from("insurance_policies").insert({
    name, carrier:"QA Insurance Co", policy_number:"QA-TEST-001",
    coverage_start: ps.toISOString().slice(0,10),
    coverage_end:   pe.toISOString().slice(0,10),
    monthly_premium_cents: monthlyPremiumCents,
    org_id: "00000000-0000-0000-0000-000000000000"
  }).select("id").single();
  if (ins.error) throw ins.error; say("✔ Created policy."); return ins.data.id as string;
}
async function ensurePolicyAllocMachine(policy_id: string, machine_id: string, say: (s: string)=>void) {
  const chkTbl = await supabase.from("insurance_allocations").select("id").limit(1);
  if (chkTbl.error) throw new Error("insurance_allocations missing (run SQL migration).");
  const got = await supabase.from("insurance_allocations")
    .select("id").eq("policy_id", policy_id).eq("level","machine").eq("machine_id", machine_id).maybeSingle();
  if (!got.error && got.data) { say("Allocation exists."); return; }
  const ins = await supabase.from("insurance_allocations")
    .insert({ policy_id, level:"machine", machine_id, flat_monthly_cents: 1500, org_id: "00000000-0000-0000-0000-000000000000" });
  if (ins.error) throw ins.error; say("✔ Created machine allocation.");
}
async function ensureSLAPolicies(say: (s: string)=>void) {
  const chkTbl = await supabase.from("ticket_sla_policies").select("id").limit(1);
  if (chkTbl.error) throw new Error("ticket_sla_policies missing (run SQL migration).");
  if (chkTbl.data && chkTbl.data.length) { say("SLA policies present."); return; }
  const ins = await supabase.from("ticket_sla_policies").insert([
    { priority:"low", minutes_to_ack:480, minutes_to_resolve:2880, active:true, org_id: "00000000-0000-0000-0000-000000000000" },
    { priority:"normal", minutes_to_ack:240, minutes_to_resolve:1440, active:true, org_id: "00000000-0000-0000-0000-000000000000" },
    { priority:"high", minutes_to_ack:120, minutes_to_resolve:720, active:true, org_id: "00000000-0000-0000-0000-000000000000" },
    { priority:"urgent", minutes_to_ack:30, minutes_to_resolve:240, active:true, org_id: "00000000-0000-0000-0000-000000000000" },
  ]);
  if (ins.error) throw ins.error; say("✔ Seeded SLA policies.");
}
async function openTicket(machine_id: string, location_id: string, say: (s: string)=>void) {
  let dueISO: string | null = null;
  const pol = await supabase.from("ticket_sla_policies").select("minutes_to_resolve").eq("priority","normal").eq("active",true).maybeSingle();
  if (!pol.error && pol.data) { const d = new Date(); d.setMinutes(d.getMinutes() + (Number(pol.data.minutes_to_resolve)||1440)); dueISO = iso(d); }
  const ins = await supabase.from("tickets").insert({
    title:"QA: Coin jam / coil check", status:"open", priority:"normal",
    machine_id, location_id, due_at: dueISO, org_id: "00000000-0000-0000-0000-000000000000"
  }).select("id").single();
  if (ins.error) throw ins.error; say("✔ Opened ticket."); return ins.data.id as string;
}
async function recordParts(product_id: string, ticket_id: string, location_id: string, machine_id: string, say: (s: string)=>void) {
  const chkTbl = await supabase.from("inventory_transactions").select("id").limit(1);
  if (chkTbl.error) throw new Error("inventory_transactions missing (run SQL migration).");
  const ins = await supabase.from("inventory_transactions").insert({
    product_id, qty_change:-1, reason:"parts", ref_type:"ticket", ref_id:ticket_id, 
    occurred_at: iso(new Date()), location_id, machine_id, org_id: "00000000-0000-0000-0000-000000000000"
  });
  if (ins.error) throw ins.error; say("✔ Recorded parts usage (-1).");
}
async function recordSale(machine_id: string, product_id: string, qty: number, priceCents: number, costCents: number, say: (s: string)=>void) {
  const ins = await supabase.from("sales").insert({
    machine_id, product_id, qty, unit_price_cents: priceCents, unit_cost_cents: costCents, 
    occurred_at: iso(new Date()), payment_method: "card", org_id: "00000000-0000-0000-0000-000000000000"
  });
  if (ins.error) throw ins.error; say(`✔ Recorded sale ${qty} × ${money(priceCents)}.`);
}
async function addSettlement(processor_id: string, say: (s: string)=>void) {
  const chkTbl = await supabase.from("processor_settlements").select("id").limit(1);
  if (chkTbl.error) throw new Error("processor_settlements missing (run SQL migration).");
  const today = new Date(); const ps = startOfMonth(today); const pe = endOfMonth(today);
  const ins = await supabase.from("processor_settlements").insert({
    processor_id,
    period_start: ps.toISOString().slice(0,10),
    period_end: pe.toISOString().slice(0,10),
    gross_cents: 525, fees_cents: 16, net_cents: 509,
    org_id: "00000000-0000-0000-0000-000000000000"
  });
  if (ins.error) throw ins.error; say("✔ Added settlement.");
}

/** ---------- Page ---------- */
export default function VerifySmoke() {
  usePageSEO({
    title: "QA Control - System Health Check & Test Data",
    description: "Comprehensive QA tool for seeding test data and validating system components",
    keywords: "qa, validation, system check, smoke test, quality assurance, test data seeding"
  });

  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [sessionOK, setSessionOK] = useState<"yes"|"no"|"checking">("checking");
  const [err, setErr] = useState<string | null>(null);

  // snapshot state for verify tiles
  const [product, setProduct] = useState<Any | null>(null);
  const [location, setLocation] = useState<Any | null>(null);
  const [machine, setMachine] = useState<Any | null>(null);
  const [processor, setProcessor] = useState<Any | null>(null);
  const [finance, setFinance] = useState<Any | null>(null);
  const [policy, setPolicy] = useState<Any | null>(null);
  const [alloc, setAlloc] = useState<Any | null>(null);
  const [ticket, setTicket] = useState<Any | null>(null);
  const [partsCount, setPartsCount] = useState<number>(0);
  const [sales, setSales] = useState<Any[]>([]);
  const [settlement, setSettlement] = useState<Any | null>(null);

  const monthStart = useMemo(() => startOfMonth(), []);
  const monthEnd = useMemo(() => endOfMonth(), []);
  const twoWeeksAgo = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - 14); d.setHours(0,0,0,0); return d; }, []);

  const say = (s:string)=> setLog(l=>[...l, s]);
  const clearLog = ()=> setLog([]);

  async function checkSession() {
    setSessionOK("checking");
    const { data } = await supabase.auth.getSession();
    setSessionOK(data.session ? "yes" : "no");
  }

  async function runBase() {
    setErr(null); clearLog(); setBusy(true);
    try {
      say("Creating base test entities (product, location, machine) …");
      const pid = await ensureProduct("QA-SODA-12","QA Soda 12oz",50,say);
      const lid = await ensureLocation("QA Test Site", {
        commission_model: "percent_gross",
        commission_pct_bps: 1000,
        commission_flat_cents: 0,
        commission_min_cents: 0,
      }, say);
      await ensureMachine("QA-001", lid, say);
      say("✅ Base complete.");
    } catch (e: any) {
      const msg = prettyErr(e);
      setErr(msg); say(`❌ Base failed\n${msg}`);
    } finally { setBusy(false); }
  }

  async function runAdvanced() {
    setErr(null); clearLog(); setBusy(true);
    try {
      say("Advanced seeding (processor/mapping, finance, insurance, SLA, ticket/parts, sales, settlement) …");
      const productId = await ensureProduct("QA-SODA-12","QA Soda 12oz",50,say);
      const loc = await supabase.from("locations").select("id").eq("name","QA Test Site").maybeSingle();
      if (loc.error || !loc.data) throw new Error("Need location 'QA Test Site' first (run Base).");
      const machineId = await ensureMachine("QA-001", loc.data.id, say);

      const procId = await ensureProcessor("Cantaloupe", say);
      await ensureMapping(machineId, procId, say);

      await ensureFinance(machineId, 11000, 350000, say);

      const polId = await ensurePolicy("QA Liability Monthly", 3000, say);
      await ensurePolicyAllocMachine(polId, machineId, say);

      await ensureSLAPolicies(say);
      const tid = await openTicket(machineId, loc.data.id, say);
      await recordParts(productId, tid, loc.data.id, machineId, say);

      await recordSale(machineId, productId, 1, 175, 50, say);
      await recordSale(machineId, productId, 1, 175, 50, say);
      await recordSale(machineId, productId, 1, 175, 50, say);

      await addSettlement(procId, say);

      say("✅ Advanced complete.");
    } catch (e: any) {
      const msg = prettyErr(e);
      setErr(msg); say(`❌ Advanced failed\n${msg}`);
    } finally { setBusy(false); }
  }

  async function verify() {
    setErr(null); setBusy(true);
    try {
      // product
      const p = await supabase.from("products").select("id,sku,name,cost_cents").eq("sku","QA-SODA-12").maybeSingle();
      if (p.error && p.error.code === "PGRST301") throw new Error("RLS blocked reading products. Log in or enable demo.");
      setProduct(p.data ?? null);

      // location
      const l = await supabase.from("locations").select("id,name").eq("name","QA Test Site").maybeSingle();
      if (l.error && l.error.code === "PGRST301") throw new Error("RLS blocked reading locations. Log in or enable demo.");
      setLocation(l.data ?? null);

      // machine
      const m = await supabase.from("machines").select("id,name,location_id").eq("name","QA-001").maybeSingle();
      if (m.error && m.error.code === "PGRST301") throw new Error("RLS blocked reading machines. Log in or enable demo.");
      setMachine(m.data ?? null);

      // finance
      if (m.data) {
        const f = await supabase.from("machine_finance")
          .select("machine_id,monthly_payment,purchase_price,apr")
          .eq("machine_id", m.data.id).maybeSingle();
        if (!f.error) setFinance(f.data ?? null);
      }

      // processor + mapping
      if (m.data) {
        const map = await supabase.from("machine_processor_mappings").select("processor_id").eq("machine_id", m.data.id).maybeSingle();
        if (!map.error && map.data) {
          const pr = await supabase.from("payment_processors").select("id,name").eq("id", map.data.processor_id).maybeSingle();
          if (!pr.error) setProcessor(pr.data ?? null);
        }
      }

      // insurance
      const ps = startOfMonth(); const pe = endOfMonth();
      const polQ = await supabase.from("insurance_policies")
        .select("id,name,monthly_premium_cents,coverage_start,coverage_end")
        .lte("coverage_start", pe.toISOString().slice(0,10)).gte("coverage_end", ps.toISOString().slice(0,10)).maybeSingle();
      if (!polQ.error) setPolicy(polQ.data ?? null);
      if (polQ.data && m.data) {
        const alQ = await supabase.from("insurance_allocations")
          .select("id,level,flat_monthly_cents,allocated_pct_bps,machine_id,policy_id")
          .eq("policy_id", polQ.data.id).eq("level","machine").eq("machine_id", m.data.id).maybeSingle();
        if (!alQ.error) setAlloc(alQ.data ?? null);
      }

      // ticket latest
      if (m.data) {
        const t = await supabase.from("tickets").select("id,title,status,priority,due_at,created_at")
          .eq("machine_id", m.data.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (!t.error) setTicket(t.data ?? null);
      }

      // parts usage count
      if (m.data) {
        const it = await supabase.from("inventory_transactions")
          .select("id", { count: "exact", head: true })
          .eq("machine_id", m.data.id).eq("reason","parts");
        if (!it.error && typeof it.count === "number") setPartsCount(it.count);
      }

      // sales last 14 days
      if (m.data && p.data) {
        const ss = await supabase.from("sales").select("qty,unit_price_cents,unit_cost_cents,occurred_at,payment_method")
          .eq("machine_id", m.data.id).eq("product_id", p.data.id)
          .gte("occurred_at", new Date(Date.now() - 14*24*3600*1000).toISOString());
        if (!ss.error) setSales(ss.data ?? []);
      }

      // settlement
      if (processor) {
        const st = await supabase.from("processor_settlements")
          .select("id,gross_cents,fees_cents,net_cents,period_start,period_end")
          .eq("processor_id", (processor as any).id)
          .gte("period_start", startOfMonth().toISOString().slice(0,10))
          .lte("period_end", endOfMonth().toISOString().slice(0,10))
          .order("period_start", { ascending: false }).limit(1).maybeSingle();
        if (!st.error) setSettlement(st.data ?? null);
      }
    } catch (e: any) {
      setErr(prettyErr(e));
    } finally { setBusy(false); }
  }

  useEffect(() => { checkSession(); verify(); }, []);

  // Derived KPIs
  const gross = useMemo(() => sum(sales.map(s => (s.qty ?? 0) * (s.unit_price_cents ?? 0))), [sales]);
  const cogs  = useMemo(() => sum(sales.map(s => (s.qty ?? 0) * (s.unit_cost_cents ?? 0))), [sales]);

  // Insurance (flat allocation monthly → prorate over month days)
  const insuranceMonthly = alloc?.flat_monthly_cents ?? null;

  return (
    <div className="container mx-auto p-6 space-y-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <ListChecks className="h-6 w-6" /> QA Validation Snapshot
          </h1>
          <HelpTooltip content="Smoke test validation for critical system components and data flows." />
        </div>
        <button
          onClick={verify}
          disabled={busy}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} /> 
          {busy ? 'Testing...' : 'Run Tests'}
        </button>
      </header>

      {err && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">
          <div className="font-medium text-destructive">Test Error</div>
          <div className="text-xs opacity-80">{err}</div>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        <CheckCard icon={<Package className="h-4 w-4" />} label="Product QA-SODA-12" pass={!!product} detail={product ? `${product.name} • cost ${money(product.cost_cents)}` : "Not found"} />
        <CheckCard icon={<MapPin className="h-4 w-4" />} label="Location QA Test Site" pass={!!location} detail={location ? `id ${location.id}` : "Not found"} />
        <CheckCard icon={<Factory className="h-4 w-4" />} label="Machine QA-001" pass={!!machine} detail={machine ? `linked location ${machine.location_id ? "yes" : "no"}` : "Not found"} />
        <CheckCard icon={<CreditCard className="h-4 w-4" />} label="Processor Mapping" pass={!!processor} detail={processor ? processor.name : "Missing (ok if you skipped SQL)"} />
        <CheckCard icon={<Landmark className="h-4 w-4" />} label="Finance Row" pass={!!finance} detail={finance ? `payment ${money(finance.monthly_payment)} / mo` : "Missing (optional)"} />
        <CheckCard icon={<ShieldCheck className="h-4 w-4" />} label="Insurance Allocation" pass={!!alloc} detail={alloc ? `flat ${money(alloc.flat_monthly_cents)}` : (policy ? "Policy present, no allocation" : "Missing (optional)")} />
        <CheckCard icon={<Wrench className="h-4 w-4" />} label="Ticket (latest)" pass={!!ticket} detail={ticket ? `${ticket.status} • due ${ticket.due_at ? new Date(ticket.due_at).toLocaleString() : "—"}` : "Not found (optional)"} />
        <CheckCard icon={<FileText className="h-4 w-4" />} label="Parts Usage" pass={partsCount > 0} detail={partsCount > 0 ? `${partsCount} part(s)` : "None (optional)"} />
        <CheckCard icon={<Scale className="h-4 w-4" />} label="Processor Settlement" pass={!!settlement} detail={settlement ? `gross ${money(settlement.gross_cents)} • fees ${money(settlement.fees_cents)}` : "Not found (optional)"} />
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="font-medium mb-2 flex items-center gap-2">
          <DollarSign className="h-4 w-4" /> 
          Sales KPIs (last 14 days)
          <HelpTooltip content="Financial performance metrics from sales data over the past 14 days" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <Kpi label="Transactions" value={String(sales.length)} />
          <Kpi label="Gross Revenue" value={money(gross)} />
          <Kpi label="Cost of Goods" value={money(cogs)} />
          <Kpi label="Gross Margin" value={gross ? `${(((gross - cogs) / gross) * 100).toFixed(1)}%` : "—"} />
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        <strong>Test Status:</strong> {busy ? "Running smoke tests..." : "Tests completed"}
        <br />
        Tip: If any "Missing (ok if you skipped SQL)" tiles show red, run the SQL migration to enable those advanced checks.
      </div>
    </div>
  );
}

function CheckCard({ icon, label, pass, detail }: { icon: React.ReactNode; label: string; pass: boolean; detail: string; }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          {icon} {label}
        </div>
        {pass ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-rose-500" />}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{detail}</div>
    </div>
  );
}

function NavCard({ icon, title, desc, to }: { icon: React.ReactNode; title: string; desc: string; to: string; }) {
  return (
    <Link to={to} className="rounded-xl border border-border bg-card p-3 hover:bg-muted transition-colors">
      <div className="flex items-center gap-2 font-medium">
        {icon}{title}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{desc}</div>
    </Link>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
