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
  { title: 'Dashboard', expandable: false, items: [
    { label: 'Mission Control', path: '/', icon: '📊' },
  ]},
  { title: 'Pipeline', expandable: true, items: [
    { label: 'All Prospects', path: '/prospects', icon: '🧲' },
    { label: 'New Prospect', path: '/prospects/new', icon: '➕' },
    { label: 'Convert → Contract', path: '/prospects/convert', icon: '🔄' },
    { label: 'Contract Management', path: '/contracts', icon: '📋' },
  ]},
  { title: 'Business Flow', expandable: false, items: [
    { label: 'Business Flow', path: '/business-flow', icon: '🏢' },
  ]},
  { title: 'Operations', expandable: true, items: [
    { label: 'Machines', path: '/machines', icon: '🗂️' },
    { label: 'Inventory', path: '/inventory', icon: '📦' },
    { label: 'Locations', path: '/locations', icon: '📍' },
    { label: 'New Location', path: '/locations/new', icon: '➕' },
    { label: 'Machine Setup', path: '/setup', icon: '🛠️' },
    { label: 'Slot Planner', path: '/slots', icon: '🎰' },
  ]},
  { title: 'Supply Chain', expandable: true, items: [
    { label: 'Products', path: '/products', icon: '🛒' },
    { label: 'Purchase Orders', path: '/purchase-orders', icon: '🧾' },
    { label: 'Suppliers', path: '/suppliers', icon: '🏭' },
  ]},
  { title: 'Finance', expandable: true, items: [
    { label: 'Overview', path: '/finance', icon: '💰' },
    { label: 'Commissions', path: '/finance/commissions', icon: '💸' },
    { label: 'Payment Processors', path: '/finance/processors', icon: '💳' },
    { label: 'Product Profitability', path: '/finance/profitability', icon: '📈' },
  ]},
  { title: 'Reports', expandable: true, items: [
    { label: 'All Reports', path: '/reports', icon: '📊' },
    { label: 'Data Exports', path: '/exports', icon: '📥' },
    { label: 'Sales Summary', path: '/reports/sales-summary', icon: '🧮' },
    { label: 'Machine ROI', path: '/reports/machine-roi', icon: '🤖' },
    { label: 'Location Performance', path: '/reports/location-performance', icon: '🗺️' },
    { label: 'Location Performance (Edge)', path: '/reports/location-performance-edge', icon: '🚀' },
    { label: 'Sales Trends', path: '/reports/trends', icon: '📈' },
    { label: 'Stockout Predictions', path: '/reports/stockouts', icon: '⚠️' },
    { label: 'Location Commissions', path: '/reports/location-commissions', icon: '💰' },
    { label: 'Product Profitability', path: '/reports/product-profitability-net', icon: '🍫' },
    { label: 'Prospect Funnel', path: '/reports/prospect-funnel', icon: '🧲' },
    { label: 'Route Efficiency', path: '/reports/route-efficiency', icon: '🚚' },
    { label: 'Inventory Health', path: '/reports/inventory-health', icon: '⏳' },
    { label: 'Processor Reconciliation', path: '/reports/processor-reconciliation', icon: '⚖️' },
  ]},
  { title: 'Support', expandable: true, items: [
    { label: 'Tickets', path: '/tickets', icon: '🎫' },
    { label: 'Delivery Routes', path: '/delivery-routes', icon: '🚚' },
    { label: 'Staff', path: '/staff', icon: '👥' },
    { label: 'Audit Logs', path: '/audit', icon: '📝' },
  ]},
  { title: 'Help & QA', expandable: true, items: [
    { label: 'Help Center', path: '/help', icon: '❓' },
    { label: 'QA Launcher', path: '/qa/launcher2', icon: '🚀', devOnly: true },
    { label: 'Quick Seed', path: '/qa/seed', icon: '🌱', devOnly: true },
    { label: 'QA Smoke Test', path: '/qa/smoke', icon: '🧪', devOnly: true },
    { label: 'Ops Console', path: '/ops/console', icon: '🖥️', devOnly: true },
  ]},
  { title: 'Quick Actions', expandable: false, items: [
    { label: 'Quick Restock', path: '/restock', icon: '📦' },
    { label: 'Record Sale', path: '/sales', icon: '📈' },
    { label: 'Field Actions', path: '/mobile', icon: '📱' },
  ]},
  { title: 'Admin', expandable: false, items: [
    { label: 'Settings', path: '/account', icon: '⚙️' },
    { label: 'Review Snapshot', path: '/admin/review-snapshot', icon: '📊', devOnly: true },
    { label: 'Ops Kickstart', path: '/admin/kickstart', icon: '▶️', devOnly: true },
    { label: 'QA Smoke Test', path: '/qa/smoke', icon: '▶️', devOnly: true },
    { label: 'QA Validation', path: '/qa/verify', icon: '✅', devOnly: true },
    { label: 'QA Control', path: '/qa/control', icon: '🎛️', devOnly: true },
    { label: 'QA Tools', path: '/qa', icon: '🔧', devOnly: true },
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