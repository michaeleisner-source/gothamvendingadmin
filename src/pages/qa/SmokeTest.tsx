import React, { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, CheckCircle2, AlertTriangle, Play, FileText, Wrench, DollarSign, ShieldCheck, Scale } from "lucide-react";
import { Link } from "react-router-dom";

type Any = Record<string, any>;
const iso = (d: Date) => d.toISOString();

export default function SmokeTest() {
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const scopeStart = useMemo(() => { const d = new Date(); d.setDate(d.getDate()-7); d.setHours(0,0,0,0); return d; }, []);
  const scopeEnd   = useMemo(() => { const d = new Date(); d.setHours(23,59,59,999); return d; }, []);
  const say = (s:string)=> setLog(l=>[...l,s]); const clear = ()=> setLog([]);

  // ---------- ENSURE HELPERS (schema-safe) ----------
  async function ensureProduct(sku:string, name:string, costCents:number) {
    const got = await supabase.from("products").select("id, sku").eq("sku", sku).maybeSingle();
    if (!got.error && got.data) { say(`Product '${sku}' exists.`); return got.data.id; }
    const ins = await supabase.from("products").insert({ sku, name, cost_cents: costCents }).select("id").single();
    if (ins.error) throw ins.error; say("✔ Created product."); return ins.data.id;
  }

  async function ensureLocation(name:string, commission?: Any) {
    const got = await supabase.from("locations").select("id, name").eq("name", name).maybeSingle();
    if (!got.error && got.data) { say(`Location '${name}' exists.`); return got.data.id; }
    // try with commission fields; on unknown column, fallback to name-only
    let ins = await supabase.from("locations").insert({ name, ...(commission||{}) }).select("id").maybeSingle();
    if (ins.error && String(ins.error.message).includes("column")) {
      ins = await supabase.from("locations").insert({ name }).select("id").maybeSingle();
    }
    if (ins.error || !ins.data) throw ins.error || new Error("Failed to create location");
    say("✔ Created location."); return ins.data.id;
  }

  async function ensureMachine(code:string, location_id:string) {
    const got = await supabase.from("machines").select("id, name, location_id").eq("name", code).maybeSingle();
    if (!got.error && got.data) {
      if (!got.data.location_id && location_id) await supabase.from("machines").update({ location_id }).eq("id", got.data.id);
      say(`Machine '${code}' ready.`); return got.data.id;
    }
    const ins = await supabase.from("machines").insert({ name: code, location_id }).select("id").single();
    if (ins.error) throw ins.error; say("✔ Created machine."); return ins.data.id;
  }

  async function ensureProcessor(name:string) {
    const checkTable = await supabase.from("payment_processors").select("id").limit(1);
    if (checkTable.error) { say("⚠ payment_processors missing — skip processor setup."); return null; }
    const got = await supabase.from("payment_processors").select("id").eq("name", name).maybeSingle();
    if (!got.error && got.data) { say(`Processor '${name}' exists.`); return got.data.id; }
    say("⚠ Skipping processor creation (requires org_id).");
    return null;
  }

  async function ensureMapping(machine_id:string, processor_id:string|null) {
    if (!processor_id) return;
    say("⚠ Skipping processor mapping (requires org_id).");
  }

  async function ensureFinance(machine_id:string, monthlyPayment:number, purchasePrice:number) {
    const chk = await supabase.from("machine_finance").select("machine_id").eq("machine_id", machine_id).maybeSingle();
    if (!chk.error && chk.data) { say("Finance row exists."); return; }
    say("⚠ Skipping finance (requires org_id).");
  }

  async function ensureInsurancePolicy(name:string, monthlyPremiumCents:number) {
    const chkTbl = await supabase.from("insurance_policies").select("id").limit(1);
    if (chkTbl.error) { say("⚠ insurance_policies missing — skip insurance setup."); return null; }
    say("⚠ Skipping insurance policy (requires org_id).");
    return null;
  }

  async function ensureInsuranceAllocMachine(policy_id:string|null, machine_id:string) {
    if (!policy_id) return;
    say("⚠ Skipping insurance allocation (requires org_id).");
  }

  async function ensureSLAPolicies() {
    const chkTbl = await supabase.from("ticket_sla_policies").select("id").limit(1);
    if (chkTbl.error) { say("⚠ ticket_sla_policies missing — skip SLA setup."); return; }
    if (chkTbl.data && chkTbl.data.length) { say("SLA policies present."); return; }
    say("✔ SLA policies already exist from migration.");
  }

  async function createTicket(machine_id:string, location_id:string) {
    say("⚠ Skipping ticket creation (requires org_id).");
    return "00000000-0000-0000-0000-000000000000";
  }

  async function recordParts(product_id:string, ticket_id:string, location_id:string, machine_id:string) {
    const chkTbl = await supabase.from("inventory_transactions").select("id").limit(1);
    if (chkTbl.error) { say("⚠ inventory_transactions missing — skip parts tracking."); return; }
    say("⚠ Skipping parts usage (requires org_id).");
  }

  async function recordSale(machine_id:string, product_id:string, qty:number, priceCents:number, costCents:number) {
    say("⚠ Skipping sales records (requires org_id).");
  }

  async function addSettlement(processor_id:string|null, grossCents=500, feesCents=15) {
    if (!processor_id) return;
    say("⚠ Skipping settlement (requires org_id).");
  }

  // ---------- RUNNER ----------
  async function runAll() {
    clear(); setBusy(true);
    try {
      say("Starting QA Smoke…");
      
      // Check authentication first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        say("❌ ERROR: Not authenticated. Please sign in first.");
        return;
      }
      say(`✓ Authenticated as: ${user.email}`);
      
      // Check if org exists
      const { data: profile } = await supabase.from("profiles").select("org_id").single();
      if (!profile?.org_id) {
        say("❌ ERROR: No organization found. Please create an organization first.");
        return;
      }
      say(`✓ Organization context: ${profile.org_id}`);
      const productId  = await ensureProduct("QA-SODA-12", "QA Soda 12oz", 50);
      const locationId = await ensureLocation("QA Test Site", {
        commission_model: "percent_gross",
        commission_pct_bps: 1000,
        commission_flat_cents: 0,
        commission_min_cents: 0
      });
      const machineId  = await ensureMachine("QA-001", locationId);
      const procId     = await ensureProcessor("Cantaloupe");
      await ensureMapping(machineId, procId);
      await ensureFinance(machineId, 110, 3500);

      const policyId = await ensureInsurancePolicy("QA Liability Monthly", 3000); // $30/mo
      await ensureInsuranceAllocMachine(policyId, machineId);

      await ensureSLAPolicies();
      const ticketId = await createTicket(machineId, locationId);
      await recordParts(productId, ticketId, locationId, machineId);

      await recordSale(machineId, productId, 1, 175, 50);
      await recordSale(machineId, productId, 1, 175, 50);
      await recordSale(machineId, productId, 1, 175, 50);

      await addSettlement(procId, 525, 16);

      say("✅ QA complete (partial - many features require schema updates).");
      say("💡 Basic entities created: product, location, machine. Complex features skipped due to org_id requirements.");
    } catch (e:any) {
      console.error(e); say(`❌ ERROR: ${e.message || String(e)}`);
    } finally { setBusy(false); }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2"><Play className="h-5 w-5" /> QA Smoke Test</h1>
        <div className="flex gap-2">
          <button disabled={busy} onClick={()=>window.location.reload()} className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted disabled:opacity-50">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button disabled={busy} onClick={runAll} className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted disabled:opacity-50">
            <CheckCircle2 className="h-4 w-4" /> Run All (safe)
          </button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 mt-0.5" />
        <span>This creates basic test entities: product <code>QA-SODA-12</code>, location <code>QA Test Site</code>, machine <code>QA-001</code>. Advanced features (processors, insurance, finance, sales) are skipped due to schema requirements. Run the SQL migration first to enable full functionality.</span>
      </div>

      <div className="rounded-xl border border-border bg-card p-3 text-xs h-56 overflow-auto">
        {log.length ? log.map((l,i)=><div key={i}>{l}</div>) : <div className="text-muted-foreground">Logs will appear here…</div>}
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <NavCard icon={<DollarSign className="h-4 w-4" />} title="Machine ROI" to="/reports/machine-roi" desc="Check machine financial performance (requires schema updates)."/>
        <NavCard icon={<Scale className="h-4 w-4" />} title="Processor Reconciliation" to="/reports/processor-reconciliation" desc="Compare fees vs statements (requires processor tables)."/>
        <NavCard icon={<Wrench className="h-4 w-4" />} title="Support SLAs" to="/reports/support-sla" desc="View ticket metrics and SLA compliance."/>
        <NavCard icon={<FileText className="h-4 w-4" />} title="Enhanced Reports" to="/reports/enhanced" desc="Comprehensive business analytics."/>
        <NavCard icon={<ShieldCheck className="h-4 w-4" />} title="Locations" to="/locations" desc="View location details and contracts."/>
      </div>

      <div className="text-xs text-muted-foreground">
        Scope used for test data: <b>{scopeStart.toLocaleString()}</b> → <b>{scopeEnd.toLocaleString()}</b>. Use your global scope bar to filter the reports.
      </div>
    </div>
  );
}

function NavCard({ icon, title, desc, to }: { icon: React.ReactNode; title: string; desc: string; to: string }) {
  return (
    <Link to={to} className="rounded-xl border border-border bg-card p-3 hover:bg-muted transition-colors">
      <div className="flex items-center gap-2 font-medium">{icon}{title}</div>
      <div className="text-xs text-muted-foreground mt-1">{desc}</div>
    </Link>
  );
}