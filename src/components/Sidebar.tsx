import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  MapPinned,
  Building2,
  Settings2,
  Box,
  Factory,
  FileText,
  ClipboardList,
  Truck,
  ClipboardCheck,
  TicketCheck,
  Route,
  DollarSign,
  TrendingUp,
  BarChart3,
  Clipboard,
  ShieldAlert,
  Trash2,
  UserCircle2,
  ChevronDown,
  PanelLeftOpen,
  PanelLeftClose,
  Landmark,
  Percent,
  Receipt,
  PiggyBank,
  Scale,
  FileSpreadsheet,
  BadgeCheck,
  Wrench,
  HelpCircle,
} from "lucide-react";

const STORAGE_KEY = "sidebar.openGroups";
const COLLAPSED_KEY = "sidebar.collapsed";

function usePersistentState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : initial;
  });
  useEffect(() => { localStorage.setItem(key, JSON.stringify(state)); }, [key, state]);
  return [state, setState] as const;
}

/**
 * Sidebar component built around your exact workflow.
 * - Collapsible groups with smooth transitions
 * - Active-route highlight
 * - Keyboard accessible (Enter/Space toggles)
 */
export default function Sidebar() {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = usePersistentState<boolean>(COLLAPSED_KEY, false);
  
  console.log("Sidebar rendering, current pathname:", pathname);
  
  // Toggle state per group
  const [open, setOpen] = usePersistentState<Record<string, boolean>>(STORAGE_KEY, {
    pipeline: true,
    machines: true,
    supply: true,
    sales: true,
    logistics: true,
    admin: true,
  });

  const toggle = (key: string) =>
    setOpen((s) => ({ ...s, [key]: !s[key] }));

  const isActive = (href: string) => pathname === href;

  const cls = (...x: (string | false | null | undefined)[]) => x.filter(Boolean).join(" ");

  return (
    <aside className={cls(
      "h-screen bg-background border-r flex flex-col transition-all duration-200 relative z-10",
      collapsed ? "w-16" : "w-72"
    )}>
      {/* Brand / Top */}
      <div className="px-4 py-4 border-b flex items-center justify-between">
        <div className={cls("flex items-center gap-2", collapsed && "opacity-0 pointer-events-none")}>
          <div className="size-8 rounded-xl bg-muted grid place-items-center">
            <Factory className="size-4" />
          </div>
          <div className="font-semibold tracking-tight">Gotham Vending</div>
        </div>
        <button
          className="p-1 rounded hover:bg-muted"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>
      </div>

      {/* Scroll area */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {/* Dashboard */}
        {!collapsed && <SectionLabel>Dashboard</SectionLabel>}
        <NavItem href="/" icon={LayoutDashboard} collapsed={collapsed} onExpandSidebar={() => setCollapsed(false)}>Dashboard</NavItem>

        {/* 1. Pipeline */}
        <Group
          label="Pipeline"
          icon={MapPinned}
          isOpen={open.pipeline}
          onToggle={() => toggle("pipeline")}
          collapsed={collapsed}
        >
          <NavItem href="/prospects" icon={Clipboard} collapsed={collapsed} onExpandSidebar={() => setCollapsed(false)}>
            Prospects
          </NavItem>
          <NavItem href="/locations" icon={Building2} collapsed={collapsed} onExpandSidebar={() => setCollapsed(false)}>
            Locations
          </NavItem>
        </Group>

        {/* 2. Machines */}
        <Group
          label="Machines"
          icon={Settings2}
          isOpen={open.machines}
          onToggle={() => toggle("machines")}
          collapsed={collapsed}
        >
          <NavItem href="/machines" icon={Factory} collapsed={collapsed} onExpandSidebar={() => setCollapsed(false)}>
            Machines
          </NavItem>
          <NavItem href="/setup" icon={ClipboardCheck} collapsed={collapsed} onExpandSidebar={() => setCollapsed(false)}>
            Machine Setup
          </NavItem>
          <NavItem href="/slots" icon={ClipboardList} collapsed={collapsed} onExpandSidebar={() => setCollapsed(false)}>
            Slot Planner
          </NavItem>
          <NavItem href="/machines/finance" icon={DollarSign} collapsed={collapsed} onExpandSidebar={() => setCollapsed(false)}>
            Machine Finance
          </NavItem>
          <NavItem href="/machines/maintenance" icon={Wrench} collapsed={collapsed} onExpandSidebar={() => setCollapsed(false)}>
            Machine Maintenance
          </NavItem>
        </Group>

        {/* 3. Supply & Stock */}
        <Group
          label="Supply & Stock"
          icon={Box}
          isOpen={open.supply}
          onToggle={() => toggle("supply")}
          collapsed={collapsed}
        >
          <NavItem href="/products" icon={Box} collapsed={collapsed} onExpandSidebar={() => setCollapsed(false)}>
            Products
          </NavItem>
          <NavItem href="/products/margins" icon={FileSpreadsheet} collapsed={collapsed} onExpandSidebar={() => setCollapsed(false)}>
            Product Margins
          </NavItem>
          <NavItem href="/suppliers" icon={FileText} collapsed={collapsed} onExpandSidebar={() => setCollapsed(false)}>
            Suppliers
          </NavItem>
          {!collapsed && (
            <NavParent label="Purchase Orders" icon={FileText}>
              <NavChild href="/purchase-orders">
                All POs
              </NavChild>
              <NavChild href="/purchase-orders/new">
                New PO
              </NavChild>
            </NavParent>
          )}
          <NavItem href="/inventory" icon={ClipboardList} collapsed={collapsed} onExpandSidebar={() => setCollapsed(false)}>
            Inventory
          </NavItem>
          <NavItem href="/restock" icon={ClipboardCheck} collapsed={collapsed} onExpandSidebar={() => setCollapsed(false)}>
            Restock
          </NavItem>
          <NavItem href="/picklists" icon={Clipboard} collapsed={collapsed} onExpandSidebar={() => setCollapsed(false)}>
            Picklists
          </NavItem>
        </Group>

        {/* 4. Sales & Finance */}
        <Group
          label="Sales & Finance"
          icon={DollarSign}
          isOpen={open.sales}
          onToggle={() => toggle("sales")}
          collapsed={collapsed}
        >
          <NavItem href="/sales" icon={DollarSign} collapsed={collapsed} onExpandSidebar={() => setCollapsed(false)}>
            Sales Entry
          </NavItem>
          <NavItem href="/cost-analysis" icon={TrendingUp} collapsed={collapsed} onExpandSidebar={() => setCollapsed(false)}>
            Cost Analysis
          </NavItem>
          <NavItem href="/finance/processors" icon={Percent} collapsed={collapsed} onExpandSidebar={() => setCollapsed(false)}>
            Payment Processors
          </NavItem>
          <NavItem href="/finance/commissions" icon={Scale} collapsed={collapsed} onExpandSidebar={() => setCollapsed(false)}>
            Commissions
          </NavItem>
          <NavItem href="/finance/taxes" icon={Landmark} collapsed={collapsed} onExpandSidebar={() => setCollapsed(false)}>
            Taxes
          </NavItem>
          <NavItem href="/finance/expenses" icon={Receipt} collapsed={collapsed} onExpandSidebar={() => setCollapsed(false)}>
            Expenses
          </NavItem>
          <NavItem href="/finance/loans" icon={PiggyBank} collapsed={collapsed} onExpandSidebar={() => setCollapsed(false)}>
            Loans & Financing
          </NavItem>
          <NavItem href="/reports" icon={BarChart3} collapsed={collapsed} onExpandSidebar={() => setCollapsed(false)}>
            Profit Reports
          </NavItem>
          <NavItem href="/reports/roi" icon={BarChart3} collapsed={collapsed} onExpandSidebar={() => setCollapsed(false)}>
            ROI & Depreciation
          </NavItem>
        </Group>

        {/* 5. Logistics & Support */}
        <Group
          label="Logistics & Support"
          icon={Route}
          isOpen={open.logistics}
          onToggle={() => toggle("logistics")}
          collapsed={collapsed}
        >
          <NavItem href="/delivery-routes" icon={Truck} collapsed={collapsed} onExpandSidebar={() => setCollapsed(false)}>
            Delivery Routes
          </NavItem>
          <NavItem href="/tickets" icon={TicketCheck} collapsed={collapsed} onExpandSidebar={() => setCollapsed(false)}>
            Tickets
          </NavItem>
          <NavItem href="/staff" icon={UserCircle2} collapsed={collapsed} onExpandSidebar={() => setCollapsed(false)}>
            Staff Directory
          </NavItem>
        </Group>

        {/* 6. Oversight & Admin */}
        <Group
          label="Oversight & Admin"
          icon={ShieldAlert}
          isOpen={open.admin}
          onToggle={() => toggle("admin")}
          collapsed={collapsed}
        >
          <NavItem href="/compliance/licenses" icon={BadgeCheck} collapsed={collapsed} onExpandSidebar={() => setCollapsed(false)}>
            Compliance & Licenses
          </NavItem>
          <NavItem href="/audit" icon={ShieldAlert} collapsed={collapsed} onExpandSidebar={() => setCollapsed(false)}>
            Audit
          </NavItem>
          <NavItem href="/deletion-logs" icon={Trash2} collapsed={collapsed} onExpandSidebar={() => setCollapsed(false)}>
            Deletion Logs
          </NavItem>
          <NavItem href="/account" icon={UserCircle2} collapsed={collapsed} onExpandSidebar={() => setCollapsed(false)}>
            Account
          </NavItem>
          <NavItem href="/help" icon={HelpCircle} collapsed={collapsed} onExpandSidebar={() => setCollapsed(false)}>
            Help Center
          </NavItem>
        </Group>
      </nav>

      {/* Footer / Version or quick context */}
      <div className="px-4 py-3 border-t text-xs text-muted-foreground">
        {!collapsed && <div>v1.1 · Workflow+Finance</div>}
      </div>
    </aside>
  );
}

/*************************
 * UI atoms
 *************************/
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2 pt-2 pb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
      {children}
    </div>
  );
}

