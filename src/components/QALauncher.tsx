import { Link } from "react-router-dom";

const items = [
  { to: "/", label: "Dashboard" },

  // Pipeline
  { to: "/prospects", label: "Prospects" },
  { to: "/locations", label: "Locations" },

  // Machines
  { to: "/machines", label: "Machines" },
  { to: "/setup", label: "Machine Setup" },
  { to: "/slots", label: "Slot Planner" },
  { to: "/machines/finance", label: "Machine Finance" },
  { to: "/machines/maintenance", label: "Machine Maintenance" },

  // Supply & Stock
  { to: "/products", label: "Products" },
  { to: "/suppliers", label: "Suppliers" },
  { to: "/purchase-orders", label: "Purchase Orders" },
  { to: "/purchase-orders/new", label: "New Purchase Order" },
  { to: "/inventory", label: "Inventory" },
  { to: "/restock", label: "Restock" },
  { to: "/picklists", label: "Picklists" },

  // Sales & Finance
  { to: "/sales", label: "Sales Entry" },
  { to: "/cost-analysis", label: "Cost Analysis" },
  { to: "/reports", label: "Profit Reports" },
  { to: "/finance/processors", label: "Payment Processors" },
  { to: "/finance/commissions", label: "Commissions" },
  { to: "/finance/taxes", label: "Taxes" },
  { to: "/finance/expenses", label: "Expenses" },
  { to: "/finance/loans", label: "Loans" },

  // Logistics & Support
  { to: "/delivery-routes", label: "Delivery Routes" },
  { to: "/tickets", label: "Tickets" },
  { to: "/staff", label: "Staff" },

  // Oversight & Admin
  { to: "/audit", label: "Audit" },
  { to: "/deletion-logs", label: "Deletion Logs" },
  { to: "/account", label: "Account" },

  // Help (if enabled)
  { to: "/help", label: "Help Center" },
  { to: "/reports/help", label: "Help Reports" },
  { to: "/help/backlog", label: "Help Backlog" },

  // Utilities
  { to: "/debug", label: "Debug" },
];

export default function QALauncher() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold mb-3">QA Launcher</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Click each route below. With HashRouter enabled, refreshes on these pages should work.
      </p>
      <div className="grid sm:grid-cols-2 gap-2">
        {items.map((i) => (
          <Link
            key={i.to}
            to={i.to}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-muted transition-colors"
          >
            {i.label}
            <span className="ml-2 text-muted-foreground text-xs">{i.to}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}