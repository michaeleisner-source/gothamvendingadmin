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
  { title: 'Pipeline', expandable: true, items: [
    { label: 'Leads', path: '/leads', icon: '🧲' },
    { label: 'Installs', path: '/installs', icon: '🛠️' },
  ]},
  { title: 'Operations', expandable: true, items: [
    { label: 'Locations', path: '/locations', icon: '📍' },
    { label: 'Machines', path: '/machines', icon: '🗂️' },
    { label: 'Products', path: '/products', icon: '🛒' },
    { label: 'Inventory', path: '/inventory', icon: '📦' },
    { label: 'Purchase Orders', path: '/purchase-orders', icon: '🧾' },
    { label: 'Service & Maintenance', path: '/service', icon: '🧰' },
  ]},
  { title: 'Sales & Reporting', expandable: true, items: [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'Sales Detail', path: '/sales', icon: '🧮' },
    { label: 'Machine Performance', path: '/reports/machines', icon: '🤖' },
    { label: 'Product Performance', path: '/reports/products', icon: '🍫' },
    { label: 'Location Performance', path: '/reports/locations', icon: '🗺️' },
    { label: 'Trends', path: '/reports/trends', icon: '📈' },
    { label: 'Inventory & Stock-outs', path: '/reports/stockouts', icon: '⏳' },
    { label: 'Exports', path: '/exports', icon: '📥' },
  ]},
  { title: 'Admin', expandable: true, items: [
    { label: 'Users & Roles', path: '/admin/users', icon: '👥' },
    { label: 'Org Settings', path: '/admin/settings', icon: '⚙️' },
    { label: 'Billing', path: '/admin/billing', icon: '💳' },
  ]},
  { title: 'Help', expandable: true, items: [
    { label: 'Help Center', path: '/help', icon: '❓' },
    { label: 'Glossary', path: '/help/glossary', icon: '🔤' },
    { label: "What's New", path: '/changelog', icon: '📰' },
  ]},
  { title: 'QA & Tools', expandable: true, devOnly: true, items: [
    { label: 'QA Overview', path: '/qa/overview', icon: '🔍' },
    { label: 'QA Smoke Test', path: '/qa/smoke', icon: '🧪' },
    { label: 'Seed Demo Data', path: '/qa/seed', icon: '🌱' },
    { label: 'QA Launcher', path: '/qa', icon: '🚀' },
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