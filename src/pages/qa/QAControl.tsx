import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  LogIn,
  LogOut,
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

async function recordSale(machine_id: string, product_id: string, qty: number, priceCents: number, costCents: number, say: (s: string)=>void) {
  const ins = await supabase.from("sales").insert({
    machine_id, 
    product_id, 
    qty, 
    unit_price_cents: priceCents, 
    unit_cost_cents: costCents, 
    occurred_at: iso(new Date()), 
    payment_method: "card",
    org_id: "00000000-0000-0000-0000-000000000000" // QA test org_id
  });
  if (ins.error) throw ins.error; 
  say(`✔ Recorded sale ${qty} × ${money(priceCents)}.`);
}

/** ---------- Page ---------- */
export default function QAControl() {
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [sessionOK, setSessionOK] = useState<"yes"|"no"|"checking">("checking");
  const [err, setErr] = useState<string | null>(null);

  // snapshot state for verify tiles
  const [product, setProduct] = useState<Any | null>(null);
  const [location, setLocation] = useState<Any | null>(null);
  const [machine, setMachine] = useState<Any | null>(null);
  const [sales, setSales] = useState<Any[]>([]);

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

      say("→ Ensure Product (products)");
      const pid = await ensureProduct("QA-SODA-12", "QA Soda 12oz", 50, say);

      say("→ Ensure Location (locations)");
      const lid = await ensureLocation("QA Test Site", {
        commission_model: "percent_gross",
        commission_pct_bps: 1000,
        commission_flat_cents: 0,
        commission_min_cents: 0,
      }, say);

      say("→ Ensure Machine (machines)");
      await ensureMachine("QA-001", lid, say);

      say("✅ Base complete.");
    } catch (e: any) {
      const msg = prettyErr(e);
      setErr(msg);
      say(`❌ Base failed\n${msg}`);
    } finally { setBusy(false); }
  }

  async function verify() {
    setErr(null); setBusy(true);
    try {
      const p = await supabase.from("products").select("id,sku,name,cost_cents").eq("sku","QA-SODA-12").maybeSingle();
      setProduct(p.data ?? null);

      const l = await supabase.from("locations").select("id,name").eq("name","QA Test Site").maybeSingle();
      setLocation(l.data ?? null);

      const m = await supabase.from("machines").select("id,name,location_id").eq("name","QA-001").maybeSingle();
      setMachine(m.data ?? null);

      if (m.data && p.data) {
        const ss = await supabase.from("sales").select("qty,unit_price_cents,unit_cost_cents,occurred_at,payment_method")
          .eq("machine_id", m.data.id).eq("product_id", p.data.id);
        setSales(ss.data ?? []);
      }
    } catch (e: any) {
      setErr(prettyErr(e));
    } finally { setBusy(false); }
  }

  useEffect(() => { checkSession(); verify(); }, []);

  const gross = useMemo(() => sum(sales.map(s => (s.qty ?? 0) * (s.unit_price_cents ?? 0))), [sales]);

  return (
    <div className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2"><ListChecks className="h-5 w-5" /> QA Control</h1>
        <div className="flex items-center gap-2">
          <div className="text-xs inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1">
            <User className="h-3.5 w-3.5" />
            session: <b className={sessionOK==="yes" ? "text-emerald-400" : "text-rose-400"}>{sessionOK}</b>
          </div>
          <button onClick={() => { checkSession(); verify(); }} className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </header>

      <div className="flex gap-2">
        <button disabled={busy} onClick={runBase} className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted disabled:opacity-50">
          <Play className="h-4 w-4" /> Run Base Test
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <CheckCard icon={<Package className="h-4 w-4" />} label="Product QA-SODA-12" pass={!!product} detail={product ? `${product.name}` : "Not found"} />
        <CheckCard icon={<MapPin className="h-4 w-4" />} label="Location QA Test Site" pass={!!location} detail={location ? `id ${location.id}` : "Not found"} />
        <CheckCard icon={<Factory className="h-4 w-4" />} label="Machine QA-001" pass={!!machine} detail={machine ? "Ready" : "Not found"} />
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="font-medium mb-2">Sales: {money(gross)}</div>
      </div>

      {log.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium">Operation Log</div>
            <button onClick={clearLog} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
          </div>
          <div className="bg-background rounded-lg p-3 max-h-48 overflow-y-auto">
            <div className="space-y-1 text-xs font-mono">
              {log.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          </div>
        </div>
      )}
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