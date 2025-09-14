import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthGate from "@/components/AuthGate";
import AppHeader from "@/components/AppHeader";
import HomeDashboard from "./pages/HomeDashboard";
import NewPurchaseOrder from "./pages/NewPurchaseOrder";
import PurchaseOrderDetail from "./pages/PurchaseOrderDetail";
import PurchaseOrders from "./pages/PurchaseOrders";
import Suppliers from "./pages/Suppliers";
import Products from "./pages/Products";
import Machines from "./pages/Machines";
import MachineDetail from "./pages/MachineDetail";
import Prospects from "./pages/Prospects";
import Locations from "./pages/Locations";
import LocationDetail from "./pages/LocationDetail";
import DeliveryRoutes from "./pages/DeliveryRoutes";
import Picklists from "./pages/Picklists";
import Tickets from "./pages/Tickets";
import Reports from "./pages/Reports";
import DeletionLogs from "./pages/DeletionLogs";
import Inventory from "./pages/Inventory";
import CostAnalysis from "./pages/CostAnalysis";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Account from "./pages/Account";
import RestockEntry from "./pages/RestockEntry";
import SalesEntry from "./pages/SalesEntry";
import MachineSetup from "./pages/MachineSetup";
import SlotPlanner from "./pages/SlotPlanner";
import ProfitReports from "./pages/ProfitReports";
import Audit from "./pages/Audit";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppHeader />
        <AuthGate>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />

            {/* Protected routes */}
            <Route path="/" element={<HomeDashboard />} />
            <Route path="/prospects" element={<Prospects />} />
            <Route path="/locations" element={<Locations />} />
            <Route path="/locations/:id" element={<LocationDetail />} />
            <Route path="/machines" element={<Machines />} />
            <Route path="/machines/:id" element={<MachineDetail />} />
            <Route path="/products" element={<Products />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/purchase-orders" element={<PurchaseOrders />} />
            <Route path="/purchase-orders/new" element={<NewPurchaseOrder />} />
            <Route path="/purchase-orders/:id" element={<PurchaseOrderDetail />} />
            <Route path="/delivery-routes" element={<DeliveryRoutes />} />
            <Route path="/picklists" element={<Picklists />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/deletion-logs" element={<DeletionLogs />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/cost-analysis" element={<CostAnalysis />} />
            <Route path="/audit" element={<Audit />} />
            <Route path="/restock" element={<RestockEntry />} />
            <Route path="/sales" element={<SalesEntry />} />
            <Route path="/machine-setup" element={<MachineSetup />} />
            <Route path="/slot-planner" element={<SlotPlanner />} />
            <Route path="/profit-reports" element={<ProfitReports />} />
            <Route path="/account" element={<Account />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthGate>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
