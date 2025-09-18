import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  Wrench,
  Shield,
  Calendar,
  Activity,
  FileBarChart,
  Store,
  ShoppingCart,
  PieChart,
  CreditCard,
  FileText as FileIcon,
  Download,
  Search,
  HelpCircle,
  User,
  Lock,
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
type NavItem = { label: string; to: string; icon: React.ComponentType<any> };
type NavGroup = { key: string; label: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    key: "dashboards",
    label: "Dashboards",
    items: [
      { label: "Business Overview", to: "/", icon: Home },
      { label: "Mission Control", to: "/enhanced-dashboard", icon: Activity },
      { label: "Sales Dashboard", to: "/sales/dashboard", icon: TrendingUp },
      { label: "Driver Dashboard", to: "/driver", icon: Truck },
      { label: "Low Stock Alerts", to: "/alerts/low-stock", icon: AlertTriangle },
    ],
  },
  {
    key: "sales",
    label: "Sales & Prospects",
    items: [
      { label: "Prospects", to: "/prospects", icon: Users },
      { label: "Prospect Dashboard", to: "/prospect-dashboard", icon: BarChart3 },
      { label: "New Prospect", to: "/prospects/new", icon: UserCheck },
      { label: "Sales Entry", to: "/sales", icon: DollarSign },
    ],
  },
  {
    key: "locations",
    label: "Locations & Performance", 
    items: [
      { label: "Locations", to: "/locations", icon: MapPin },
      { label: "New Location", to: "/locations/new", icon: Building2 },
      { label: "Locations Enhanced", to: "/locations-enhanced", icon: Building2 },
      { label: "Location Performance", to: "/location-performance", icon: TrendingUp },
      { label: "Cash Flow Reports", to: "/finance/cash-flow", icon: DollarSign },
    ],
  },
  {
    key: "ops",
    label: "Operations",
    items: [
      { label: "Machines", to: "/machines", icon: Cog },
      { label: "Machines Enhanced", to: "/machines-enhanced", icon: Cog },
      { label: "Machine Setup", to: "/machine-setup", icon: Settings },
      { label: "Route Planning", to: "/routes", icon: MapPin },
      { label: "Delivery Routes", to: "/delivery-routes", icon: Truck },
      { label: "Daily Ops", to: "/daily-ops", icon: ClipboardList },
      { label: "Business Flow", to: "/business-flow", icon: Activity },
      { label: "Cash Collection", to: "/cash-collection", icon: DollarSign },
    ],
  },
  {
    key: "maintenance",
    label: "Maintenance",
    items: [
      { label: "Maintenance Scheduler", to: "/maintenance", icon: Calendar },
      { label: "Machine Maintenance", to: "/machine-maintenance", icon: Wrench },
      { label: "Maintenance Backlog", to: "/maintenance-backlog", icon: ClipboardList },
      { label: "Machine Health", to: "/machine-health", icon: Activity },
    ],
  },
  {
    key: "inventory",
    label: "Inventory",
    items: [
      { label: "Inventory", to: "/inventory", icon: Package },
      { label: "Predictive Inventory", to: "/predictive-inventory", icon: TrendingUp },
      { label: "Restock Entry", to: "/restock-entry", icon: ClipboardList },
      { label: "Inventory Reports", to: "/reports/inventory", icon: FileBarChart },
    ],
  },
  {
    key: "catalog",
    label: "Catalog",
    items: [
      { label: "Products", to: "/products", icon: Package },
      { label: "Products Enhanced", to: "/products-enhanced", icon: Package },
      { label: "Suppliers", to: "/suppliers", icon: Store },
      { label: "Suppliers Enhanced", to: "/suppliers-enhanced", icon: Store },
      { label: "Supplier Management", to: "/supplier-management", icon: Building2 },
    ],
  },
  {
    key: "purchasing",
    label: "Purchasing",
    items: [
      { label: "Purchase Orders", to: "/purchase-orders", icon: ShoppingCart },
      { label: "New Purchase Order", to: "/purchase-orders/new", icon: ShoppingCart },
    ],
  },
  {
    key: "financial",
    label: "Financial",
    items: [
      { label: "Finance Management", to: "/finance", icon: DollarSign },
      { label: "Commission Dashboard", to: "/commissions", icon: PieChart },
      { label: "Commission Statements", to: "/commission-statements", icon: FileIcon },
      { label: "Cost Analysis", to: "/cost-analysis", icon: BarChart3 },
      { label: "Product Margins", to: "/product-margins", icon: TrendingUp },
      { label: "Profit Reports", to: "/profit-reports", icon: FileBarChart },
      { label: "Machine Finance", to: "/machine-finance", icon: CreditCard },
      { label: "Machine ROI", to: "/machine-roi", icon: TrendingUp },
      { label: "Payment Processors", to: "/payment-processors", icon: CreditCard },
      { label: "Cash Flow Report", to: "/finance/cash-flow", icon: DollarSign },
    ],
  },
  {
    key: "contracts",
    label: "Contracts",
    items: [
      { label: "Contract Management", to: "/contracts", icon: FileIcon },
      { label: "Insurance", to: "/insurance", icon: Shield },
    ],
  },
  {
    key: "analytics",
    label: "Analytics",
    items: [
      { label: "Reports", to: "/reports", icon: FileBarChart },
      { label: "Enhanced Reports", to: "/enhanced-reports", icon: BarChart3 },
      { label: "Customer Analytics", to: "/customer-analytics", icon: Users },
      { label: "Pipeline Analytics", to: "/pipeline-analytics", icon: TrendingUp },
      { label: "Staff Performance", to: "/analytics/staff", icon: Users },
    ],
  },
  {
    key: "admin",
    label: "Admin",
    items: [
      { label: "Billing", to: "/admin/billing", icon: CreditCard },
      { label: "Settings", to: "/admin/settings", icon: Settings },
      { label: "Users", to: "/admin/users", icon: Users },
      { label: "Staff", to: "/staff", icon: Users },
      { label: "Staff Enhanced", to: "/staff-enhanced", icon: Users },
    ],
  },
  {
    key: "tools",
    label: "Tools",
    items: [
      { label: "Exports", to: "/exports", icon: Download },
      { label: "Audit", to: "/audit", icon: Search },
      { label: "Deletion Logs", to: "/deletion-logs", icon: FileIcon },
      { label: "Health", to: "/health", icon: Activity },
      { label: "Help Center", to: "/help", icon: HelpCircle },
      { label: "Glossary", to: "/help/glossary", icon: FileIcon },
      { label: "Changelog", to: "/changelog", icon: FileIcon },
      { label: "QA Launcher", to: "/qa-launcher", icon: Settings },
      { label: "Picklists", to: "/picklists", icon: ClipboardList },
      { label: "Ops Console", to: "/ops/console", icon: Settings },
    ],
  },
  {
    key: "account",
    label: "Account & Legacy",
    items: [
      { label: "Account", to: "/account", icon: User },
      { label: "Auth", to: "/auth", icon: Lock },
      { label: "Leads (Legacy)", to: "/leads", icon: Users },
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
                                <div className="flex items-center gap-3">
                                  <item.icon className="h-4 w-4" />
                                  <span>{item.label}</span>
                                </div>
                              )}
                              {state === "collapsed" && (
                                <item.icon className="h-4 w-4" />
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