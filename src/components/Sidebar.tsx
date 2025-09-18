import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Grouped nav configuration
type NavItem = { label: string; to: string };
type NavGroup = { key: string; label: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    key: "dashboards",
    label: "Dashboards",
    items: [
      { label: "Home", to: "/" },
      { label: "Enhanced Dashboard", to: "/enhanced-dashboard" },
      { label: "Sales Dashboard", to: "/sales/dashboard" },
      { label: "Prospect Dashboard", to: "/prospect-dashboard" },
      { label: "Location Performance", to: "/location-performance" },
      { label: "Driver Dashboard", to: "/driver" },
      { label: "Low Stock Alerts", to: "/alerts/low-stock" },
      { label: "Cash Flow", to: "/finance/cash-flow" },
    ],
  },
  {
    key: "sales",
    label: "Sales",
    items: [
      { label: "Prospects", to: "/prospects" },
      { label: "New Prospect", to: "/prospects/new" },
      { label: "Prospect Detail", to: "/prospect/:id" },
      { label: "Locations", to: "/locations" },
      { label: "New Location", to: "/locations/new" },
      { label: "Locations Enhanced", to: "/locations-enhanced" },
      { label: "Location Detail", to: "/location/:id" },
      { label: "Sales Entry", to: "/sales" },
    ],
  },
  {
    key: "ops",
    label: "Operations",
    items: [
      { label: "Machines", to: "/machines" },
      { label: "Machines Enhanced", to: "/machines-enhanced" },
      { label: "Machine Detail", to: "/machine/:id" },
      { label: "Machine Setup", to: "/machine-setup" },
      { label: "Machine Inventory", to: "/machines/:machineId/inventory" },
      { label: "Route Planning", to: "/routes" },
      { label: "Delivery Routes", to: "/delivery-routes" },
      { label: "Daily Ops", to: "/daily-ops" },
      { label: "Business Flow", to: "/business-flow" },
      { label: "Cash Collection", to: "/cash-collection" },
    ],
  },
  {
    key: "maintenance",
    label: "Maintenance",
    items: [
      { label: "Maintenance Scheduler", to: "/maintenance" },
      { label: "Machine Maintenance", to: "/machine-maintenance" },
      { label: "Maintenance Backlog", to: "/maintenance-backlog" },
      { label: "Machine Health", to: "/machine-health" },
    ],
  },
  {
    key: "inventory",
    label: "Inventory",
    items: [
      { label: "Inventory", to: "/inventory" },
      { label: "Predictive Inventory", to: "/predictive-inventory" },
      { label: "Restock Entry", to: "/restock-entry" },
      { label: "Inventory Reports", to: "/reports/inventory" },
    ],
  },
  {
    key: "catalog",
    label: "Catalog",
    items: [
      { label: "Products", to: "/products" },
      { label: "Products Enhanced", to: "/products-enhanced" },
      { label: "Suppliers", to: "/suppliers" },
      { label: "Suppliers Enhanced", to: "/suppliers-enhanced" },
      { label: "Supplier Management", to: "/supplier-management" },
    ],
  },
  {
    key: "purchasing",
    label: "Purchasing",
    items: [
      { label: "Purchase Orders", to: "/purchase-orders" },
      { label: "New Purchase Order", to: "/purchase-orders/new" },
    ],
  },
  {
    key: "financial",
    label: "Financial",
    items: [
      { label: "Finance Management", to: "/finance" },
      { label: "Commission Dashboard", to: "/commissions" },
      { label: "Commission Statements", to: "/commission-statements" },
      { label: "Cost Analysis", to: "/cost-analysis" },
      { label: "Product Margins", to: "/product-margins" },
      { label: "Profit Reports", to: "/profit-reports" },
      { label: "Machine Finance", to: "/machine-finance" },
      { label: "Machine ROI", to: "/machine-roi" },
      { label: "Payment Processors", to: "/payment-processors" },
      { label: "Cash Flow Report", to: "/finance/cash-flow" },
    ],
  },
  {
    key: "contracts",
    label: "Contracts",
    items: [
      { label: "Contract Management", to: "/contracts" },
      { label: "Contract View", to: "/contract/:id" },
      { label: "Insurance", to: "/insurance" },
    ],
  },
  {
    key: "analytics",
    label: "Analytics",
    items: [
      { label: "Reports", to: "/reports" },
      { label: "Enhanced Reports", to: "/enhanced-reports" },
      { label: "Customer Analytics", to: "/customer-analytics" },
      { label: "Pipeline Analytics", to: "/pipeline-analytics" },
      { label: "Staff Performance", to: "/analytics/staff" },
    ],
  },
  {
    key: "admin",
    label: "Admin",
    items: [
      { label: "Billing", to: "/admin/billing" },
      { label: "Settings", to: "/admin/settings" },
      { label: "Users", to: "/admin/users" },
      { label: "Staff", to: "/staff" },
      { label: "Staff Enhanced", to: "/staff-enhanced" },
    ],
  },
  {
    key: "tools",
    label: "Tools",
    items: [
      { label: "Exports", to: "/exports" },
      { label: "Audit", to: "/audit" },
      { label: "Deletion Logs", to: "/deletion-logs" },
      { label: "Health", to: "/health" },
      { label: "Help Center", to: "/help" },
      { label: "Glossary", to: "/help/glossary" },
      { label: "Help Article", to: "/help/:slug" },
      { label: "Changelog", to: "/changelog" },
      { label: "QA Launcher", to: "/qa-launcher" },
      { label: "Picklists", to: "/picklists" },
      { label: "Ops Console", to: "/ops/console" },
    ],
  },
  {
    key: "account",
    label: "Account & Legacy",
    items: [
      { label: "Account", to: "/account" },
      { label: "Auth", to: "/auth" },
      { label: "Leads (Legacy)", to: "/leads" },
    ],
  },
];

