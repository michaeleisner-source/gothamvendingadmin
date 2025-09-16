import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useDemo } from "@/lib/demo";
import { ChevronDown, Factory } from "lucide-react";
import { getFilteredNavigation } from "@/config/navigation";

export function SimplifiedSidebar() {
  const { isDemo } = useDemo();
  const navigation = getFilteredNavigation(isDemo);
  const location = useLocation();
  
  // Smart initial state - keep groups open if they contain active route
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const state: Record<string, boolean> = {};
    const currentPath = location.pathname;
    
    navigation.forEach(section => {
      if (section.expandable) {
        const hasActiveRoute = section.items.some(item => 
          currentPath === item.path || 
          (item.path !== '/' && currentPath.startsWith(item.path))
        );
        state[section.title] = hasActiveRoute;
      }
    });
    return state;
  });

  const toggleGroup = (sectionTitle: string) => {
    setOpenGroups(prev => ({ ...prev, [sectionTitle]: !prev[sectionTitle] }));
  };

  // Icon mapping for section headers (emoji fallbacks for the new system)
  const getSectionIcon = (sectionTitle: string) => {
    const iconMap: Record<string, string> = {
      'Pipeline': '🧲',
      'Operations': '🗂️', 
      'Supply Chain': '📦',
      'Finance': '💰',
      'Reports': '📊',
      'Support': '🎫',
      'Help & QA': '❓'
    };
    return iconMap[sectionTitle] || '•';
  };

  return (
    <aside className="h-screen w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col">
      <div className="px-4 py-4 border-b border-sidebar-border flex items-center gap-2">
        <div className="size-8 rounded-xl bg-sidebar-accent grid place-items-center">
          <Factory className="size-4"/>
        </div>
        <div className="font-semibold">Gotham Vending</div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
        {navigation.map((section, index) => {
          if (!section.expandable && section.items.length === 1) {
            // Single item sections (Dashboard, Business Flow)
            const item = section.items[0];
            return (
              <NavItem 
                key={item.path} 
                to={item.path} 
                iconText={item.icon} 
                label={item.label} 
              />
            );
          }

          if (!section.expandable) {
            // Multiple items, non-expandable (Quick Actions, Admin)
            const showBorder = section.title === 'Quick Actions' || section.title === 'Admin';
            return (
              <div key={section.title} className={showBorder ? "pt-4 border-t border-sidebar-border space-y-2" : "space-y-2"}>
                {section.items.map(item => {
                  const Component = section.title === 'Quick Actions' ? QuickAction : NavItem;
                  return (
                    <Component
                      key={item.path}
                      to={item.path}
                      iconText={item.icon}
                      label={item.label}
                    />
                  );
                })}
              </div>
            );
          }

          // Expandable sections
          return (
            <ExpandableGroup
              key={section.title}
              label={section.title}
              iconText={getSectionIcon(section.title)}
              isOpen={openGroups[section.title] || false}
              onClick={() => toggleGroup(section.title)}
            >
              {section.items.map(item => (
                <SubNavItem key={item.path} to={item.path} label={item.label} />
              ))}
            </ExpandableGroup>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-sidebar-border text-xs text-muted-foreground">
        v4.0 · Simplified Flow
      </div>
    </aside>
  );
}

function NavItem({ to, iconText, label }: { to: string; iconText?: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive 
            ? "bg-sidebar-primary text-sidebar-primary-foreground" 
            : "hover:bg-sidebar-accent"
        }`
      }
    >
      <span className="size-4 text-center">{iconText || '•'}</span>
      <span>{label}</span>
    </NavLink>
  );
}

function ExpandableGroup({ 
  label, 
  iconText, 
  isOpen, 
  onClick, 
  children 
}: { 
  label: string; 
  iconText: string; 
  isOpen: boolean; 
  onClick: () => void; 
  children: React.ReactNode; 
}) {
  return (
    <div>
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-sidebar-accent transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="size-4 text-center">{iconText}</span>
          <span>{label}</span>
        </div>
        <ChevronDown 
          className={`size-4 transition-transform ${
            isOpen ? "rotate-180" : "rotate-0"
          }`} 
        />
      </button>
      
      {isOpen && (
        <div className="mt-1 ml-6 space-y-1 border-l border-sidebar-border pl-3">
          {children}
        </div>
      )}
    </div>
  );
}

function SubNavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block px-3 py-1.5 rounded-md text-sm transition-colors ${
          isActive 
            ? "bg-sidebar-primary text-sidebar-primary-foreground" 
            : "hover:bg-sidebar-accent text-muted-foreground"
        }`
      }
    >
      {label}
    </NavLink>
  );
}

function QuickAction({ to, iconText, label }: { to: string; iconText?: string; label: string }) {
  return (
    <NavLink
      to={to}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
    >
      <span className="size-4 text-center">{iconText || '•'}</span>
      <span>{label}</span>
    </NavLink>
  );
}

export default SimplifiedSidebar;