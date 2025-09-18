import { 
  Home, 
  Users, 
  MapPin, 
  Cog, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  UserCircle, 
  LogOut,
  Plus,
  FileText,
  Receipt,
  Route,
  Truck,
  Wrench,
  DollarSign,
  Shield,
  Settings,
  TrendingUp,
  Calendar,
  Warehouse,
  AlertTriangle,
  HelpCircle,
  Activity,
  Building,
  ClipboardList,
  Target,
  PieChart,
  Zap,
  Database,
  Clock,
  CheckSquare,
  ArrowUpDown,
  Calculator,
  CreditCard,
  Briefcase,
  Download,
  Search,
  Bell,
  Heart,
  Book,
  Info,
  Monitor
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const dashboardItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Enhanced Dashboard", url: "/enhanced-dashboard", icon: TrendingUp },
  { title: "Home Dashboard", url: "/home-dashboard", icon: Building },
];

const salesItems = [
  { title: "Prospects", url: "/prospects", icon: Users },
  { title: "Prospect Dashboard", url: "/prospect-dashboard", icon: Target },
  { title: "Locations", url: "/locations", icon: MapPin },
  { title: "Locations Enhanced", url: "/locations-enhanced", icon: Building },
  { title: "Location Performance", url: "/location-performance", icon: TrendingUp },
  { title: "Sales Entry", url: "/sales", icon: Receipt },
  { title: "Sales Dashboard", url: "/sales/dashboard", icon: BarChart3 },
];

const operationsItems = [
  { title: "Machines", url: "/machines", icon: Cog },
  { title: "Machines Enhanced", url: "/machines-enhanced", icon: Settings },
  { title: "Machine Setup", url: "/machine-setup", icon: Wrench },
  { title: "Machine Health", url: "/machine-health", icon: Activity },
  { title: "Route Planning", url: "/routes", icon: Route },
  { title: "Delivery Routes", url: "/delivery-routes", icon: Truck },
  { title: "Driver Dashboard", url: "/driver", icon: Truck },
  { title: "Daily Ops", url: "/daily-ops", icon: Calendar },
  { title: "Business Flow", url: "/business-flow", icon: ArrowUpDown },
  { title: "Cash Collection", url: "/cash-collection", icon: DollarSign },
];

const maintenanceItems = [
  { title: "Maintenance Scheduler", url: "/maintenance", icon: Calendar },
  { title: "Machine Maintenance", url: "/machine-maintenance", icon: Wrench },
  { title: "Maintenance Backlog", url: "/maintenance-backlog", icon: ClipboardList },
];

const inventoryItems = [
  { title: "Inventory", url: "/inventory", icon: Warehouse },
  { title: "Predictive Inventory", url: "/predictive-inventory", icon: TrendingUp },
  { title: "Restock Entry", url: "/restock-entry", icon: Package },
];

const catalogItems = [
  { title: "Products", url: "/products", icon: Package },
  { title: "Products Enhanced", url: "/products-enhanced", icon: Zap },
  { title: "Suppliers", url: "/suppliers", icon: Users },
  { title: "Suppliers Enhanced", url: "/suppliers-enhanced", icon: Building },
  { title: "Supplier Management", url: "/supplier-management", icon: Truck },
];

const purchasingItems = [
  { title: "Purchase Orders", url: "/purchase-orders", icon: ShoppingCart },
];

const financialItems = [
  { title: "Finance Management", url: "/finance", icon: DollarSign },
  { title: "Commission Dashboard", url: "/commissions", icon: TrendingUp },
  { title: "Commission Statements", url: "/commission-statements", icon: Receipt },
  { title: "Cost Analysis", url: "/cost-analysis", icon: Calculator },
  { title: "Product Margins", url: "/product-margins", icon: PieChart },
  { title: "Profit Reports", url: "/profit-reports", icon: TrendingUp },
  { title: "Machine Finance", url: "/machine-finance", icon: DollarSign },
  { title: "Machine ROI", url: "/machine-roi", icon: Calculator },
  { title: "Payment Processors", url: "/payment-processors", icon: CreditCard },
];

const contractsItems = [
  { title: "Contract Management", url: "/contracts", icon: FileText },
  { title: "Insurance", url: "/insurance", icon: Shield },
];

const analyticsItems = [
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Enhanced Reports", url: "/enhanced-reports", icon: TrendingUp },
  { title: "Customer Analytics", url: "/customer-analytics", icon: Users },
  { title: "Pipeline Analytics", url: "/pipeline-analytics", icon: Target },
];

const adminItems = [
  { title: "Admin Billing", url: "/admin/billing", icon: CreditCard },
  { title: "Admin Settings", url: "/admin/settings", icon: Settings },
  { title: "Admin Users", url: "/admin/users", icon: Users },
  { title: "Staff", url: "/staff", icon: Users },
  { title: "Staff Enhanced", url: "/staff-enhanced", icon: Users },
];

const toolsItems = [
  { title: "Exports", url: "/exports", icon: Download },
  { title: "Audit", url: "/audit", icon: Search },
  { title: "Deletion Logs", url: "/deletion-logs", icon: AlertTriangle },
  { title: "Health", url: "/health", icon: Activity },
  { title: "Help Center", url: "/help", icon: HelpCircle },
  { title: "Changelog", url: "/changelog", icon: FileText },
  { title: "QA Launcher", url: "/qa-launcher", icon: CheckSquare },
  { title: "Picklists", url: "/picklists", icon: ClipboardList },
  { title: "Ops Console", url: "/ops/console", icon: Monitor },
];

const quickCreateItems = [
  { title: "New Prospect", url: "/prospects/new", icon: Plus },
  { title: "New Location", url: "/locations/new", icon: Plus },
  { title: "New Machine", url: "/machines/new", icon: Plus },
  { title: "New Product", url: "/products/new", icon: Plus },
  { title: "New Supplier", url: "/suppliers/new", icon: Plus },
  { title: "New PO", url: "/purchase-orders/new", icon: Plus },
];

export function AppSidebar() {
  const location = useLocation();
  
  const isActive = (url: string) => {
    if (url === "/") return location.pathname === "/";
    return location.pathname.startsWith(url);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Package className="h-4 w-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Gotham Vending</span>
            <span className="truncate text-xs text-muted-foreground">Management System</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Dashboards */}
        <SidebarGroup>
          <SidebarGroupLabel>Dashboards</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {dashboardItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Sales */}
        <SidebarGroup>
          <SidebarGroupLabel>Sales</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {salesItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Operations */}
        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {operationsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Maintenance */}
        <SidebarGroup>
          <SidebarGroupLabel>Maintenance</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {maintenanceItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Inventory */}
        <SidebarGroup>
          <SidebarGroupLabel>Inventory</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {inventoryItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Catalog */}
        <SidebarGroup>
          <SidebarGroupLabel>Catalog</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {catalogItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Purchasing */}
        <SidebarGroup>
          <SidebarGroupLabel>Purchasing</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {purchasingItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Financial */}
        <SidebarGroup>
          <SidebarGroupLabel>Financial</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {financialItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Contracts */}
        <SidebarGroup>
          <SidebarGroupLabel>Contracts</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {contractsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Analytics */}
        <SidebarGroup>
          <SidebarGroupLabel>Analytics</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {analyticsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin */}
        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Tools */}
        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Create */}
        <SidebarGroup>
          <SidebarGroupLabel>Quick Create</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {quickCreateItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild size="sm">
                    <Link to={item.url}>
                      <item.icon className="h-3 w-3" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/account">
                <UserCircle className="h-4 w-4" />
                <span>Account</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}