export default function Sidebar() {
  const nav = useNavigate();
  const loc = useLocation();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    dashboards: true,
    sales: true,
    ops: true
  });
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setEmail(session?.user?.email ?? null);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    nav("/auth");
  }

  return (
    <aside className="w-64 bg-sidebar border-r border-border h-screen overflow-y-auto">
      <div className="p-4 font-bold text-lg border-b border-border bg-accent/5">
        <div className="text-primary">Gotham Vending</div>
      </div>
      <nav className="p-2">
        {NAV.map((group) => (
          <div key={group.key} className="mb-2">
            <button
              className="w-full flex justify-between items-center px-2 py-2 text-xs font-semibold uppercase text-muted-foreground hover:text-primary transition-colors"
              onClick={() =>
                setExpanded((e) => ({ ...e, [group.key]: !e[group.key] }))
              }
            >
              {group.label}
              <span className="text-xs">{expanded[group.key] ? "▾" : "▸"}</span>
            </button>
            {expanded[group.key] && (
              <ul className="ml-2 space-y-1">
                {group.items.map((it) => (
                  <li key={it.to}>
                    <NavLink
                      to={it.to}
                      className={({ isActive }) =>
                        `block px-3 py-2 text-sm rounded-md transition-colors ${
                          isActive 
                            ? "bg-primary text-primary-foreground font-medium" 
                            : "text-sidebar-foreground hover:bg-accent hover:text-accent-foreground"
                        }`
                      }
                    >
                      {it.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </nav>
      <div className="p-4 border-t border-border text-sm bg-accent/5">
        {email ? (
          <>
            <div className="mb-2 truncate text-muted-foreground">{email}</div>
            <button
              onClick={signOut}
              className="w-full bg-primary text-primary-foreground rounded-md px-3 py-2 hover:bg-primary/90 transition-colors"
            >
              Sign out
            </button>
          </>
        ) : (
          <NavLink 
            to="/auth" 
            className="text-primary hover:text-primary/80 underline"
          >
            Sign in
          </NavLink>
        )}
      </div>
    </aside>
  );
}