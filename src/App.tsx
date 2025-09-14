import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PublicAccess from "@/components/PublicAccess";
import AppLayout from "@/layouts/AppLayout";
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
import MachineFinance from "./pages/MachineFinance";
import MachineMaintenance from "./pages/MachineMaintenance";
import PaymentProcessors from "./pages/PaymentProcessors";
import Staff from "./pages/Staff";
import FinanceCommissions from "./pages/FinanceCommissions";
import FinanceTaxes from "./pages/FinanceTaxes";
import FinanceExpenses from "./pages/FinanceExpenses";
import FinanceLoans from "./pages/FinanceLoans";
import ProductMargins from "./pages/ProductMargins";
import ReportsROI from "./pages/ReportsROI";
import ComplianceLicenses from "./pages/ComplianceLicenses";
import HelpCenter from "./pages/HelpCenter";
import HelpArticle from "./pages/HelpArticle";
import HelpReports from "./pages/HelpReports";
import HelpBacklog from "./pages/HelpBacklog";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <PublicAccess>
          <Routes>
            {/* All routes are now public */}
            <Route path="/auth" element={<Auth />} />
            {/* Protected routes with layout */}
            <Route element={<AppLayout />}>
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
              <Route path="/deletion-logs" element={<DeletionLogs />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/cost-analysis" element={<CostAnalysis />} />
              <Route path="/audit" element={<Audit />} />
              <Route path="/restock" element={<RestockEntry />} />
              <Route path="/sales" element={<SalesEntry />} />
              <Route path="/setup" element={<MachineSetup />} />
              <Route path="/slots" element={<SlotPlanner />} />
              <Route path="/reports" element={<ProfitReports />} />
              <Route path="/machines/finance" element={<MachineFinance />} />
              <Route path="/machines/maintenance" element={<MachineMaintenance />} />
              <Route path="/finance/processors" element={<PaymentProcessors />} />
              <Route path="/finance/commissions" element={<FinanceCommissions />} />
              <Route path="/finance/taxes" element={<FinanceTaxes />} />
              <Route path="/finance/expenses" element={<FinanceExpenses />} />
              <Route path="/finance/loans" element={<FinanceLoans />} />
              <Route path="/products/margins" element={<ProductMargins />} />
              <Route path="/reports/roi" element={<ReportsROI />} />
              <Route path="/compliance/licenses" element={<ComplianceLicenses />} />
              <Route path="/staff" element={<Staff />} />
                <Route path="/help" element={<HelpCenter />} />
                <Route path="/help/article/:id" element={<HelpArticle />} />
                <Route path="/help/backlog" element={<HelpBacklog />} />
                <Route path="/reports/help" element={<HelpReports />} />
              <Route path="/account" element={<Account />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </PublicAccess>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
