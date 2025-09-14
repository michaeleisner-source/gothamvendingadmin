import React from "react";
import { Route, NavLink } from "react-router-dom";
import { DollarSign, Wrench, TrendingUp, BarChart3 } from "lucide-react";
import MachineFinance from "@/pages/MachineFinance";
import MachineRoi from "@/pages/MachineRoi";
import MachineMaintenance from "@/pages/MachineMaintenance";
import MaintenanceBacklog from "@/pages/MaintenanceBacklog";

// NavItem component matching the Sidebar pattern
function NavItem({
  to,
  icon: Icon,
  collapsed,
  onExpandSidebar,
  children,
}: {
  to: string;
  icon: React.ComponentType<any>;
  collapsed: boolean;
  onExpandSidebar?: () => void;
  children: React.ReactNode;
}) {
  if (collapsed) {
    return (
      <button
        onClick={() => {
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
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 px-2 py-2 rounded-lg text-sm hover:bg-muted ${
          isActive ? "bg-muted ring-1 ring-border" : ""
        }`
      }
    >
      <Icon className="size-4" />
      <span>{children}</span>
    </NavLink>
  );
}

interface MachineOpsRoutesProps {
  ProtectedRoute?: React.ComponentType<{ children: React.ReactNode }>;
}

export function MachineOpsRoutes({ ProtectedRoute }: MachineOpsRoutesProps) {
  const Wrap: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    ProtectedRoute ? <ProtectedRoute>{children}</ProtectedRoute> : <>{children}</>;

  return (
    <>
      <Route path="/machines/finance" element={<Wrap><MachineFinance /></Wrap>} />
      <Route path="/reports/machine-roi" element={<Wrap><MachineRoi /></Wrap>} />
      <Route path="/machines/maintenance" element={<Wrap><MachineMaintenance /></Wrap>} />
      <Route path="/reports/maintenance-backlog" element={<Wrap><MaintenanceBacklog /></Wrap>} />
    </>
  );
}

export function MachineOpsSidebarMachines({ collapsed, onExpandSidebar }: { collapsed: boolean; onExpandSidebar: () => void }) {
  return (
    <>
      <NavItem to="/machines/finance" icon={DollarSign} collapsed={collapsed} onExpandSidebar={onExpandSidebar}>
        Machine Finance
      </NavItem>
      <NavItem to="/machines/maintenance" icon={Wrench} collapsed={collapsed} onExpandSidebar={onExpandSidebar}>
        Machine Maintenance
      </NavItem>
    </>
  );
}

export function MachineOpsSidebarReports({ collapsed, onExpandSidebar }: { collapsed: boolean; onExpandSidebar: () => void }) {
  return (
    <>
      <NavItem to="/reports/machine-roi" icon={TrendingUp} collapsed={collapsed} onExpandSidebar={onExpandSidebar}>
        Machine ROI
      </NavItem>
      <NavItem to="/reports/maintenance-backlog" icon={BarChart3} collapsed={collapsed} onExpandSidebar={onExpandSidebar}>
        Maintenance Backlog
      </NavItem>
    </>
  );
}