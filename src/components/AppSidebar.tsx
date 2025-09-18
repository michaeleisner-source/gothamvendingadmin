import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLowStockCount } from "@/hooks/useLowStockCount";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  Users,
  MapPin,
  Package,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Truck,
  DollarSign,
  ClipboardList,
  Building2,
  Cog,
  UserCheck,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

// Comprehensive navigation structure
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
      { label: "Locations", to: "/locations" },
      { label: "New Location", to: "/locations/new" },
      { label: "Locations Enhanced", to: "/locations-enhanced" },
      { label: "Sales Entry", to: "/sales" },
    ],
  },
  {
    key: "ops",
    label: "Operations",
    items: [
      { label: "Machines", to: "/machines" },
      { label: "Machines Enhanced", to: "/machines-enhanced" },
      { label: "Machine Setup", to: "/machine-setup" },
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

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    dashboards: true,
    sales: true,
    ops: true
  });
  const [email, setEmail] = useState<string | null>(null);
  const { lowCount } = useLowStockCount();

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

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const getNavCls = (active: boolean) =>
    active 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
      : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground";

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 font-bold text-lg border-b border-border bg-accent/5">
          <div className="text-primary">Gotham Vending</div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {NAV.map((group) => {
            return (
              <SidebarGroup key={group.key}>
                <button
                  className="w-full flex justify-between items-center px-2 py-2 text-xs font-semibold uppercase text-muted-foreground hover:text-primary transition-colors"
                  onClick={() =>
                    setExpanded((e) => ({ ...e, [group.key]: !e[group.key] }))
                  }
                >
                  {state !== "collapsed" && group.label}
                  {state !== "collapsed" && (
                    <span className="text-xs">{expanded[group.key] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}</span>
                  )}
                </button>
                {expanded[group.key] && (
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => (
                        <SidebarMenuItem key={item.to}>
                          <SidebarMenuButton asChild>
                            <NavLink 
                              to={item.to} 
                              className={getNavCls(isActive(item.to))}
                            >
                              {state !== "collapsed" && (
                                <div className="flex items-center justify-between w-full">
                                  <span>{item.label}</span>
                                  {(item.to === "/inventory" || item.to.includes("low-stock")) && lowCount > 0 && (
                                    <Badge variant="destructive" className="ml-2 text-xs">
                                      {lowCount}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                )}
              </SidebarGroup>
            );
          })}
        </div>

        <div className="p-4 border-t border-border text-sm bg-accent/5">
          {email ? (
            <>
              {state !== "collapsed" && (
                <div className="mb-2 truncate text-muted-foreground">{email}</div>
              )}
              <button
                onClick={signOut}
                className="w-full bg-primary text-primary-foreground rounded-md px-3 py-2 hover:bg-primary/90 transition-colors"
              >
                {state !== "collapsed" ? "Sign out" : "↪"}
              </button>
            </>
          ) : (
            <NavLink 
              to="/auth" 
              className="text-primary hover:text-primary/80 underline"
            >
              {state !== "collapsed" ? "Sign in" : "→"}
            </NavLink>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}