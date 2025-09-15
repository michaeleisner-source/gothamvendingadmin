import React, { useEffect, useMemo, useState } from "react";
import { Link, Route, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import {
  Play, CheckCircle2, AlertTriangle, RefreshCw, Plus, Package2, ClipboardList, DollarSign, TicketCheck,
  CreditCard, Landmark, Info, Factory
} from "lucide-react";

/** OpsKickstart — one-click seed of real operational data
 *  - Creates a product (if needed)
 *  - Sets PAR in inventory_levels for the selected machine
 *  - Records a real sale (qty 1)
 *  - Creates a ticket (unassigned if staff table not present)
 *  - Adds a payment processor + fee rule + mapping
 *  - Adds a finance row for ROI
 *  It only does DML (no schema changes). Any optional DDL is shown as SQL to copy.
 */

type Machine = { id: string; name?: string | null };
type Product = { id: string; name?: string | null };

const usd = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD" });
const toNum = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);

async function tableExists(t: string) {
  try {
    const r = await supabase.from(t as any).select("*").limit(1);
    return !r.error;
  } catch {
    return false;
  }
}
async function colExists(t: string, c: string) {
  try {
    const r = await supabase.from(t as any).select(c).limit(1);
    return !r.error;
  } catch {
    return false;
  }
}

function SQLNotice({ title, sql }: { title: string; sql: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-sm font-medium flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-500" /> {title}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">Copy this into Supabase → SQL Editor:</div>
      <pre className="mt-2 text-xs overflow-auto rounded bg-muted p-2">{sql}</pre>
    </div>
  );
}

