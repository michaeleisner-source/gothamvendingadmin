import { Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Leads from "@/pages/Leads";
import Prospects from "@/pages/Prospects";
import Locations from "@/pages/Locations";
import Machines from "@/pages/Machines";
import Products from "@/pages/Products";
import Suppliers from "@/pages/Suppliers";
import PurchaseOrders from "@/pages/PurchaseOrders";
import Reports from "@/pages/Reports";
import Account from "@/pages/Account";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      
      {/* Sales */}
      <Route path="/prospects" element={<Prospects />} />
      <Route path="/prospects/new" element={<Prospects />} />
      <Route path="/locations" element={<Locations />} />
      <Route path="/locations/new" element={<Locations />} />
      
      {/* Operations */}
      <Route path="/machines" element={<Machines />} />
      <Route path="/machines/new" element={<Machines />} />
      
      {/* Catalog */}
      <Route path="/products" element={<Products />} />
      <Route path="/products/new" element={<Products />} />
      <Route path="/suppliers" element={<Suppliers />} />
      <Route path="/suppliers/new" element={<Suppliers />} />
      
      {/* Purchasing */}
      <Route path="/purchase-orders" element={<PurchaseOrders />} />
      <Route path="/purchase-orders/new" element={<PurchaseOrders />} />
      
      {/* Analytics */}
      <Route path="/reports" element={<Reports />} />
      
      {/* Account */}
      <Route path="/account" element={<Account />} />
      
      {/* Legacy route */}
      <Route path="/leads" element={<Leads />} />
      
      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;