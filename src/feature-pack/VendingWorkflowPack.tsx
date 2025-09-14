import React, { useEffect, useMemo, useState } from "react";
import { Link, Route } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  MapPinned, Factory, Package2, DollarSign, BarChart3, ListChecks, ArrowRight, ClipboardList,
} from "lucide-react";

/** =========================================================================
 *  NEXT-ACTION BAR — suggests the "what's next" for each page
 *  Place <NextActionBar/> just under your page title in your main layout.
 *  =======================================================================*/
const NEXT_MAP: Record<string, { to: string; label: string; note?: string }[]> = {
  "/prospects": [
    { to: "/locations", label: "Convert to Location", note: "After qualifying a lead" },
    { to: "/help?cat=pipeline", label: "Pipeline Help" },
  ],
  "/locations": [
    { to: "/machines", label: "Add / Assign Machine" },
    { to: "/finance/commissions", label: "Set Commission Terms" },
  ],
  "/machines": [
    { to: "/setup", label: "Complete Machine Setup" },
    { to: "/slots", label: "Plan Slots" },
  ],
  "/setup": [{ to: "/slots", label: "Plan Slots" }],
  "/slots": [
    { to: "/picklists", label: "Generate Picklist" },
    { to: "/restock", label: "Record Restock" },
  ],
  "/picklists": [{ to: "/restock", label: "Record Restock" }],
  "/restock": [
    { to: "/sales", label: "Import/Enter Sales" },
    { to: "/reports/sales-summary", label: "Review 7-day Sales" },
  ],
  "/sales": [
    { to: "/finance/processors", label: "Configure Processor & Fees" },
    { to: "/reports/processor-recon", label: "Run Processor Reconciliation" },
  ],
  "/products": [
    { to: "/purchase-orders/new", label: "Create Purchase Order" },
    { to: "/inventory", label: "Receive to Inventory" },
  ],
  "/purchase-orders": [{ to: "/inventory", label: "Receive Inventory" }],
  "/inventory": [{ to: "/picklists", label: "Build Picklist from Par/Risk" }],
  "/reports": [
    { to: "/reports/sales-summary", label: "Sales Summary (7d)" },
    { to: "/reports/silent-machines", label: "Silent Machines" },
  ],
};

export function NextActionBar() {
  const pathname = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") || "/" : "/";
  const base = "/" + (pathname.split("/")[1] || "");
  const actions = NEXT_MAP[pathname] || NEXT_MAP[base] || [];
  if (!actions.length) return null;

  return (
    <div className="mb-3 rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <ListChecks className="h-4 w-4" />
        Suggested next steps
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {actions.map((a, i) => (
          <Link
            key={i}
            to={a.to}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted"
          >
            {a.label}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ))}
      </div>
      {actions.some(a => a.note) && (
        <div className="mt-2 text-xs text-muted-foreground">
          {actions.filter(a => a.note).map((a, i) => <span key={i} className="mr-3">• {a.note}</span>)}
        </div>
      )}
    </div>
  );
}

/** =========================================================================
 *  WORKFLOW PAGE — one screen guide for the whole business flow
 *  Route: /workflow
 *  =======================================================================*/
type Ctx = { prospects: number; locations: number; machines: number; products: number; lowRisk: number; unslotted: number };

export function Workflow() {
  const [ctx, setCtx] = useState<Ctx | null>(null);

  useEffect(() => {
    (async () => {
      const countExact = async (q: any) => {
        const { count, error } = await q;
        if (error) return 0;
        return count ?? 0;
      };
      const prospects = await countExact(supabase.from("prospects").select("id", { count: "exact", head: true }));
      const locations  = await countExact(supabase.from("locations").select("id", { count: "exact", head: true }));
      const machines   = await countExact(supabase.from("machines").select("id", { count: "exact", head: true }));
      const products   = await countExact(supabase.from("products").select("id", { count: "exact", head: true }));
      const unslotted  = await countExact(supabase.from("machines").select("id", { count: "exact", head: true }).is("slot_plan_ready", false));
      const lowRisk    = 0; // TODO: Add inventory table
      setCtx({ prospects, locations, machines, products, lowRisk, unslotted });
    })();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Workflow</h1>

      <WFSection
        icon={<MapPinned className="h-4 w-4" />}
        title="1) Pipeline → Location"
        items={[
          { label: `Prospects (${ctx?.prospects ?? "—"})`, to: "/prospects" },
          { label: `Locations (${ctx?.locations ?? "—"})`, to: "/locations" },
        ]}
        cta={{ label: "Open Prospects", to: "/prospects" }}
      />

      <WFSection
        icon={<Factory className="h-4 w-4" />}
        title="2) Machines → Setup → Slots"
        items={[
          { label: `Machines (${ctx?.machines ?? "—"})`, to: "/machines" },
          { label: `Unslotted Machines (${ctx?.unslotted ?? 0})`, to: "/slots" },
          { label: "Machine Setup", to: "/setup" },
          { label: "Slot Planner", to: "/slots" },
        ]}
        cta={{ label: "Go to Machines", to: "/machines" }}
      />

      <WFSection
        icon={<Package2 className="h-4 w-4" />}
        title="3) Products → Purchase Orders → Inventory → Picklist → Restock"
        items={[
          { label: `Products (${ctx?.products ?? "—"})`, to: "/products" },
          { label: "Create PO", to: "/purchase-orders/new" },
          { label: "Receive Inventory", to: "/inventory" },
          { label: `Low/Risk Items (${ctx?.lowRisk ?? 0})`, to: "/reports/inventory-risk" },
          { label: "Picklists", to: "/picklists" },
          { label: "Record Restock", to: "/restock" },
        ]}
        cta={{ label: "Build Picklist", to: "/picklists" }}
      />

      <WFSection
        icon={<DollarSign className="h-4 w-4" />}
        title="4) Sales & Finance"
        items={[
          { label: "Record/Import Sales", to: "/sales" },
          { label: "Processors & Fees", to: "/finance/processors" },
          { label: "Commissions", to: "/finance/commissions" },
          { label: "Taxes", to: "/finance/taxes" },
          { label: "Expenses", to: "/finance/expenses" },
          { label: "Loans", to: "/finance/loans" },
        ]}
        cta={{ label: "Open Sales", to: "/sales" }}
      />

      <WFSection
        icon={<BarChart3 className="h-4 w-4" />}
        title="5) Reports & Close"
        items={[
          { label: "Sales Summary (7d)", to: "/reports/sales-summary" },
          { label: "Silent Machines", to: "/reports/silent-machines" },
          { label: "Processor Reconciliation", to: "/reports/processor-recon" },
          { label: "Inventory Risk", to: "/reports/inventory-risk" },
        ]}
        cta={{ label: "Open Reports", to: "/reports" }}
      />
    </div>
  );
}

function WFSection(props: { icon: React.ReactNode; title: string; items: { to: string; label: string }[]; cta?: { to: string; label: string } }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-sm font-medium">{props.icon}{props.title}</div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {props.items.map((i) => (
          <Link key={i.to} to={i.to} className="rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-muted">
            {i.label} <span className="ml-2 text-xs text-muted-foreground">{i.to}</span>
          </Link>
        ))}
      </div>
      {props.cta && (
        <div className="mt-3">
          <Link to={props.cta.to} className="inline-block rounded-lg border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted">
            {props.cta.label}
          </Link>
        </div>
      )}
    </div>
  );
}

