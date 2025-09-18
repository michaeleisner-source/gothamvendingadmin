import { NavLink, useLocation } from "react-router-dom";
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

const navigationGroups = [
  {
    title: "Dashboard",
    items: [
      { title: "Overview", url: "/", icon: Home },
    ],
  },
  {
    title: "Operations",
    items: [
      { title: "Machines", url: "/machines", icon: Cog },
      { title: "Locations", url: "/locations", icon: MapPin },
      { title: "Inventory", url: "/inventory", icon: Package },
      { title: "Routes", url: "/routes", icon: Truck },
    ],
  },
  {
    title: "Sales & Leads",
    items: [
      { title: "Leads", url: "/leads", icon: UserCheck },
      { title: "Cash Collection", url: "/cash-collection", icon: DollarSign },
    ],
  },
  {
    title: "Reports & Analytics",
    items: [
      { title: "Cash Flow", url: "/finance/cash-flow", icon: TrendingUp },
      { title: "Staff Performance", url: "/analytics/staff", icon: Users },
      { title: "Inventory Reports", url: "/reports/inventory", icon: BarChart3 },
    ],
  },
  {
    title: "Alerts",
    items: [
      { title: "Low Stock", url: "/alerts/low-stock", icon: AlertTriangle },
    ],
  },
  {
    title: "Management",
    items: [
      { title: "Suppliers", url: "/suppliers", icon: Building2 },
      { title: "Purchase Orders", url: "/purchase-orders", icon: ClipboardList },
      { title: "Contracts", url: "/contracts", icon: FileText },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === "/" && currentPath === "/") return true;
    if (path !== "/" && currentPath.startsWith(path)) return true;
    return false;
  };

  const getNavCls = (active: boolean) =>
    active 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
      : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {navigationGroups.map((group) => {
          const hasActiveItem = group.items.some(item => isActive(item.url));
          
          return (
            <SidebarGroup key={group.title}>
              <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={item.url} 
                          end={item.url === "/"} 
                          className={getNavCls(isActive(item.url))}
                        >
                          <item.icon className="h-4 w-4" />
                          {state !== "collapsed" && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}