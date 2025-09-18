import { Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Leads from "@/pages/Leads";
import CashCollection from "@/pages/CashCollection";
import LowStockPage from "@/pages/alerts/LowStockPage";
import CashFlowPage from "@/pages/finance/CashFlowPage";
import InventoryReportsPage from "@/pages/reports/InventoryReportsPage";
import StaffPerformancePage from "@/pages/analytics/StaffPerformancePage";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/leads" element={<Leads />} />
      <Route path="/cash-collection" element={<CashCollection />} />
      <Route path="/alerts/low-stock" element={<LowStockPage />} />
      <Route path="/finance/cash-flow" element={<CashFlowPage />} />
      <Route path="/reports/inventory" element={<InventoryReportsPage />} />
      <Route path="/analytics/staff" element={<StaffPerformancePage />} />
      <Route path="*" element={<Index />} />
    </Routes>
  );
};

export default AppRoutes;