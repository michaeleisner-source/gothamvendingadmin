import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Icon } from "@/components/ui/Icon";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

// Import centralized navigation configuration
import { NAV, getFilteredNavigation } from '@/config/nav';

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  
  // Initialize expanded state with all sections expanded by default
  const initialExpanded = NAV.reduce((acc, section) => {
    acc[section.title] = true;
    return acc;
  }, {} as Record<string, boolean>);
  
  const [expanded, setExpanded] = useState<Record<string, boolean>>(initialExpanded);

  const getNavCls = (active: boolean) =>
    active 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
      : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground";

  // Filter navigation based on environment (dev mode)
  const filteredNav = getFilteredNavigation();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 font-bold text-lg border-b border-border bg-accent/5">
          <div className="text-primary">Gotham Vending</div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {filteredNav.map((section) => {
            return (
              <SidebarGroup key={section.title}>
                <button
                  className="w-full flex justify-between items-center px-2 py-2 text-xs font-semibold uppercase text-muted-foreground hover:text-primary transition-colors"
                  onClick={() =>
                    setExpanded((e) => ({ ...e, [section.title]: !e[section.title] }))
                  }
                >
                  {state !== "collapsed" && section.title}
                  {state !== "collapsed" && (
                    <span className="text-xs">
                      {expanded[section.title] ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </span>
                  )}
                </button>
                {expanded[section.title] && (
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {section.items.map((item) => (
                        <SidebarMenuItem key={item.path}>
                          <SidebarMenuButton asChild>
                            <NavLink 
                              to={item.path} 
                              className={({ isActive }) => getNavCls(isActive)}
                            >
                              <div className="flex items-center gap-3 w-full">
                                {item.icon && <Icon name={item.icon} size={16} className="flex-shrink-0" />}
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

        {/* Auth disabled during development - footer removed */}
        <div className="p-4 border-t border-border text-sm bg-accent/5 text-muted-foreground text-center">
          {state !== "collapsed" && "Development Mode"}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}