import { NavLink, useLocation } from "react-router-dom";
import { NAV, isDevEnv } from "@/config/nav";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const dev = isDevEnv();

  const isActive = (path: string) => {
    const normalizedCurrent = currentPath.replace(/\/$/, '') || '/';
    const normalizedPath = path.replace(/\/$/, '') || '/';
    return normalizedCurrent === normalizedPath || 
           (path !== '/' && normalizedCurrent.startsWith(normalizedPath + '/'));
  };
  
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50";

  return (
    <Sidebar>
      <SidebarContent>
        {NAV.map(section => {
          if (section.devOnly && !dev) return null;
          
          return (
            <SidebarGroup key={section.title}>
              <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => {
                    if (item.devOnly && !dev) return null;
                    
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.path} className={getNavCls}>
                            <span className="mr-2 text-sm">{item.icon || '•'}</span>
                            <span>{item.label}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}