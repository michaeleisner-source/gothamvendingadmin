import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/lib/demo";
import { Workflow } from "@/feature-pack/VendingWorkflowPack";
import { MachineOpsRoutes } from "@/feature-pack/MachineOpsPack";
import { ProcessorStatementsRoutes } from "@/feature-pack/ProcessorStatementsPack";
import { CommissionsRoutes } from "@/feature-pack/CommissionsPack";
import { FlowRefreshRoutes } from "@/feature-pack/FlowRefreshPack";
import { LeanFlowRoutes } from "@/feature-pack/LeanFlowPack";
// Phase2 Reports
import { Phase2Routes } from "@/feature-pack/Phase2ReportsPack";
// Phase3 Advanced Reports
import { Phase3Routes } from "@/feature-pack/Phase3OpsPack";
import { Phase4Routes } from "@/feature-pack/Phase4PolishPack";
import { ReviewSnapshotRoutes } from "@/feature-pack/ReviewSnapshot";
import { OpsKickstartRoutes } from "@/feature-pack/OpsKickstart";
import OpsKickstartPage from "@/feature-pack/OpsKickstart";
import AppLayout from "@/layouts/AppLayout";
import HomeDashboard from "./pages/HomeDashboard";
import NewPurchaseOrder from "./pages/NewPurchaseOrder";
import PurchaseOrderDetail from "./pages/PurchaseOrderDetail";
import PurchaseOrders from "./pages/PurchaseOrders";
import SuppliersEnhanced from "./pages/SuppliersEnhanced";
import ProductsEnhanced from "./pages/ProductsEnhanced";
import MachinesEnhanced from "./pages/MachinesEnhanced";
import MachineDetail from "./pages/MachineDetail";
import Prospects from "./pages/Prospects";
import ProspectDetail from "./pages/ProspectDetail";
import PipelineAnalytics from "./pages/PipelineAnalytics";
import LocationsEnhanced from "./pages/LocationsEnhanced";
import LocationDetail from "./pages/LocationDetail";
import DeliveryRoutes from "./pages/DeliveryRoutes";
import Picklists from "./pages/Picklists";
import Tickets from "./pages/Tickets";
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
import Audit from "./pages/Audit";
import PaymentProcessors from "./pages/PaymentProcessors";
import StaffEnhanced from "./pages/StaffEnhanced";
import FinanceManagement from "./pages/FinanceManagement";
import EnhancedReports from "./pages/EnhancedReports";
import HelpCenter from "./pages/HelpCenter";
import HelpArticle from "./pages/HelpArticle";
import QALauncher from "./pages/QALauncher";
import Health from "./pages/Health";
import SalesSummary7d from "./pages/reports/SalesSummary";
import ProductProfitabilityNet from "./pages/reports/ProductProfitabilityNet";
import MachineROI from "./pages/reports/MachineROI";
import EnhancedDashboard from "./pages/EnhancedDashboard";
import MobileQuickActions from "./components/MobileQuickActions";

const queryClient = new QueryClient();

// Force refresh - workflow integration complete

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Router>
        <Routes>
          {/* Public auth route */}
          <Route path="/auth" element={<Auth />} />
          {/* Protected routes with demo support */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/" element={<EnhancedDashboard />} />
            <Route path="/mission-control" element={<EnhancedDashboard />} />
            <Route path="/prospects" element={<Prospects />} />
            <Route path="/prospects/:id" element={<ProspectDetail />} />
            <Route path="/reports/pipeline-analytics" element={<PipelineAnalytics />} />
            <Route path="/locations" element={<LocationsEnhanced />} />
            <Route path="/locations/:id" element={<LocationDetail />} />
            <Route path="/machines" element={<MachinesEnhanced />} />
            <Route path="/machines/:id" element={<MachineDetail />} />
            <Route path="/products" element={<ProductsEnhanced />} />
            <Route path="/suppliers" element={<SuppliersEnhanced />} />
            <Route path="/purchase-orders" element={<PurchaseOrders />} />
            <Route path="/purchase-orders/new" element={<NewPurchaseOrder />} />
            <Route path="/purchase-orders/:id" element={<PurchaseOrderDetail />} />
            <Route path="/delivery-routes" element={<DeliveryRoutes />} />
            <Route path="/picklists" element={<Picklists />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/deletion-logs" element={<DeletionLogs />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/inventory/overview" element={<Inventory />} />
            <Route path="/inventory/alerts" element={<Inventory />} />
            <Route path="/cost-analysis" element={<CostAnalysis />} />
            <Route path="/restock" element={<RestockEntry />} />
            <Route path="/sales" element={<SalesEntry />} />
            <Route path="/mobile" element={<MobileQuickActions />} />
            <Route path="/setup" element={<MachineSetup />} />
            <Route path="/slots" element={<SlotPlanner />} />
            <Route path="/reports" element={<EnhancedReports />} />
            <Route path="/audit" element={<Audit />} />
            <Route path="/finance" element={<FinanceManagement />} />
            <Route path="/finance/processors" element={<PaymentProcessors />} />
            <Route path="/finance/profitability" element={<ProductProfitabilityNet />} />
            <Route path="/reports/sales-summary" element={<SalesSummary7d />} />
            <Route path="/reports/product-profitability-net" element={<ProductProfitabilityNet />} />
            <Route path="/reports/machine-roi" element={<MachineROI />} />
            <Route path="/staff" element={<StaffEnhanced />} />
            <Route path="/help" element={<HelpCenter />} />
            <Route path="/help/article/:id" element={<HelpArticle />} />
            <Route path="/health" element={<Health />} />
            <Route path="/qa" element={<QALauncher />} />
            <Route path="/admin/kickstart" element={<OpsKickstartPage />} />
            <Route path="/account" element={<Account />} />
            {/* Feature Pack Routes */}
            <Route path="/workflow" element={<Workflow />} />
            {/* Feature pack routes with navigation */}
            {MachineOpsRoutes({ ProtectedRoute })}
            {ProcessorStatementsRoutes({ ProtectedRoute })}
            {CommissionsRoutes({ ProtectedRoute })}
            {FlowRefreshRoutes({ ProtectedRoute })}
            {LeanFlowRoutes({ ProtectedRoute })}
            {/* Phase 2 Business Intelligence Reports */}
            {Phase2Routes({ ProtectedRoute })}
            {/* Phase 3 Advanced Business Intelligence */}
            {Phase3Routes({ ProtectedRoute })}
            {/* Phase 4 Polish & System Health */}
            {Phase4Routes({ ProtectedRoute })}
            {/* Review Snapshot Diagnostic Tool */}
            {ReviewSnapshotRoutes({ ProtectedRoute })}
            {/* Ops Kickstart Tool - using direct route instead */}
            {/* {OpsKickstartRoutes({ ProtectedRoute })} */}
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Router>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
