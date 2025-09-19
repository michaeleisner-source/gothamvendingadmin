// Navigation types
export type NavItem = { 
  label: string; 
  path: string; 
  icon?: string; 
  devOnly?: boolean;
};

export type NavSection = { 
  title: string; 
  devOnly?: boolean; 
  items: NavItem[];
  expandable?: boolean; // Keep for backward compatibility
};

// Environment detection
export const isDevEnv = () =>
  /localhost|127\.0\.0\.1|qa|staging/i.test(window.location.hostname) ||
  (import.meta as any)?.env?.MODE === 'development';

// Streamlined Navigation Configuration
export const NAV: NavSection[] = [
  { title: 'Dashboards', items: [
    { label: 'Business Overview', path: '/', icon: 'lucide:layout-dashboard' },
    { label: 'Mission Control', path: '/enhanced-dashboard', icon: 'lucide:activity' },
    { label: 'Sales Dashboard', path: '/sales-dashboard', icon: 'lucide:trending-up' },
    { label: 'Low Stock Alerts', path: '/alerts/low-stock', icon: 'lucide:triangle-alert' },
  ]},
  { title: 'Sales & Prospects', items: [
    { label: 'Prospects', path: '/prospects', icon: 'lucide:users' },
    { label: 'Leads (Legacy)', path: '/leads', icon: 'lucide:user-plus' },
    { label: 'Sales Entry', path: '/sales', icon: 'lucide:receipt-text' },
    { label: 'Pipeline Analytics', path: '/pipeline-analytics', icon: 'lucide:bar-chart-3' },
  ]},
  { title: 'Operations', items: [
    { label: 'Locations', path: '/locations', icon: 'lucide:map-pin' },
    { label: 'Machines', path: '/machines', icon: 'lucide:cpu' },
    { label: 'API Management', path: '/machines/api', icon: 'lucide:plug' },
    { label: 'Products', path: '/products', icon: 'lucide:shopping-bag' },
    { label: 'Inventory', path: '/inventory', icon: 'lucide:boxes' },
    { label: 'Routes & Delivery', path: '/routes', icon: 'lucide:truck' },
    { label: 'Maintenance', path: '/maintenance', icon: 'lucide:wrench' },
    { label: 'Daily Ops', path: '/daily-ops', icon: 'lucide:clipboard-list' },
  ]},
  { title: 'Finance & Purchasing', items: [
    { label: 'Finance Management', path: '/finance', icon: 'lucide:dollar-sign' },
    { label: 'Purchase Orders', path: '/purchase-orders', icon: 'lucide:shopping-cart' },
    { label: 'Commission Dashboard', path: '/commissions', icon: 'lucide:pie-chart' },
    { label: 'Cost Analysis', path: '/cost-analysis', icon: 'lucide:bar-chart-3' },
    { label: 'Cash Collection', path: '/cash-collection', icon: 'lucide:banknote' },
  ]},
  { title: 'Reports & Analytics', items: [
    { label: 'Reports Hub', path: '/reports', icon: 'lucide:bar-chart-4' },
    { label: 'Enhanced Analytics', path: '/enhanced-reports', icon: 'lucide:line-chart' },
    { label: 'Customer Analytics', path: '/customer-analytics', icon: 'lucide:users-2' },
    { label: 'Data Exports', path: '/exports', icon: 'lucide:download' },
  ]},
  { title: 'Management', items: [
    { label: 'Suppliers', path: '/suppliers', icon: 'lucide:store' },
    { label: 'Staff', path: '/staff', icon: 'lucide:user-check' },
    { label: 'Contracts & Insurance', path: '/contracts', icon: 'lucide:file-text' },
    { label: 'Business Flow', path: '/business-flow', icon: 'lucide:workflow' },
  ]},
  { title: 'Admin', items: [
    { label: 'Settings', path: '/admin/settings', icon: 'lucide:settings' },
    { label: 'Users & Roles', path: '/admin/users', icon: 'lucide:users' },
    { label: 'Billing', path: '/admin/billing', icon: 'lucide:credit-card' },
    { label: 'Health & Audit', path: '/health', icon: 'lucide:activity' },
  ]},
  { title: 'Help & Tools', items: [
    { label: 'Help Center', path: '/help', icon: 'lucide:circle-help' },
    { label: 'Glossary', path: '/help/glossary', icon: 'lucide:book-text' },
    { label: "What's New", path: '/changelog', icon: 'lucide:history' },
    { label: 'Document Processing', path: '/document-processing', icon: 'lucide:file-scan' },
  ]},
  { title: 'QA & Dev Tools', devOnly: true, items: [
    { label: 'QA Launcher', path: '/qa-launcher', icon: 'lucide:flask-conical' },
    { label: 'Ops Console', path: '/ops/console', icon: 'lucide:terminal' },
    { label: 'Deletion Logs', path: '/deletion-logs', icon: 'lucide:trash-2' },
  ]},
];

// Backward compatibility - keep existing functions but use new config
export const NAVIGATION_CONFIG = NAV; // Alias for backward compatibility
export const ENV = isDevEnv() ? 'dev' : 'prod';

// Helper to filter navigation based on environment and demo mode
export function getFilteredNavigation(isDemo?: boolean) {
  return NAV.map(section => {
    // Filter section by dev mode
    if (section.devOnly && !isDevEnv()) return null;
    
    // Filter items by dev mode and demo mode
    const filteredItems = section.items.filter(item => {
      if (item.devOnly && !isDevEnv()) return false;
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
  
  for (const section of NAV) {
    for (const item of section.items) {
      if (item.path === normalizedPath || 
          (item.path !== '/' && normalizedPath.startsWith(item.path))) {
        return { section, item };
      }
    }
  }
  return null;
}