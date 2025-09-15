import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePageSEO } from "@/hooks/usePageSEO";
import { HelpTooltip } from "@/components/ui/HelpTooltip";
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
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
} from "lucide-react";

type Any = Record<string, any>;
const startOfMonth = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d = new Date()) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const isoDate = (d: Date) => d.toISOString().slice(0, 10);

function money(cents?: number | null) {
  return typeof cents === "number" ? `$${(cents / 100).toFixed(2)}` : "—";
}
function sum(arr: number[]) { return arr.reduce((a, b) => a + b, 0); }

export default function VerifySmoke() {
  usePageSEO({
    title: "QA Smoke Test - System Verification",
    description: "Comprehensive smoke test for QA validation and system integrity verification"
  });

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Snapshot
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
  const twoWeeksAgo = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() - 14); d.setHours(0,0,0,0); return d;
  }, []);

  async function load() {
    setBusy(true); setErr(null);
    try {
      // 1) Product
      const p = await supabase.from("products").select("id,sku,name,cost_cents").eq("sku","QA-SODA-12").maybeSingle();
      if (p.error) throw p.error;
      setProduct(p.data ?? null);

      // 2) Location
      const l = await supabase.from("locations").select("*").eq("name","QA Test Site").maybeSingle();
      if (l.error) throw l.error;
      setLocation(l.data ?? null);

      // 3) Machine
      let m: Any | null = null;
      {
        const q = await supabase.from("machines").select("id,name,location_id").eq("name","QA-001").maybeSingle();
        if (q.error) throw q.error;
        m = q.data ?? null;
        setMachine(m);
      }

      // 4) Finance (optional schema)
      if (m) {
        const f = await supabase.from("machine_finance")
          .select("machine_id,monthly_payment,purchase_price,apr")
          .eq("machine_id", m.id)
          .maybeSingle();
        // do not throw on error; it may not exist yet
        if (!f.error) setFinance(f.data ?? null);
      }

      // 5) Processor + mapping (optional)
      let proc: Any | null = null;
      if (m) {
        const map = await supabase.from("machine_processor_mappings").select("processor_id").eq("machine_id", m.id).maybeSingle();
        if (!map.error && map.data) {
          const pr = await supabase.from("payment_processors").select("id,name").eq("id", map.data.processor_id).maybeSingle();
          if (!pr.error) proc = pr.data ?? null;
        }
      }
      setProcessor(proc);

      // 6) Insurance policy + allocation (optional)
      let pol: Any | null = null;
      let al: Any | null = null;
      const ps = isoDate(monthStart), pe = isoDate(monthEnd);
      {
        const polQ = await supabase.from("insurance_policies")
          .select("id,name,monthly_premium_cents,coverage_start,coverage_end")
          .lte("coverage_start", pe).gte("coverage_end", ps).maybeSingle();
        if (!polQ.error) pol = polQ.data ?? null;

        if (pol && m) {
          const alQ = await supabase.from("insurance_allocations")
            .select("id,level,flat_monthly_cents,allocated_pct_bps,machine_id,policy_id")
            .eq("policy_id", pol.id).eq("level","machine").eq("machine_id", m.id).maybeSingle();
          if (!alQ.error) al = alQ.data ?? null;
        }
      }
      setPolicy(pol);
      setAlloc(al);

      // 7) Ticket (latest for machine)
      if (m) {
        const t = await supabase.from("tickets")
          .select("id,title,status,priority,created_at")
          .eq("machine_id", m.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!t.error) setTicket(t.data ?? null);
      }

      // 8) Parts usage (count)
      if (m && ticket) {
        const it = await supabase.from("inventory_transactions")
          .select("id", { count: "exact", head: true })
          .eq("machine_id", m.id)
          .eq("ref_type","ticket")
          .eq("ref_id", ticket.id)
          .eq("reason","parts");
        if (!it.error && typeof it.count === "number") setPartsCount(it.count);
      } else {
        // compute even if ticket not just created yet: count parts this month for machine
        if (m) {
          const it2 = await supabase.from("inventory_transactions")
            .select("id", { count: "exact", head: true })
            .eq("machine_id", m.id)
            .eq("reason","parts");
          if (!it2.error && typeof it2.count === "number") setPartsCount(it2.count);
        }
      }

      // 9) Sales (last 14 days for machine/product)
      if (m && product) {
        const ss = await supabase.from("sales")
          .select("qty,unit_price_cents,unit_cost_cents,occurred_at,payment_method")
          .eq("machine_id", m.id)
          .eq("product_id", product.id)
          .gte("occurred_at", new Date(twoWeeksAgo).toISOString());
        if (!ss.error) setSales(ss.data ?? []);
      }

      // 10) Settlement (this month, for processor)
      if (processor) {
        const st = await supabase.from("processor_settlements")
          .select("id,gross_cents,fees_cents,net_cents,period_start,period_end")
          .eq("processor_id", processor.id)
          .gte("period_start", isoDate(monthStart))
          .lte("period_end", isoDate(monthEnd))
          .order("period_start", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!st.error) setSettlement(st.data ?? null);
      }
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { load(); /* initial */ }, []);

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
            <ListChecks className="h-6 w-6" /> QA Smoke Test Validation
          </h1>
          <HelpTooltip content="Smoke test validation for critical system components and data flows." />
        </div>
        <button
          onClick={load}
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
        <CheckCard icon={<Landmark className="h-4 w-4" />} label="Finance Row" pass={!!finance} detail={finance ? `payment ${money(finance.monthly_payment ? finance.monthly_payment * 100 : null)} / mo` : "Missing (optional)"} />
        <CheckCard icon={<ShieldCheck className="h-4 w-4" />} label="Insurance Allocation" pass={!!alloc} detail={alloc ? `flat ${money(alloc.flat_monthly_cents)}` : (policy ? "Policy present, no allocation" : "Missing (optional)")} />
        <CheckCard icon={<Wrench className="h-4 w-4" />} label="Ticket (latest)" pass={!!ticket} detail={ticket ? `${ticket.status} • created ${new Date(ticket.created_at).toLocaleDateString()}` : "Not found (optional)"} />
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
    <div className="rounded-xl border border-border bg-card p-3 hover:bg-muted/50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          {icon} {label}
        </div>
        {pass ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-destructive" />}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{detail}</div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string; }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}