function Group({
  label,
  icon: Icon,
  isOpen,
  onToggle,
  collapsed,
  children,
}: {
  label: string;
  icon: React.ComponentType<any>;
  isOpen: boolean;
  onToggle: () => void;
  collapsed: boolean;
  children: React.ReactNode;
}) {
  if (collapsed) {
    return (
      <div className="mt-3">
        <div className="px-2 py-2 rounded-lg hover:bg-muted/50 flex justify-center" title={label}>
          <Icon className="size-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <button
        className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-muted/50 focus:bg-muted outline-none"
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2">
          <Icon className="size-4" />
          <span className="text-sm font-medium">{label}</span>
        </span>
        <ChevronDown
          className={`size-4 transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-300 ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="mt-1 ml-1 border-l border-border pl-3">{children}</div>
      </div>
    </div>
  );
}

function NavItem({
  href,
  icon: Icon,
  collapsed,
  onExpandSidebar,
  children,
}: {
  href: string;
  icon: React.ComponentType<any>;
  collapsed: boolean;
  onExpandSidebar?: () => void;
  children: React.ReactNode;
}) {
  if (collapsed) {
    return (
      <button
        onClick={() => {
          // Expand the sidebar instead of navigating
          onExpandSidebar?.();
        }}
        className="w-full flex justify-center px-2 py-2 rounded-lg hover:bg-muted/50"
        title={`${children} - Click to expand`}
      >
        <Icon className="size-4" />
      </button>
    );
  }

  return (
    <NavLink
      to={href}
      className={({ isActive }) => {
        console.log(`NavItem ${href}: isActive=${isActive}, pathname=${window.location.pathname}`);
        return `flex items-center gap-2 px-2 py-2 rounded-lg text-sm hover:bg-muted/50 ${
          isActive ? "bg-primary text-primary-foreground" : ""
        }`;
      }}
      onClick={() => console.log(`Clicked on ${href}`)}
    >
      <Icon className="size-4" />
      <span>{children}</span>
    </NavLink>
  );
}

function NavParent({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ComponentType<any>;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mt-1">
      <button
        className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-muted/50 focus:bg-muted"
        onClick={() => setOpen((s) => !s)}
      >
        <span className="flex items-center gap-2">
          <Icon className="size-4" />
          <span className="text-sm">{label}</span>
        </span>
        <ChevronDown
          className={`size-4 transition-transform ${open ? "rotate-180" : "rotate-0"}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-300 ${
          open ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="ml-7 mt-1 space-y-1">{children}</div>
      </div>
    </div>
  );
}

function NavChild({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={href}
      className={({ isActive }) =>
        `block text-sm px-2 py-1.5 rounded-md hover:bg-muted/50 ${
          isActive ? "bg-primary text-primary-foreground" : ""
        }`
      }
    >
      {children}
    </NavLink>
  );
}