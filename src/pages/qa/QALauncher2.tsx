import React from "react";
import { Link } from "react-router-dom";
import {
  Gauge, FileText, MapPin, Factory, Package,
  DollarSign, Scale, Wrench, HelpCircle, Building2,
  Receipt, Landmark, CreditCard, ShieldCheck, Truck, BarChart3
} from "lucide-react";

type Item = { to: string; label: string; icon: React.ReactNode; note?: string; };
const mk = (to:string, label:string, icon:React.ReactNode, note?:string): Item => ({ to, label, icon, note });

const sections: { title: string; items: Item[] }[] = [
  {
    title: "Dashboard",
    items: [ mk("/", "Home Dashboard", <Gauge className="h-4 w-4" />) ]
  },
  {
    title: "Pipeline",
    items: [
      mk("/prospects", "Prospects (Kanban)", <FileText className="h-4 w-4" />),
      mk("/locations", "Locations (Sites & Contracts)", <MapPin className="h-4 w-4" />),
      mk("/prospects/convert", "Convert Prospect → Location", <Receipt className="h-4 w-4" />, "expects ?prospect=<id>")
    ]
  },
  {
    title: "Machines",
    items: [
      mk("/machines", "Machines", <Factory className="h-4 w-4" />),
      mk("/machines/maintenance", "Machine Maintenance", <Wrench className="h-4 w-4" />),
    ]
  },
  {
    title: "Supply & Stock",
    items: [
      mk("/products", "Products", <Package className="h-4 w-4" />),
      mk("/suppliers", "Suppliers", <Building2 className="h-4 w-4" />),
      mk("/purchase-orders", "Purchase Orders", <Receipt className="h-4 w-4" />),
      mk("/inventory", "Inventory", <Package className="h-4 w-4" />)
    ]
  },
  {
    title: "Sales & Finance",
    items: [
      mk("/sales", "Sales Entry", <DollarSign className="h-4 w-4" />),
      mk("/reports/machine-roi", "Machine ROI", <Scale className="h-4 w-4" />),
      mk("/finance/loans", "Loans/Finance", <Landmark className="h-4 w-4" />),
      mk("/finance/processors", "Payment Processors", <CreditCard className="h-4 w-4" />),
      mk("/reports/processor-reconciliation", "Processor Reconciliation", <BarChart3 className="h-4 w-4" />),
      mk("/reports/product-profitability", "Product Profitability", <BarChart3 className="h-4 w-4" />),
      mk("/finance/insurance", "Insurance Policies", <ShieldCheck className="h-4 w-4" />)
    ]
  },
  {
    title: "Logistics & Support",
    items: [
      mk("/delivery-routes", "Delivery Routes", <Truck className="h-4 w-4" />),
      mk("/tickets", "Tickets", <Wrench className="h-4 w-4" />),
    ]
  },
  {
    title: "Help",
    items: [
      mk("/help", "Help Center", <HelpCircle className="h-4 w-4" />),
      mk("/ops/console", "Ops Console (Health)", <Scale className="h-4 w-4" />),
    ]
  }
];

export default function QALauncher2() {
  return (
    <div className="p-6 space-y-5">
      <div className="text-xl font-semibold">QA Launcher — Pages & Flow</div>
      {sections.map((s, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm font-medium mb-2">{s.title}</div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
            {s.items.map((it, j) => (
              <Link key={j} to={it.to} className="rounded-lg border border-border bg-background px-3 py-2 hover:bg-muted inline-flex items-center gap-2">
                {it.icon}
                <span>{it.label}</span>
                {it.note && <span className="ml-auto text-xs text-muted-foreground">{it.note}</span>}
              </Link>
            ))}
          </div>
        </div>
      ))}
      <div className="text-xs text-muted-foreground">
        If any link 404s or opens a blank page, that route/component is missing or protected. Use <Link className="underline" to="/ops/console">Ops Console</Link> to see schema/RLS issues that may block data.
      </div>
    </div>
  );
}