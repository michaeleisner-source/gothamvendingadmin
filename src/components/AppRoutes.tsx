import { Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Leads from "@/pages/Leads";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/leads" element={<Leads />} />
      <Route path="*" element={<Index />} />
    </Routes>
  );
};

export default AppRoutes;