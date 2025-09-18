import { Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Leads from "@/pages/Leads";
import LowStock from "@/pages/LowStock";
import CashFlow from "@/pages/CashFlow";
import CashCollection from "@/pages/CashCollection";
import InventoryReports from "@/pages/InventoryReports";
import StaffPerformance from "@/pages/StaffPerformance";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/leads" element={<Leads />} />
      <Route path="/low-stock" element={<LowStock />} />
      <Route path="/cash-flow" element={<CashFlow />} />
      <Route path="/cash-collection" element={<CashCollection />} />
      <Route path="/inventory-reports" element={<InventoryReports />} />
      <Route path="/staff-performance" element={<StaffPerformance />} />
      <Route path="*" element={<Index />} />
    </Routes>
  );
};

export default AppRoutes;