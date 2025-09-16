import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Activity, AlertTriangle, CheckCircle2, CircleSlash2, ClipboardList, Cpu, DollarSign, FileText, Factory,
  Gauge, Globe, Layers, ListChecks, LogIn, LogOut, MapPin, Package, RefreshCw, Scale, ServerCog, Shield, ShieldCheck, Wrench
} from "lucide-react";

type Any = Record<string, any>;
const money = (c?: number|null) => typeof c === "number" ? `$${(c/100).toFixed(2)}` : "—";
const iso = (d = new Date()) => d.toISOString();
const sleep = (ms:number)=> new Promise(r=>setTimeout(r,ms));

async function probeCount(table: string) {
  try {
    const r = await (supabase as any).from(table).select("id", { count: "exact", head: true });
    if (r.error) return { ok: false, code: (r.error as Any).code, message: r.error.message };
    return { ok: true, count: r.count ?? 0 };
  } catch (e:any) {
    return { ok: false, code: e?.code, message: e?.message || String(e) };
  }
}
async function columnExists(table: string, column: string) {
  const r = await (supabase as any).from(table).select(column).limit(1);
  if (r.error) {
    return !(String(r.error.code) === "42703" || /column .* does not exist/i.test(r.error.message));
  }
  return true;
}

export default function OpsConsole() {
  const [sessionOk, setSessionOk] = useState<"yes"|"no"|"checking">("checking");
  const [demoEnv, setDemoEnv] = useState<boolean>(false);
  const [routerMode, setRouterMode] = useState<"hash"|"browser">("browser");
  const [log, setLog] = useState<string[]>([]);
  const [errors, setErrors] = useState<string|null>(null);
  const say = (m:string)=> setLog(l=>[...l, m]);

  const [counts, setCounts] = useState<Any>({});
  const [schemaFlags, setSchemaFlags] = useState<Any>({});
  const [rlsFlags, setRlsFlags] = useState<Any>({});

  useEffect(() => {
    setRouterMode(window.location.hash.startsWith("#/") ? "hash" : "browser");
    setDemoEnv(import.meta.env.VITE_PUBLIC_DEMO === "true");
    checkSession();
    runChecks();
  }, []);

  async function checkSession() {
    setSessionOk("checking");
    const { data } = await supabase.auth.getSession();
    setSessionOk(data.session ? "yes" : "no");
  }
  async function signInDemo() {
    try {
      const email = import.meta.env.VITE_DEMO_EMAIL || "demo@example.com";
      const password = import.meta.env.VITE_DEMO_PASSWORD || "supersecret";
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await checkSession();
      say("✔ Signed in as demo.");
      await runChecks();
    } catch (e:any) {
      setErrors(e?.message || String(e));
      say(`❌ Sign-in failed: ${e?.message || String(e)}`);
    }
  }
  async function signOut() { await supabase.auth.signOut(); await checkSession(); say("✔ Signed out."); }

  async function runChecks() {
    setErrors(null); setLog([]); say("Probing tables & columns…");
    const needTables = [
      "prospects","locations","machines","products","inventory_levels","sales","tickets","delivery_routes",
      "machine_finance","payment_processors","machine_processor_mappings","insurance_policies","insurance_allocations","processor_settlements"
    ];
    const countsResult: Any = {};
    const rlsResult: Any = {};
    for (const t of needTables) {
      const c = await probeCount(t);
      countsResult[t] = c.ok ? c.count : null;
      if (!c.ok) rlsResult[t] = c.code || c.message || "unknown error";
      await sleep(10);
    }
    setCounts(countsResult);
    setRlsFlags(rlsResult);

    const flags: Any = {};
    flags.locations_commission_model = await columnExists("locations","commission_model");
    flags.locations_commission_pct_bps = await columnExists("locations","commission_pct_bps");
    flags.sales_unit_cost_cents = await columnExists("sales","unit_cost_cents");
    flags.sales_payment_method  = await columnExists("sales","payment_method");
    flags.machine_finance_monthly = await columnExists("machine_finance","monthly_payment_cents");
    flags.ins_alloc_flat = await columnExists("insurance_allocations","flat_monthly_cents");
    setSchemaFlags(flags);

    say("✔ Checks complete.");
  }

  const routerOK = routerMode === "hash";
  const hasFinance = !!counts.machine_finance || schemaFlags.machine_finance_monthly;
  const hasCommission = schemaFlags.locations_commission_model && schemaFlags.locations_commission_pct_bps;
  const hasInsurance = !!counts.insurance_policies && schemaFlags.ins_alloc_flat;
  const salesHaveCOGS = schemaFlags.sales_unit_cost_cents === true;

  const redRls = Object.keys(rlsFlags).length > 0;

  return (
    <div className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xl font-semibold">
          <ServerCog className="h-5 w-5" /> Ops Console — Health, RLS & Flow
        </div>
        <div className="flex items-center gap-2">
          <Badge icon={<Globe className="h-3.5 w-3.5" />} label={`router: ${routerMode}`} ok={routerOK} />
          <Badge icon={<Shield className="h-3.5 w-3.5" />} label={`session: ${sessionOk}`} ok={sessionOk==="yes"} />
          <Badge icon={<Cpu className="h-3.5 w-3.5" />} label={`demo: ${demoEnv ? "true" : "false"}`} ok={demoEnv} />
          {sessionOk==="no" ? (
            <>
              <button onClick={signInDemo} className="rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted inline-flex items-center gap-1">
                <LogIn className="h-4 w-4" /> Sign in as Demo
              </button>
              <Link to="/auth" className="rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted inline-flex items-center gap-1">
                <LogIn className="h-4 w-4" /> Go to Login
              </Link>
            </>
          ) : (
            <button onClick={signOut} className="rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted inline-flex items-center gap-1">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          )}
          <button onClick={runChecks} className="rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted inline-flex items-center gap-1">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </header>

      {errors && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs whitespace-pre-wrap">
          <div className="font-medium mb-1">Error</div>
          {errors}
        </div>
      )}

      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        <Tile icon={<Package className="h-4 w-4" />} title="Products" ok={counts.products>=0} detail={counts.products>=0?`${counts.products} items`:"RLS / missing table"} />
        <Tile icon={<MapPin className="h-4 w-4" />} title="Locations" ok={counts.locations>=0} detail={counts.locations>=0?`${counts.locations} sites`:"RLS / missing table"} />
        <Tile icon={<Factory className="h-4 w-4" />} title="Machines" ok={counts.machines>=0} detail={counts.machines>=0?`${counts.machines} machines`:"RLS / missing table"} />
        <Tile icon={<ClipboardList className="h-4 w-4" />} title="Inventory Levels" ok={counts.inventory_levels>=0} detail={counts.inventory_levels>=0?`${counts.inventory_levels} rows`:"RLS / missing"} />
        <Tile icon={<DollarSign className="h-4 w-4" />} title="Sales" ok={counts.sales>=0} detail={counts.sales>=0?`${counts.sales} rows`:"RLS / missing"} />
        <Tile icon={<Wrench className="h-4 w-4" />} title="Tickets" ok={counts.tickets>=0} detail={counts.tickets>=0?`${counts.tickets} rows`:"RLS / missing"} />
        <Tile icon={<Gauge className="h-4 w-4" />} title="Finance" ok={hasFinance} detail={hasFinance ? "ok" : "columns missing"} />
        <Tile icon={<Scale className="h-4 w-4" />} title="Processor Mapping" ok={counts.payment_processors>=0 && counts.machine_processor_mappings>=0} detail={(counts.payment_processors??0)+(counts.machine_processor_mappings??0)>0?"ok":"missing / RLS"} />
        <Tile icon={<ShieldCheck className="h-4 w-4" />} title="Insurance" ok={hasInsurance} detail={hasInsurance?"ok":"tables/columns missing"} />
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="font-medium mb-2 flex items-center gap-2"><ListChecks className="h-4 w-4" /> Schema requirements by page</div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
          <Req ok={counts.prospects>=0} title="Prospects (Kanban)" need="prospects table readable" />
          <Req ok={counts.locations>=0 && hasCommission} title="Convert Prospect → Location + Contract" need="locations.commission_model, commission_pct_bps" />
          <Req ok={counts.machines>=0} title="Machines list/detail" need="machines readable" />
          <Req ok={salesHaveCOGS} title="Sales & ROI" need="sales.unit_cost_cents, sales.payment_method" />
          <Req ok={hasFinance} title="Machine Finance" need="machine_finance.monthly_payment_cents" />
          <Req ok={hasInsurance} title="Insurance allocation in ROI" need="insurance_policies + insurance_allocations.flat_monthly_cents" />
          <Req ok={counts.payment_processors>=0 && counts.machine_processor_mappings>=0} title="Processor Fees / Reconciliation" need="payment_processors + machine_processor_mappings + processor_settlements" />
          <Req ok={counts.tickets>=0} title="Maintenance & SLAs" need="tickets readable, (ticket_sla_policies optional)" />
          <Req ok={counts.inventory_levels>=0} title="Inventory & Restock" need="inventory_levels readable" />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="font-medium mb-2 flex items-center gap-2"><Shield className="h-4 w-4" /> RLS hot-spots</div>
        {Object.keys(rlsFlags).length ? (
          <div className="space-y-1 text-xs">
            {Object.entries(rlsFlags).map(([tbl, msg])=>(
              <div key={tbl} className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1">
                <b>{tbl}</b>: {String(msg)}
              </div>
            ))}
            <details className="mt-2">
              <summary className="cursor-pointer">Temporary "dev-open" policy (paste in Supabase if blocked)</summary>
              <pre className="mt-2 overflow-x-auto text-[11px] leading-tight">
{`do $$
declare t text;
begin
  foreach t in array array['products','locations','machines','sales','tickets','inventory_levels','payment_processors','machine_processor_mappings','machine_finance','insurance_policies','insurance_allocations','processor_settlements'] loop
    execute format('alter table public.%I enable row level security;', t);
    begin execute format('drop policy if exists dev_open on public.%I;', t); exception when others then null; end;
    execute format('create policy dev_open on public.%I for all using (true) with check (true);', t);
  end loop;
end $$;`}
              </pre>
            </details>
          </div>
        ) : (
          <div className="text-xs text-emerald-400">No RLS errors detected on basic reads.</div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="font-medium mb-2 flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Quick nav (validate pages)</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
          <Nav to="/" label="Dashboard" icon={<Gauge className="h-4 w-4" />} />
          <Nav to="/prospects" label="Prospects" icon={<FileText className="h-4 w-4" />} />
          <Nav to="/locations" label="Locations (Sites & Contracts)" icon={<MapPin className="h-4 w-4" />} />
          <Nav to="/machines" label="Machines" icon={<Factory className="h-4 w-4" />} />
          <Nav to="/inventory" label="Inventory" icon={<Package className="h-4 w-4" />} />
          <Nav to="/sales" label="Sales Entry" icon={<DollarSign className="h-4 w-4" />} />
          <Nav to="/reports/machine-roi" label="Machine ROI" icon={<Scale className="h-4 w-4" />} />
          <Nav to="/tickets" label="Tickets" icon={<Wrench className="h-4 w-4" />} />
          <Nav to="/help" label="Help Center" icon={<FileText className="h-4 w-4" />} />
        </div>
      </section>
    </div>
  );
}

function Badge({ icon, label, ok }: { icon: React.ReactNode; label: string; ok: boolean; }) {
  return (
    <div className={`text-xs inline-flex items-center gap-1 rounded-md px-2 py-1 border ${ok ? "border-emerald-500/30 bg-emerald-500/10" : "border-rose-500/30 bg-rose-500/10"}`}>
      {icon}{label}
    </div>
  );
}
function Tile({ icon, title, ok, detail }: { icon: React.ReactNode; title: string; ok: boolean; detail: string; }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          {icon}{title}
        </div>
        {ok ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <CircleSlash2 className="h-5 w-5 text-rose-500" />}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{detail}</div>
    </div>
  );
}
function Req({ ok, title, need }: { ok: boolean; title: string; need: string; }) {
  return (
    <div className={`rounded-lg border ${ok?"border-emerald-500/30 bg-emerald-500/5":"border-amber-500/30 bg-amber-500/10"} p-3`}>
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-muted-foreground mt-1">Needs: {need}</div>
    </div>
  );
}
function Nav({ to, label, icon }: { to: string; label: string; icon: React.ReactNode; }) {
  return (
    <Link to={to} className="rounded-lg border border-border bg-background px-3 py-2 hover:bg-muted inline-flex items-center gap-2">
      {icon}{label}
    </Link>
  );
}