import { Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Leads from "@/pages/Leads";
import CashCollection from "@/pages/CashCollection";
import LowStockPage from "@/pages/alerts/LowStockPage";
import CashFlowPage from "@/pages/finance/CashFlowPage";
import InventoryReportsPage from "@/pages/reports/InventoryReportsPage";
import StaffPerformancePage from "@/pages/analytics/StaffPerformancePage";
import Machines from "@/pages/Machines";
import Locations from "@/pages/Locations";
import Inventory from "@/pages/Inventory";
import RoutesPage from "@/pages/Routes";
import Suppliers from "@/pages/Suppliers";
import PurchaseOrders from "@/pages/PurchaseOrders";
import Contracts from "@/pages/Contracts";

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
      <Route path="/machines" element={<Machines />} />
      <Route path="/locations" element={<Locations />} />
      <Route path="/inventory" element={<Inventory />} />
      <Route path="/routes" element={<RoutesPage />} />
      <Route path="/suppliers" element={<Suppliers />} />
      <Route path="/purchase-orders" element={<PurchaseOrders />} />
      <Route path="/contracts" element={<Contracts />} />
      <Route path="*" element={<Index />} />
    </Routes>
  );
};

export default AppRoutes;