/** =========================================================================
 *  REPORT — Processor Reconciliation (sales vs settlements)
 *  Route: /reports/processor-recon
 *  
 *  TODO: This component requires a 'processor_settlements' table to be created.
 *  Uncomment and create the table with columns:
 *  - processor (text)
 *  - occurred_on (date) 
 *  - gross_cents (int)
 *  - fee_cents (int)
 *  - net_cents (int)
 *  =======================================================================*/

// Commented out until processor_settlements table is created
/*
export function ProcessorRecon() {
  // Implementation commented out - requires processor_settlements table
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-3">Processor Reconciliation</h1>
      <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        This report requires a <code>processor_settlements</code> table to be created first.
      </div>
    </div>
  );
}
*/

/** =========================================================================
 *  REPORT — Inventory Risk (below par)
 *  Route: /reports/inventory-risk
 *  
 *  TODO: This component requires an 'inventory' table to be created.
 *  Uncomment and create the table with columns:
 *  - id (uuid)
 *  - product_id (uuid)
 *  - on_hand (int)
 *  - par_level (int)
 *  =======================================================================*/

// Commented out until inventory table is created
/*
export function InventoryRisk() {
  // Implementation commented out - requires inventory table
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-3">Inventory Risk</h1>
      <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        This report requires an <code>inventory</code> table to be created first.
      </div>
    </div>
  );
}
*/

/** =========================================================================
 *  ROUTE MOUNTER — drop-in to mount all routes at once
 *  Usage in your routes file:
 *     import { FeatureRoutes } from "@/feature-pack/VendingWorkflowPack";
 *     <Routes>
 *       ...existing routes...
 *       <FeatureRoutes ProtectedRoute={ProtectedRoute}/>
 *     </Routes>
 *  =======================================================================*/
export function FeatureRoutes({ ProtectedRoute }: { ProtectedRoute?: React.ComponentType<{ children: React.ReactNode }> }) {
  const Wrap: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    ProtectedRoute ? <ProtectedRoute>{children}</ProtectedRoute> : <>{children}</>;
  return (
    <>
      <Route path="/workflow" element={<Wrap><Workflow /></Wrap>} />
      {/* TODO: Uncomment when processor_settlements and inventory tables are created */}
      {/* <Route path="/reports/processor-recon" element={<Wrap><ProcessorRecon /></Wrap>} /> */}
      {/* <Route path="/reports/inventory-risk" element={<Wrap><InventoryRisk /></Wrap>} /> */}
    </>
  );
}

/** =========================================================================
 *  SIDEBAR ITEMS — drop these under your Reports section
 *  Usage in Sidebar:
 *     import { FeatureSidebarItems } from "@/feature-pack/VendingWorkflowPack";
 *     <FeatureSidebarItems />
 *  =======================================================================*/
export function FeatureSidebarItems() {
  return (
    <>
      <Link to="/workflow" className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm hover:bg-muted">
        <ClipboardList className="h-4 w-4" /><span>Workflow</span>
      </Link>
      {/* TODO: Uncomment when processor_settlements and inventory tables are created */}
      {/* <Link to="/reports/processor-recon" className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm hover:bg-muted">
        <BarChart3 className="h-4 w-4" /><span>Processor Recon</span>
      </Link>
      <Link to="/reports/inventory-risk" className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm hover:bg-muted">
        <BarChart3 className="h-4 w-4" /><span>Inventory Risk</span>
      </Link> */}
    </>
  );
}

/** utils */
const num = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const fmt = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD" });
function fmtDate(v: string | null) {
  if (!v) return "—";
  const d = new Date(v); return isNaN(d.getTime()) ? "—" : d.toLocaleString();
}