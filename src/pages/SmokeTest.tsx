import React, { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, CheckCircle2, AlertTriangle, Play, FileText, Wrench, DollarSign, ShieldCheck, Scale } from "lucide-react";
import { Link } from "react-router-dom";

type Any = Record<string, any>;

const today = new Date();
function iso(d: Date) { return d.toISOString(); }
function firstOfMonth(d = new Date()) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function lastOfMonth(d = new Date()) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }

export default function SmokeTest() {
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const scopeStart = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() - 7);
    d.setHours(0,0,0,0);
    return d;
  }, []);
  const scopeEnd = useMemo(() => {
    const d = new Date(); d.setHours(23,59,59,999);
    return d;
  }, []);

  function say(line: string) { setLog((l) => [...l, line]); }
  function clearLog() { setLog([]); }

  // Helpers (lightweight "ensure" funcs)
  async function ensureProduct(sku: string, name: string, costCents: number, priceCents: number) {
    const got = await supabase.from("products").select("id, sku").eq("sku", sku).maybeSingle();
    if (!got.error && got.data) { say(`Product '${sku}' exists.`); return got.data.id; }
    const ins = await supabase.from("products").insert({
      sku, name, cost_cents: costCents, price_cents: priceCents
    }).select("id").single();
    if (ins.error) throw ins.error;
    say(`✔ Created product '${sku}'.`);
    return ins.data.id;
  }

  async function ensureLocation(name: string, commissionModel: Any) {
    const got = await supabase.from("locations").select("id, name").eq("name", name).maybeSingle();
    if (!got.error && got.data) { say(`Location '${name}' exists.`); return got.data.id; }
    const ins = await supabase.from("locations").insert({ name, ...commissionModel }).select("id").single();
    if (ins.error) throw ins.error;
    say(`✔ Created location '${name}'.`);
    return ins.data.id;
  }

  async function ensureMachine(code: string, location_id: string) {
    const got = await supabase.from("machines").select("id, name, location_id").eq("name", code).maybeSingle();
    if (!got.error && got.data) {
      if (!got.data.location_id && location_id) {
        await supabase.from("machines").update({ location_id }).eq("id", got.data.id);
        say(`Linked machine '${code}' to location.`);
      } else {
        say(`Machine '${code}' exists.`);
      }
      return got.data.id;
    }
    const ins = await supabase.from("machines").insert({ name: code, location_id }).select("id").single();
    if (ins.error) throw ins.error;
    say(`✔ Created machine '${code}'.`);
    return ins.data.id;
  }

  async function ensureProcessor(name: string) {
    const got = await supabase.from("payment_processors").select("id, name").eq("name", name).maybeSingle();
    if (!got.error && got.data) { say(`Processor '${name}' exists.`); return got.data.id; }
    const ins = await supabase.from("payment_processors").insert({ name }).select("id").single();
    if (ins.error) throw ins.error;
    say(`✔ Created processor '${name}'.`);
    return ins.data.id;
  }

  async function ensureMapping(machine_id: string, processor_id: string) {
    const got = await supabase.from("machine_processor_mappings").select("id").eq("machine_id", machine_id).eq("processor_id", processor_id).maybeSingle();
    if (!got.error && got.data) { say("Machine → processor mapping exists."); return; }
    const ins = await supabase.from("machine_processor_mappings").insert({ machine_id, processor_id });
    if (ins.error) throw ins.error;
    say("✔ Mapped machine → processor.");
  }

  async function ensureFinance(machine_id: string, monthlyPaymentCents: number, purchasePriceCents: number) {
    const got = await supabase.from("machine_finance").select("machine_id").eq("machine_id", machine_id).maybeSingle();
    if (!got.error && got.data) { say("Finance row exists."); return; }
    const ins = await supabase.from("machine_finance").insert({
      machine_id, monthly_payment_cents: monthlyPaymentCents, purchase_price_cents: purchasePriceCents
    });
    if (ins.error) throw ins.error;
    say("✔ Created machine finance row.");
  }

  async function ensureInsurancePolicy(name: string, monthlyPremiumCents: number) {
    // Need overlap with the current scope
    const start = firstOfMonth(today);
    const end = lastOfMonth(today);
    const got = await supabase.from("insurance_policies")
      .select("id")
      .eq("name", name)
      .lte("coverage_start", end.toISOString().slice(0,10))
      .gte("coverage_end", start.toISOString().slice(0,10))
      .maybeSingle();
    if (!got.error && got.data) { say(`Policy '${name}' exists for this period.`); return got.data.id; }
    const ins = await supabase.from("insurance_policies").insert({
      name, carrier: "QA Insurance Co", policy_number: "QA-TEST-001",
      coverage_start: start.toISOString().slice(0,10),
      coverage_end: end.toISOString().slice(0,10),
      monthly_premium_cents: monthlyPremiumCents
    }).select("id").single();
    if (ins.error) throw ins.error;
    say(`✔ Created policy '${name}'.`);
    return ins.data.id;
  }

  async function ensureInsuranceAllocMachine(policy_id: string, machine_id: string, flatMonthlyCents = 1500) {
    // machine-level allocation wins
    const got = await supabase.from("insurance_allocations")
      .select("id")
      .eq("policy_id", policy_id)
      .eq("level", "machine")
      .eq("machine_id", machine_id)
      .maybeSingle();
    if (!got.error && got.data) { say("Insurance allocation (machine) exists."); return; }
    const ins = await supabase.from("insurance_allocations")
      .insert({ policy_id, level: "machine", machine_id, flat_monthly_cents: flatMonthlyCents });
    if (ins.error) throw ins.error;
    say("✔ Created insurance allocation (machine).");
  }

  async function recordSale(machine_id: string, product_id: string, qty: number, priceCents: number, costCents: number) {
    const when = new Date(); // now, inside scopeEnd by default
    const ins = await supabase.from("sales").insert({
      machine_id, product_id,
      qty, unit_price_cents: priceCents, unit_cost_cents: costCents,
      occurred_at: iso(when),
      payment_method: "card"
    });
    if (ins.error) throw ins.error;
    say(`✔ Recorded sale: ${(priceCents/100).toFixed(2)} (${qty}x).`);
  }

  async function ensureSLAPolicies() {
    // presence check (graceful if table missing)
    const q = await supabase.from("ticket_sla_policies").select("id").limit(1);
    if (q.error) { say("⚠ ticket_sla_policies not available (skip SLA seed)."); return; }
    if (q.data && q.data.length) { say("SLA policies present."); return; }
    const ins = await supabase.from("ticket_sla_policies").insert([
      { priority:"low", minutes_to_ack:480, minutes_to_resolve:2880, active:true },
      { priority:"normal", minutes_to_ack:240, minutes_to_resolve:1440, active:true },
      { priority:"high", minutes_to_ack:120, minutes_to_resolve:720, active:true },
      { priority:"urgent", minutes_to_ack:30, minutes_to_resolve:240, active:true },
    ]);
    if (ins.error) throw ins.error;
    say("✔ Seeded SLA policies.");
  }

  async function createTicket(machine_id: string, location_id: string) {
    // compute due_at from 'normal' policy if available
    let dueISO: string | null = null;
    const pol = await supabase.from("ticket_sla_policies").select("minutes_to_resolve").eq("priority","normal").eq("active", true).maybeSingle();
    if (!pol.error && pol.data) {
      const due = new Date();
      due.setMinutes(due.getMinutes() + (Number(pol.data.minutes_to_resolve)||1440));
      dueISO = iso(due);
    }
    const title = "QA: Coin jam / coil check";
    const ins = await supabase.from("tickets").insert({
      title, status:"open", priority:"normal",
      machine_id, location_id, due_at: dueISO
    }).select("id").single();
    if (ins.error) throw ins.error;
    say("✔ Opened ticket.");
    return ins.data.id as string;
  }

  async function recordParts(product_id: string, ticket_id: string, location_id: string, machine_id: string) {
    // -1 qty for parts pull
    const t = await supabase.from("inventory_transactions").insert({
      product_id, qty_change: -1, reason: "parts",
      ref_type: "ticket", ref_id: ticket_id,
      occurred_at: iso(new Date()),
      location_id, machine_id
    });
    if (t.error) throw t.error;
    say("✔ Recorded parts usage (-1).");
  }

  async function addSettlement(processor_id: string, approxGrossCents = 20000, approxFeesCents = 600) {
    const ps = firstOfMonth(today);
    const pe = lastOfMonth(today);
    const ins = await supabase.from("processor_settlements").insert({
      processor_id,
      period_start: ps.toISOString().slice(0,10),
      period_end: pe.toISOString().slice(0,10),
      gross_cents: approxGrossCents,
      fees_cents: approxFeesCents,
      net_cents: Math.max(0, approxGrossCents - approxFeesCents)
    });
    if (ins.error) throw ins.error;
    say("✔ Added settlement (statement totals).");
  }

  async function runAll() {
    clearLog();
    setBusy(true);
    try {
      say("Starting QA Smoke…");

      // 1) Base entities
      const productId = await ensureProduct("QA-SODA-12", "QA Soda 12oz", 50, 175);
      const locationId = await ensureLocation("QA Test Site", {
        commission_model: "percent_gross",
        commission_pct_bps: 1000,   // 10%
        commission_flat_cents: 0,
        commission_min_cents: 0
      });
      const machineId = await ensureMachine("QA-001", locationId);

      // 2) Processor + mapping
      const procId = await ensureProcessor("Cantaloupe");
      await ensureMapping(machineId, procId);

      // 3) Finance + Insurance
      await ensureFinance(machineId, 11000, 350000);
      const policyId = await ensureInsurancePolicy("QA Liability Monthly", 3000); // $30/mo
      if (policyId) await ensureInsuranceAllocMachine(policyId, machineId, 1500); // $15/mo to this machine

      // 4) SLA + Ticket + Parts
      await ensureSLAPolicies();
      const ticketId = await createTicket(machineId, locationId);
      // parts usage (consumes the product as a "part" for demo)
      await recordParts(productId, ticketId, locationId, machineId);

      // 5) Sales inside current scope
      await recordSale(machineId, productId, 1, 175, 50);
      await recordSale(machineId, productId, 1, 175, 50);
      await recordSale(machineId, productId, 1, 175, 50);

      // 6) Settlement for current month
      await addSettlement(procId, 525, 16); // tiny numbers (in cents) for demo

      say("✅ QA Smoke complete. Now open the reports below.");

    } catch (e: any) {
      console.error(e);
      say(`❌ ERROR: ${e.message || String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Play className="h-5 w-5" />
          QA Smoke Test
        </h1>
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
        <span>
          This creates/uses: product <code>QA-SODA-12</code>, location <code>QA Test Site</code>, machine <code>QA-001</code>, processor <code>Cantaloupe</code>, mapping, finance row, insurance policy + allocation, 3 sales (card), one ticket and parts usage, and a settlement for this month. It's idempotent (re-running won't duplicate where not needed).
        </span>
      </div>

      <div className="rounded-xl border border-border bg-card p-3 text-xs h-56 overflow-auto">
        {log.length ? log.map((l, i) => <div key={i}>{l}</div>) : <div className="text-muted-foreground">Logs will appear here…</div>}
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <NavCard
          icon={<DollarSign className="h-4 w-4" />}
          title="Machine ROI"
          to="/reports/machine-roi"
          desc="Verify card fees, commissions, finance, and insurance are subtracted."
        />
        <NavCard
          icon={<Scale className="h-4 w-4" />}
          title="Processor Reconciliation"
          to="/reports/processor-reconciliation"
          desc="Compare calculated fees vs statement (settlement) for the period."
        />
        <NavCard
          icon={<Wrench className="h-4 w-4" />}
          title="Support SLAs"
          to="/reports/support-sla"
          desc="See open/overdue counts and median response/resolve. Ticket due dates auto-computed."
        />
        <NavCard
          icon={<FileText className="h-4 w-4" />}
          title="Parts Usage"
          to="/reports/parts-usage"
          desc="Validate parts pulls cost appear for this scope."
        />
      </div>

      <div className="text-xs text-muted-foreground">
        Scope used for test data: <b>{scopeStart.toLocaleString()}</b> → <b>{scopeEnd.toLocaleString()}</b> (current date window). Your global scope bar will filter the reports accordingly.
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