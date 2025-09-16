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

// Navigation configuration
export const NAV: NavSection[] = [
  { title: 'Pipeline', items: [
    { label: 'Leads',    path: '/leads',    icon: 'lucide:user-plus' },
    { label: 'Installs', path: '/installs', icon: 'lucide:hammer' },
  ]},
  { title: 'Operations', items: [
    { label: 'Locations',        path: '/locations',        icon: 'lucide:map-pin' },
    { label: 'Machines',         path: '/machines',         icon: 'lucide:cpu' },
    { label: 'Products',         path: '/products',         icon: 'lucide:shopping-bag' },
    { label: 'Inventory',        path: '/inventory',        icon: 'lucide:boxes' },
    { label: 'Purchase Orders',  path: '/purchase-orders',  icon: 'lucide:clipboard-list' },
    { label: 'Service',          path: '/service',          icon: 'lucide:wrench' },
  ]},
  { title: 'Sales & Reporting', items: [
    { label: 'Dashboard',                path: '/dashboard',           icon: 'lucide:layout-dashboard' },
    { label: 'Sales Detail',             path: '/sales',               icon: 'lucide:receipt-text' },
    { label: 'Machine Performance',      path: '/reports/machines',    icon: 'lucide:robot' },
    { label: 'Product Performance',      path: '/reports/products',    icon: 'lucide:candy' },
    { label: 'Location Performance',     path: '/reports/locations',   icon: 'lucide:map' },
    { label: 'Trends',                   path: '/reports/trends',      icon: 'lucide:line-chart' },
    { label: 'Inventory & Stock-outs',   path: '/reports/stockouts',   icon: 'lucide:triangle-alert' },
    { label: 'Exports',                  path: '/exports',             icon: 'lucide:download' },
  ]},
  { title: 'Admin', items: [
    { label: 'Users & Roles', path: '/admin/users',    icon: 'lucide:users' },
    { label: 'Org Settings',  path: '/admin/settings', icon: 'lucide:settings' },
    { label: 'Billing',       path: '/admin/billing',  icon: 'lucide:credit-card' },
  ]},
  { title: 'Help', items: [
    { label: 'Help Center', path: '/help',           icon: 'lucide:circle-help' },
    { label: 'Glossary',    path: '/help/glossary',  icon: 'lucide:book-text' },
    { label: "What's New",  path: '/changelog',      icon: 'lucide:history' },
  ]},
  { title: 'QA & Tools', devOnly: true, items: [
    { label: 'QA Overview', path: '/qa/overview', icon: 'lucide:compass' },
    { label: 'QA Smoke',    path: '/qa/smoke',    icon: 'lucide:flask-conical' },
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