import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useDemo } from "@/lib/demo";
import {
  LayoutDashboard, MapPinned, Factory, Package2, DollarSign, 
  BarChart3, Headphones, Building2, ChevronDown, Settings, 
  Box, Wrench, TrendingUp, Smartphone
} from "lucide-react";

export function SimplifiedSidebar() {
  const { isDemo } = useDemo();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    operations: false,
    supply: false,
    support: false,
  });

  const toggleGroup = (group: string) => {
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
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
        {/* Dashboard */}
        <NavItem to="/" icon={LayoutDashboard} label="Mission Control" />
        <NavItem to="/dashboard" icon={BarChart3} label="Classic Dashboard" />

        {/* Pipeline */}
        <NavItem to="/prospects" icon={MapPinned} label="Pipeline" />
        
        {/* Operations - Expandable */}
        <ExpandableGroup
          label="Operations"
          icon={Factory}
          isOpen={openGroups.operations}
          onClick={() => toggleGroup('operations')}
        >
          <SubNavItem to="/machines" label="Machines" />
          <SubNavItem to="/inventory" label="Inventory" />
          <SubNavItem to="/locations" label="Locations" />
        </ExpandableGroup>

        {/* Supply Chain - Expandable */}
        <ExpandableGroup
          label="Supply Chain"
          icon={Package2}
          isOpen={openGroups.supply}
          onClick={() => toggleGroup('supply')}
        >
          <SubNavItem to="/products" label="Products" />
          <SubNavItem to="/purchase-orders" label="Purchase Orders" />
          <SubNavItem to="/suppliers" label="Suppliers" />
        </ExpandableGroup>

        {/* Finance */}
        <NavItem to="/finance" icon={DollarSign} label="Finance" />

        {/* Reports */}
        <NavItem to="/reports" icon={BarChart3} label="Reports" />

        {/* Support - Expandable */}
        <ExpandableGroup
          label="Support"
          icon={Headphones}
          isOpen={openGroups.support}
          onClick={() => toggleGroup('support')}
        >
          <SubNavItem to="/tickets" label="Tickets" />
          <SubNavItem to="/delivery-routes" label="Delivery Routes" />
          <SubNavItem to="/staff" label="Staff" />
        </ExpandableGroup>

        {/* Quick Actions */}
        <div className="pt-4 border-t border-sidebar-border space-y-2">
          <QuickAction to="/restock" icon={Box} label="Quick Restock" />
          <QuickAction to="/sales" icon={TrendingUp} label="Record Sale" />
          <QuickAction to="/mobile" icon={Smartphone} label="Field Actions" />
        </div>

        {/* Admin */}
        <div className="pt-4 border-t border-sidebar-border">
          <NavItem to="/account" icon={Settings} label="Settings" />
          {isDemo && (
            <NavItem to="/qa" icon={Wrench} label="QA Tools" />
          )}
        </div>
      </nav>

      <div className="px-4 py-3 border-t border-sidebar-border text-xs text-muted-foreground">
        v4.0 · Simplified Flow
      </div>
    </aside>
  );
}

function NavItem({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
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
      <Icon className="size-4" />
      <span>{label}</span>
    </NavLink>
  );
}

function ExpandableGroup({ 
  label, 
  icon: Icon, 
  isOpen, 
  onClick, 
  children 
}: { 
  label: string; 
  icon: any; 
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
          <Icon className="size-4" />
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

function QuickAction({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  return (
    <NavLink
      to={to}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
    >
      <Icon className="size-4" />
      <span>{label}</span>
    </NavLink>
  );
}

export default SimplifiedSidebar;