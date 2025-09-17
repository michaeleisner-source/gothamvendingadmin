import { NavLink, useLocation } from 'react-router-dom';
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

const NAV = [
  { title: 'Pipeline', items: [
    { label: 'Leads',    path: '/leads' },
    { label: 'Installs', path: '/installs' },
  ]},
  { title: 'Operations', items: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Locations', path: '/locations' },
    { label: 'Machines',  path: '/machines' },
    { label: 'Products',  path: '/products' },
    { label: 'Inventory', path: '/inventory' },
    { label: 'POs',       path: '/purchase-orders' },
    { label: 'Service',   path: '/service' },
  ]},
  { title: 'Sales & Reports', items: [
    { label: 'Sales Detail',         path: '/sales' },
    { label: 'Machine Performance',  path: '/reports/machines' },
    { label: 'Product Performance',  path: '/reports/products' },
    { label: 'Location Performance', path: '/reports/locations' },
    { label: 'Trends',               path: '/reports/trends' },
    { label: 'Stock-outs',           path: '/reports/stockouts' },
    { label: 'Exports',              path: '/exports' },
  ]},
  { title: 'Admin', items: [
    { label: 'Users & Roles', path: '/admin/users' },
    { label: 'Org Settings',  path: '/admin/settings' },
    { label: 'Billing',       path: '/admin/billing' },
  ]},
  { title: 'Help', items: [
    { label: 'Help Center', path: '/help' },
    { label: 'Glossary',    path: '/help/glossary' },
    { label: 'Changelog',   path: '/changelog' },
  ]},
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  
  const getNavClassName = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-accent text-accent-foreground font-medium" : "hover:bg-accent/50";

  return (
    <Sidebar className={open ? "w-60" : "w-14"} collapsible="icon">
      <SidebarContent>
        {NAV.map((section) => {
          return (
            <SidebarGroup key={section.title}>
              <SidebarGroupLabel className="text-xs text-muted-foreground uppercase tracking-wider">
                {section.title}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.path} className={getNavClassName}>
                          <span>{item.label}</span>
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
