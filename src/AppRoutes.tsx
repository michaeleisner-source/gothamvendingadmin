import { Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Leads from "@/pages/Leads";
import LowStock from "@/pages/LowStock";
import CashFlow from "@/pages/CashFlow";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/leads" element={<Leads />} />
      <Route path="/low-stock" element={<LowStock />} />
      <Route path="/cash-flow" element={<CashFlow />} />
      <Route path="*" element={<Index />} />
    </Routes>
  );
};

export default AppRoutes;