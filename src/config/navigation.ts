import {
  LayoutDashboard, MapPinned, Factory, Package2, DollarSign, 
  BarChart3, Headphones, Building2, Settings, 
  Box, Wrench, TrendingUp, Smartphone, Play, Route, FileText, Receipt, Scale, ListChecks, HelpCircle, ClipboardList
} from "lucide-react";

export interface NavItem {
  label: string;
  path: string;
  icon?: any;
  devOnly?: boolean;
}

export interface NavSection {
  title: string;
  icon?: any;
  devOnly?: boolean;
  items: NavItem[];
  expandable?: boolean;
}

// Single source of truth for all navigation
export const NAVIGATION_CONFIG: NavSection[] = [
  {
    title: "Dashboard",
    expandable: false,
    items: [
      { label: "Mission Control", path: "/", icon: LayoutDashboard }
    ]
  },
  {
    title: "Pipeline", 
    icon: MapPinned,
    expandable: true,
    items: [
      { label: "All Prospects", path: "/prospects" },
      { label: "New Prospect", path: "/prospects/new" },
      { label: "Convert → Contract", path: "/prospects/convert" },
      { label: "Contract Management", path: "/contracts" }
    ]
  },
  {
    title: "Business Flow",
    expandable: false, 
    items: [
      { label: "Business Flow", path: "/business-flow", icon: Building2 }
    ]
  },
  {
    title: "Operations",
    icon: Factory,
    expandable: true,
    items: [
      { label: "Machines", path: "/machines" },
      { label: "Inventory", path: "/inventory" },
      { label: "Locations", path: "/locations" },
      { label: "New Location", path: "/locations/new" },
      { label: "Machine Setup", path: "/setup" },
      { label: "Slot Planner", path: "/slots" }
    ]
  },
  {
    title: "Supply Chain",
    icon: Package2,
    expandable: true,
    items: [
      { label: "Products", path: "/products" },
      { label: "Purchase Orders", path: "/purchase-orders" },
      { label: "Suppliers", path: "/suppliers" }
    ]
  },
  {
    title: "Finance", 
    icon: DollarSign,
    expandable: true,
    items: [
      { label: "Overview", path: "/finance" },
      { label: "Commissions", path: "/finance/commissions" },
      { label: "Payment Processors", path: "/finance/processors" },
      { label: "Product Profitability", path: "/finance/profitability" }
    ]
  },
  {
    title: "Reports",
    icon: BarChart3,
    expandable: true, 
    items: [
      { label: "All Reports", path: "/reports" },
      { label: "Sales Summary", path: "/reports/sales-summary" },
      { label: "Machine ROI", path: "/reports/machine-roi" },
      { label: "Location Performance", path: "/reports/location-performance" },
      { label: "Location Commissions", path: "/reports/location-commissions" },
      { label: "Product Profitability", path: "/reports/product-profitability-net" },
      { label: "Prospect Funnel", path: "/reports/prospect-funnel" },
      { label: "Route Efficiency", path: "/reports/route-efficiency" },
      { label: "Inventory Health", path: "/reports/inventory-health" },
      { label: "Processor Reconciliation", path: "/reports/processor-reconciliation", icon: Scale }
    ]
  },
  {
    title: "Support",
    icon: Headphones,
    expandable: true,
    items: [
      { label: "Tickets", path: "/tickets" },
      { label: "Delivery Routes", path: "/delivery-routes" },
      { label: "Staff", path: "/staff" },
      { label: "Audit Logs", path: "/audit" }
    ]
  },
  {
    title: "Help & QA",
    icon: HelpCircle,
    expandable: true,
    devOnly: false, // Always show help
    items: [
      { label: "Help Center", path: "/help" },
      { label: "QA Launcher", path: "/qa/launcher2", devOnly: true },
      { label: "Quick Seed", path: "/qa/seed", devOnly: true },
      { label: "QA Smoke Test", path: "/qa/smoke", devOnly: true },
      { label: "Ops Console", path: "/ops/console", devOnly: true }
    ]
  },
  {
    title: "Quick Actions",
    expandable: false,
    items: [
      { label: "Quick Restock", path: "/restock", icon: Box },
      { label: "Record Sale", path: "/sales", icon: TrendingUp },
      { label: "Field Actions", path: "/mobile", icon: Smartphone }
    ]
  },
  {
    title: "Admin",
    expandable: false,
    items: [
      { label: "Settings", path: "/account", icon: Settings },
      { label: "Review Snapshot", path: "/admin/review-snapshot", icon: BarChart3, devOnly: true },
      { label: "Ops Kickstart", path: "/admin/kickstart", icon: Play, devOnly: true },
      { label: "QA Smoke Test", path: "/qa/smoke", icon: Play, devOnly: true },
      { label: "QA Validation", path: "/qa/verify", icon: ListChecks, devOnly: true },
      { label: "QA Control", path: "/qa/control", icon: ListChecks, devOnly: true },
      { label: "QA Tools", path: "/qa", icon: Wrench, devOnly: true }
    ]
  }
];

// Environment detection
export const ENV = typeof window !== 'undefined' 
  ? (window.location.hostname.match(/(localhost|127\.0\.0\.1|qa|staging)/i) ? 'dev' : 'prod')
  : 'prod';

// Helper to filter navigation based on environment and demo mode
export function getFilteredNavigation(isDemo?: boolean) {
  return NAVIGATION_CONFIG.map(section => {
    // Filter section by dev mode
    if (section.devOnly && ENV !== 'dev') return null;
    
    // Filter items by dev mode and demo mode
    const filteredItems = section.items.filter(item => {
      if (item.devOnly && ENV !== 'dev') return false;
      // Special QA Tools logic for demo mode
      if (item.path === '/qa' && !isDemo) return false;
      return true;
    });
    
    return filteredItems.length > 0 ? { ...section, items: filteredItems } : null;
  }).filter(Boolean) as NavSection[];
}

// Helper to find current nav item and section
export function findCurrentNavItem(pathname: string) {
  const normalizedPath = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
  
  for (const section of NAVIGATION_CONFIG) {
    for (const item of section.items) {
      if (item.path === normalizedPath || 
          (item.path !== '/' && normalizedPath.startsWith(item.path))) {
        return { section, item };
      }
    }
  }
  return null;
}