export default function OpsKickstartPage() {
  const nav = useNavigate();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [hasInventoryLevels, setHasInventoryLevels] = useState<boolean | null>(null);
  const [hasTickets, setHasTickets] = useState<boolean | null>(null);
  const [hasStaff, setHasStaff] = useState<boolean | null>(null);
  const [tenderCol, setTenderCol] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const say = (m: string) => setLog((l) => [...l, m]);

  // Helper to get current org_id
  const getCurrentOrgId = async () => {
    const { data: profile } = await supabase.from('profiles').select('org_id').single();
    return profile?.org_id || '';
  };

  useEffect(() => {
    (async () => {
      const m = await supabase.from("machines").select("id,name").order("name");
      if (!m.error) {
        setMachines(m.data || []);
        if ((m.data || []).length && !selectedMachine) setSelectedMachine(m.data[0].id);
      }
      const p = await supabase.from("products").select("id,name").order("name");
      if (!p.error) {
        setProducts(p.data || []);
        if ((p.data || []).length && !selectedProduct) setSelectedProduct(p.data[0].id);
      }

      setHasInventoryLevels(await tableExists("inventory_levels"));
      setHasTickets(await tableExists("maintenance_work_orders"));
      setHasStaff(await tableExists("staff"));

      // tender column detection
      setTenderCol(null); // No tender columns needed for basic functionality
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedMachineName = useMemo(
    () => machines.find((m) => m.id === selectedMachine)?.name || selectedMachine || "—",
    [machines, selectedMachine]
  );

  async function ensureProduct(): Promise<string> {
    // Use selected product if present; otherwise create Bottled Water
    if (selectedProduct) return selectedProduct;
    say("No products found — creating 'Bottled Water 16oz'…");
    const ins = await supabase.from("products").insert({ 
      name: "Bottled Water 16oz", 
      sku: "WATER16OZ", 
      price: 2.00, 
      cost: 0.70,
      org_id: await getCurrentOrgId()
    }).select("id").single();
    if (ins.error || !ins.data?.id) throw new Error(ins.error?.message || "Failed to create product");
    setProducts([{ id: ins.data.id, name: "Bottled Water 16oz" }]);
    setSelectedProduct(ins.data.id);
    return ins.data.id;
  }

  async function seedProductAndPAR() {
    if (!selectedMachine) { alert("Pick a machine first."); return; }
    setBusy(true); setLog([]);
    try {
      const productId = await ensureProduct();
      if (!hasInventoryLevels) throw new Error("inventory_levels table missing");

      // Need to ensure a machine slot exists first
      say("Ensuring machine slot exists...");
      let slotId: string;
      const existingSlot = await supabase.from("machine_slots")
        .select("id")
        .eq("machine_id", selectedMachine)
        .limit(1)
        .single();
      
      if (existingSlot.data?.id) {
        slotId = existingSlot.data.id;
      } else {
        const newSlot = await supabase.from("machine_slots").insert({
          machine_id: selectedMachine,
          row: 1,
          col: 1,
          label: "A1",
          capacity: 24,
          org_id: await getCurrentOrgId()
        }).select("id").single();
        if (newSlot.error) throw newSlot.error;
        slotId = newSlot.data.id;
      }

      say(`Setting PAR for ${selectedMachineName}…`);
      const up = await supabase.from("inventory_levels").upsert({
        machine_id: selectedMachine, 
        product_id: productId, 
        slot_id: slotId,
        current_qty: 0, 
        par_level: 24,
        org_id: await getCurrentOrgId()
      });
      if (up.error) throw up.error;
      say("✔ PAR set (qty 0, PAR 24).");
    } catch (e: any) {
      say("ERROR: " + (e?.message || String(e)));
    } finally {
      setBusy(false);
    }
  }

  async function recordSale() {
    if (!selectedMachine) { alert("Pick a machine first."); return; }
    setBusy(true); setLog([]);
    try {
      const productId = await ensureProduct();
      say(`Recording a $2.00 sale (cost $0.70) on ${selectedMachineName}…`);
      const payload: any = {
        machine_id: selectedMachine, product_id: productId,
        qty: 1, unit_price_cents: 200, unit_cost_cents: 70,
        occurred_at: new Date().toISOString(),
        org_id: await getCurrentOrgId()
      };
      if (tenderCol) payload[tenderCol] = "card"; // set tender if available (currently none exist)
      const ins = await supabase.from("sales").insert(payload).select("id").single();
      if (ins.error) throw ins.error;
      say("✔ Sale recorded.");
      say("Tip: refresh Ops Dashboard/Executive Report to see KPIs update.");
    } catch (e: any) {
      say("ERROR: " + (e?.message || String(e)));
    } finally {
      setBusy(false);
    }
  }

  async function createTicket() {
    if (!selectedMachine) { alert("Pick a machine first."); return; }
    if (!hasTickets) { alert("maintenance_work_orders table missing."); return; }
    setBusy(true); setLog([]);
    try {
      say("Creating maintenance work order (unassigned)…");
      const t = await supabase.from("maintenance_work_orders").insert({
        machine_id: selectedMachine, 
        issue: "Bill Acceptor Jam - Won't take $1s", 
        priority: "high",
        org_id: await getCurrentOrgId()
      }).select("id").single();
      if (t.error) throw t.error;
      say("✔ Work order created.");
      if (!hasStaff) say("Note: Staff table not found — work order left unassigned.");
    } catch (e: any) {
      say("ERROR: " + (e?.message || String(e)));
    } finally {
      setBusy(false);
    }
  }

  async function addProcessorAndFees() {
    if (!selectedMachine) { alert("Pick a machine first."); return; }
    setBusy(true); setLog([]);
    try {
      say("Ensuring payment processor 'Cantaloupe'…");
      // 1) processor
      let procId: string | null = null;
      const gp = await supabase.from("payment_processors").select("id").eq("name", "Cantaloupe").maybeSingle();
      if (!gp.error && gp.data?.id) procId = gp.data.id;
      if (!procId) {
        const np = await supabase.from("payment_processors").insert({ 
          name: "Cantaloupe",
          default_percent_fee: 2.9,
          default_fixed_fee: 0.10,
          org_id: await getCurrentOrgId()
        }).select("id").single();
        if (np.error) throw np.error; 
        procId = np.data.id;
      }
      // 2) mapping
      say("Mapping machine → processor…");
      const map = await supabase.from("machine_processor_mappings").select("id")
        .eq("machine_id", selectedMachine).eq("processor_id", procId!).maybeSingle();
      if (map.error || !map.data) {
        const ins = await supabase.from("machine_processor_mappings").insert({ 
          machine_id: selectedMachine, 
          processor_id: procId!,
          percent_fee: 2.9,
          fixed_fee: 0.10,
          org_id: await getCurrentOrgId()
        });
        if (ins.error) throw ins.error;
      }
      say("✔ Processor + mapping ready.");
    } catch (e: any) {
      say("ERROR: " + (e?.message || String(e)));
    } finally {
      setBusy(false);
    }
  }

  async function addFinanceRow() {
    if (!selectedMachine) { alert("Pick a machine first."); return; }
    setBusy(true); setLog([]);
    try {
      say("Adding finance row: $3,500 capex, $110/mo payment, 9.9% APR…");
      // ensure not duplicating for same machine
      const ex = await supabase.from("machine_finance").select("id").eq("machine_id", selectedMachine).maybeSingle();
      if (ex.data?.id) {
        say("Finance row already exists — skipping insert.");
      } else {
        const ins = await supabase.from("machine_finance").insert({
          machine_id: selectedMachine,
          acquisition_type: "lease",
          purchase_price: 3500,
          monthly_payment: 110,
          apr: 9.9,
          term_months: 36,
          org_id: await getCurrentOrgId()
        });
        if (ins.error) throw ins.error;
        say("✔ Finance row inserted.");
      }
    } catch (e: any) {
      say("ERROR: " + (e?.message || String(e)));
    } finally {
      setBusy(false);
    }
  }

  async function runAll() {
    if (!selectedMachine) { alert("Pick a machine first."); return; }
    setBusy(true); setLog([]);
    try {
      await seedProductAndPAR();
      await recordSale();
      await createTicket();
      await addProcessorAndFees();
      await addFinanceRow();
      say("✔ All steps complete. Open the Executive report or Ops dashboard.");
    } finally { setBusy(false); }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2"><Factory className="h-5 w-5"/> Ops Kickstart</h1>
        <div className="flex items-center gap-2">
          <button onClick={()=>window.location.reload()} className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted">
            <RefreshCw className="h-4 w-4"/> Refresh
          </button>
          <Link to="/admin/review-snapshot" className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted">
            <BarIcon/> Review Snapshot
          </Link>
        </div>
      </div>

      {/* Machine & Product pickers */}
      <div className="rounded-xl border border-border p-3 space-y-3">
        <div className="text-sm font-medium">Targets</div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Machine</label>
            <select value={selectedMachine} onChange={(e)=>setSelectedMachine(e.target.value)} className="mt-1 w-full rounded-md bg-background border border-border px-3 py-2 text-sm">
              {machines.map(m => <option key={m.id} value={m.id}>{m.name || m.id}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Product</label>
            <select value={selectedProduct} onChange={(e)=>setSelectedProduct(e.target.value)} className="mt-1 w-full rounded-md bg-background border border-border px-3 py-2 text-sm">
              <option value="">(Create "Bottled Water 16oz" if empty)</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name || p.id}</option>)}
            </select>
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-1">Selected machine: <b>{selectedMachineName}</b></div>
      </div>

      {/* Actions */}
      <div className="grid gap-3 sm:grid-cols-2">
        <ActionCard
          icon={<Package2 className="h-4 w-4" />} title="Seed Product + PAR"
          desc="Ensure a product exists and set PAR=24 on this machine."
          onClick={seedProductAndPAR} busy={busy}
        />
        <ActionCard
          icon={<DollarSign className="h-4 w-4" />} title="Record Sale"
          desc={`Insert qty 1 at $2.00 price, $0.70 cost. Basic sale recording without payment method tracking.`}
          onClick={recordSale} busy={busy}
        />
        <ActionCard
          icon={<TicketCheck className="h-4 w-4" />} title="Create Ticket"
          desc={hasStaff ? "Open work order and assign later." : "Open work order (unassigned). Add staff via SQL for assignments."}
          onClick={createTicket} busy={busy}
        />
        <ActionCard
          icon={<CreditCard className="h-4 w-4" />} title="Add Processor & Fees"
          desc="Cantaloupe + map machine + fee rule (2.9% + $0.10)."
          onClick={addProcessorAndFees} busy={busy}
        />
        <ActionCard
          icon={<Landmark className="h-4 w-4" />} title="Add Finance Row"
          desc="Capex $3,500, payment $110/mo, APR 9.9%."
          onClick={addFinanceRow} busy={busy}
        />
        <ActionCard
          icon={<Play className="h-4 w-4" />} title="Run All"
          desc="Executes all steps above in sequence."
          onClick={runAll} busy={busy}
        />
      </div>

      {/* Optional SQL helpers */}
      {!tenderCol && (
        <SQLNotice
          title="Optional: Add a tender column to sales (for Card vs Cash report)"
          sql={`alter table public.sales add column if not exists payment_method text check (payment_method in ('card','cash')) default 'card';`}
        />
      )}
      {!hasStaff && hasTickets && (
        <SQLNotice
          title="Optional: Add staff and link maintenance_work_orders.technician_id (for Tech Productivity/MTTR)"
          sql={`create table if not exists public.staff(
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text
);
-- Note: maintenance_work_orders already has technician_id field`}
        />
      )}

      {/* Logs */}
      <div className="rounded-xl border border-border bg-card p-3 text-xs space-y-1 max-h-72 overflow-auto">
        <div className="text-sm font-medium mb-1">Logs</div>
        {log.length ? log.map((l, i) => <div key={i}>{l}</div>) : <div className="text-muted-foreground">No actions yet.</div>}
      </div>

      <div className="text-xs text-muted-foreground flex items-start gap-2">
        <Info className="h-4 w-4 mt-0.5" />
        <span>
          After running at least <b>Seed Product + PAR</b> and <b>Record Sale</b>, open
          {" "}<Link className="underline" to="/ops">Ops Dashboard</Link> or {" "}
          <Link className="underline" to="/reports/executive">Executive Overview</Link> to see live KPIs.
        </span>
      </div>
    </div>
  );
}

function ActionCard({ icon, title, desc, onClick, busy }: { icon: React.ReactNode; title: string; desc: string; onClick: ()=>void; busy:boolean }) {
  return (
    <div className="rounded-xl border border-border p-3 flex flex-col gap-2">
      <div className="text-sm font-medium flex items-center gap-2">{icon}{title}</div>
      <div className="text-sm text-muted-foreground">{desc}</div>
      <div className="mt-auto">
        <button
          disabled={busy}
          onClick={onClick}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted disabled:opacity-60"
        >
          <Plus className="h-4 w-4" /> {busy ? "Working…" : "Do it"}
        </button>
      </div>
    </div>
  );
}

function BarIcon(props:any){ return (
  <svg {...props} className="h-4 w-4" viewBox="0 0 24 24" fill="none">
    <path d="M4 20V10" stroke="currentColor"/><path d="M10 20V4" stroke="currentColor"/><path d="M16 20V7" stroke="currentColor"/><path d="M3 20h18" stroke="currentColor"/>
  </svg>
);}

/** Route helper — import this in App.tsx */
export function OpsKickstartRoutes({ ProtectedRoute }: { ProtectedRoute?: React.ComponentType<{children:React.ReactNode}> }) {
  const Wrap: React.FC<{children:React.ReactNode}> = ({ children }) =>
    ProtectedRoute ? <ProtectedRoute>{children}</ProtectedRoute> : <>{children}</>;
  return (
    <>
      <Route path="/admin/kickstart" element={<Wrap><OpsKickstartPage /></Wrap>} />
    </>
  );
}