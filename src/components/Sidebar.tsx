import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Boxes, PackagePlus, ShoppingCart, Settings, PanelLeftOpen, PanelLeftClose,
  Factory, MapPinned, Box, ListOrdered, LineChart, Receipt, ClipboardList, Shield
} from "lucide-react";

type Leaf = { label: string; to: string };
type Group = { id: string; label: string; icon: React.ReactNode; children: Leaf[] };

const NAV: Group[] = [
  {
    id: "sales",
    label: "Sales",
    icon: <LineChart className="w-4 h-4" />,
    children: [
      { label: "Dashboard", to: "/" },
      { label: "Reports", to: "/reports" },
      { label: "Inventory", to: "/inventory" },
      { label: "Cost Analysis", to: "/cost-analysis" },
      { label: "Audit", to: "/audit" },
    ]
  },
  {
    id: "operations",
    label: "Operations",
    icon: <ClipboardList className="w-4 h-4" />,
    children: [
      { label: "Prospects", to: "/prospects" },
      { label: "Locations", to: "/locations" },
      { label: "Machines", to: "/machines" },
      { label: "Setup", to: "/setup" },
      { label: "Slots", to: "/slots" },
      { label: "Restock", to: "/restock" },
      { label: "Sales Entry", to: "/sales" },
    ]
  },
  {
    id: "catalog",
    label: "Catalog",
    icon: <Boxes className="w-4 h-4" />,
    children: [
      { label: "Products", to: "/products" },
      { label: "Suppliers", to: "/suppliers" },
    ]
  },
  {
    id: "purchasing",
    label: "Purchasing",
    icon: <ShoppingCart className="w-4 h-4" />,
    children: [
      { label: "New PO", to: "/purchase-orders/new" },
      { label: "Purchase Orders", to: "/purchase-orders" },
    ]
  }
];

const STORAGE_KEY = "sidebar.openGroups";
const COLLAPSED_KEY = "sidebar.collapsed";

function usePersistentState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : initial;
  });
  useEffect(() => { localStorage.setItem(key, JSON.stringify(state)); }, [key, state]);
  return [state, setState] as const;
}

export default function Sidebar() {
  const location = useLocation();
  const [openGroups, setOpenGroups] = usePersistentState<Record<string, boolean>>(STORAGE_KEY, {});
  const [collapsed, setCollapsed] = usePersistentState<boolean>(COLLAPSED_KEY, false);

  // Auto-open group containing current route
  useEffect(() => {
    const active = NAV.find(g => g.children.some(c => location.pathname.startsWith(c.to.split("#")[0])));
    if (active && !openGroups[active.id]) {
      setOpenGroups(prev => ({ ...prev, [active.id]: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const toggleGroup = (id: string) =>
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));

  const cls = (...x: (string | false | null | undefined)[]) => x.filter(Boolean).join(" ");

  return (
    <aside className={cls(
      "h-screen border-r bg-background flex flex-col transition-all duration-200",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-3 border-b">
        <div className={cls("font-semibold text-sm truncate", collapsed && "opacity-0 pointer-events-none")}>
          Vending Ops
        </div>
        <button
          className="p-1 rounded hover:bg-muted"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {NAV.map(group => {
          const isOpen = !!openGroups[group.id];
          return (
            <div key={group.id}>
              <button
                className={cls(
                  "w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/50 text-left",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20"
                )}
                onClick={() => toggleGroup(group.id)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleGroup(group.id); } }}
                aria-expanded={isOpen}
              >
                <span className="shrink-0">{group.icon}</span>
                <span className={cls("text-sm font-medium", collapsed && "hidden")}>{group.label}</span>
                {!collapsed && (
                  <span className={cls("ml-auto text-xs text-muted-foreground", isOpen && "rotate-90", "transition-transform")}>›</span>
                )}
              </button>
              {/* Children */}
              <div
                className={cls(
                  "overflow-hidden transition-[max-height] duration-200",
                  collapsed ? "max-h-0" : isOpen ? "max-h-96" : "max-h-0"
                )}
              >
                {!collapsed && (
                  <ul className="pl-8 pr-2 pb-2 space-y-1">
                    {group.children.map(item => (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          className={({ isActive }) => cls(
                            "block px-2 py-1 rounded text-sm",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground hover:bg-muted/50"
                          )}
                        >
                          {item.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer quick-links (optional) */}
      <div className="border-t p-2">
        {!collapsed && (
          <div className="text-[11px] text-muted-foreground px-1">© {new Date().getFullYear()} Vending</div>
        )}
      </div>
    </aside>
  );
}