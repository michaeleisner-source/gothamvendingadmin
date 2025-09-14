import React from "react";
import { Route } from "react-router-dom";
import MachineFinance from "@/pages/MachineFinance";
import MachineRoi from "@/pages/MachineRoi";
import MachineMaintenance from "@/pages/MachineMaintenance";
import MaintenanceBacklog from "@/pages/MaintenanceBacklog";

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