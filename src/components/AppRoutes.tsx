import { Routes, Route, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Index from "@/pages/Index";
import Leads from "@/pages/Leads";
import Prospects from "@/pages/Prospects";
import Locations from "@/pages/Locations";
import Machines from "@/pages/Machines";
import MachineInventory from "@/pages/MachineInventory";
import Products from "@/pages/Products";
import Suppliers from "@/pages/Suppliers";
import PurchaseOrders from "@/pages/PurchaseOrders";
import Reports from "@/pages/Reports";
import Account from "@/pages/Account";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";

const AppRoutes = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === "/auth";

  // During development - bypass authentication
  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/auth" element={<Auth />} />
      </Routes>
    );
  }

  // Main app layout without authentication requirement
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b bg-background">
            <SidebarTrigger className="ml-2" />
            <h1 className="ml-4 font-semibold">Gotham Vending</h1>
          </header>
          <main className="flex-1 p-4">
            <Routes>
              <Route path="/" element={<Index />} />
              
              {/* Sales */}
              <Route path="/prospects" element={<Prospects />} />
              <Route path="/prospects/new" element={<Prospects />} />
              <Route path="/locations" element={<Locations />} />
              <Route path="/locations/new" element={<Locations />} />
              
              {/* Operations */}
              <Route path="/machines" element={<Machines />} />
              <Route path="/machines/new" element={<Machines />} />
              <Route path="/machines/:machineId/inventory" element={<MachineInventory />} />
              
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
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppRoutes;