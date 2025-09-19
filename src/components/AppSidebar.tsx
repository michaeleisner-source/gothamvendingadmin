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
      { label: "Sales Dashboard", to: "/sales-dashboard", icon: TrendingUp },
      { label: "Low Stock Alerts", to: "/alerts/low-stock", icon: AlertTriangle },
    ],
  },
  {
    key: "sales",
    label: "Sales & Prospects", 
    items: [
      { label: "Prospects", to: "/prospects", icon: Users },
      { label: "Leads (Legacy)", to: "/leads", icon: UserCheck },
      { label: "Sales Entry", to: "/sales", icon: DollarSign },
      { label: "Pipeline Analytics", to: "/pipeline-analytics", icon: BarChart3 },
    ],
  },
  {
    key: "ops",
    label: "Operations",
    items: [
      { label: "Locations", to: "/locations", icon: MapPin },
      { label: "Machines", to: "/machines", icon: Cog },
      { label: "Products", to: "/products", icon: Package },
      { label: "Inventory", to: "/inventory", icon: Package },
      { label: "Routes & Delivery", to: "/routes", icon: Truck },
      { label: "Maintenance", to: "/maintenance", icon: Wrench },
      { label: "Daily Ops", to: "/daily-ops", icon: ClipboardList },
    ],
  },
  {
    key: "finance",
    label: "Finance & Purchasing",
    items: [
      { label: "Finance Management", to: "/finance", icon: DollarSign },
      { label: "Purchase Orders", to: "/purchase-orders", icon: ShoppingCart },
      { label: "Commission Dashboard", to: "/commissions", icon: PieChart },
      { label: "Cost Analysis", to: "/cost-analysis", icon: BarChart3 },
      { label: "Cash Collection", to: "/cash-collection", icon: CreditCard },
    ],
  },
  {
    key: "reports",
    label: "Reports & Analytics",
    items: [
      { label: "Reports Hub", to: "/reports", icon: BarChart3 },
      { label: "Enhanced Analytics", to: "/enhanced-reports", icon: TrendingUp },
      { label: "Customer Analytics", to: "/customer-analytics", icon: Users },
      { label: "Data Exports", to: "/exports", icon: Download },
    ],
  },
  {
    key: "management",
    label: "Management",
    items: [
      { label: "Suppliers", to: "/suppliers", icon: Store },
      { label: "Staff", to: "/staff", icon: Users },
      { label: "Contracts & Insurance", to: "/contracts", icon: FileText },
      { label: "Business Flow", to: "/business-flow", icon: Activity },
      { label: "New Location Workflow", to: "/workflows/new-location", icon: MapPin },
    ],
  },
  {
    key: "admin",
    label: "Admin",
    items: [
      { label: "Settings", to: "/admin/settings", icon: Settings },
      { label: "Users & Roles", to: "/admin/users", icon: Users },
      { label: "Billing", to: "/admin/billing", icon: CreditCard },
      { label: "Health & Audit", to: "/health", icon: Activity },
    ],
  },
  {
    key: "help",
    label: "Help & Tools",
    items: [
      { label: "Help Center", to: "/help", icon: HelpCircle },
      { label: "Glossary", to: "/help/glossary", icon: FileText },
      { label: "What's New", to: "/changelog", icon: FileText },
      { label: "Document Processing", to: "/document-processing", icon: FileText },
      { label: "QA Launcher", to: "/qa-launcher", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    dashboards: true,
    sales: true,
    ops: true,
    reports: true
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
                    className={({ isActive }) => getNavCls(isActive)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {state !== "collapsed" && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </div>
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