import { Link, useLocation, useParams } from "react-router-dom";

const LABELS: Record<string, string> = {
  "prospects": "Prospects",
  "locations": "Locations",
  "machines": "Machines",
  "products": "Products",
  "suppliers": "Suppliers",
  "purchase-orders": "Purchase Orders",
  "dashboard": "Dashboard",
  "reports": "Reports",
  "account": "Account",
  "inventory": "Inventory",
  "restock": "Restock",
  "sales": "Sales Entry",
  "setup": "Machine Setup",
  "slots": "Slot Planner",
  "cost-analysis": "Cost Analysis",
  "audit": "Audit",
  "delivery-routes": "Delivery Routes",
  "picklists": "Picklists",
  "tickets": "Tickets",
  "deletion-logs": "Deletion Logs",
  "new": "New",
};

export default function Breadcrumbs() {
  const { pathname } = useLocation();
  const params = useParams();

  // Break path into segments: /machines/123 -> ["machines", "123"]
  const parts = pathname.replace(/^\/+/, "").split("/").filter(Boolean);

  if (parts.length === 0) return null;

  const crumbs = parts.map((part, idx) => {
    const href = "/" + parts.slice(0, idx + 1).join("/");
    const isLast = idx === parts.length - 1;
    const label =
      LABELS[part] ||
      (params?.id && part === params.id ? "Detail" : decodeURIComponent(part));

    return (
      <span key={href} className="flex items-center gap-2">
        {idx > 0 && <span className="text-muted-foreground">/</span>}
        {isLast ? (
          <span className="text-foreground">{label}</span>
        ) : (
          <Link to={href} className="text-primary hover:underline">
            {label}
          </Link>
        )}
      </span>
    );
  });

  return (
    <div className="w-full bg-muted/30 border-b">
      <div className="max-w-6xl mx-auto px-4 py-2 text-sm text-muted-foreground flex flex-wrap">
        {crumbs}
      </div>
    </div>
  );
}