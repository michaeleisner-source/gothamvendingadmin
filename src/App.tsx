import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import ScaffoldPage from "@/components/ScaffoldPage";
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
import NewProspect from "./pages/NewProspect";
import ProspectDetail from "./pages/ProspectDetail";
import ProspectFunnel from "./pages/reports/ProspectFunnel";
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
import ContractView from "./pages/ContractView"; // Contract viewing component
import ConvertProspect from "./pages/pipeline/ConvertProspect";
import LocationContract from "./pages/contracts/LocationContract";
import NewLocation from "./pages/NewLocation";
import CommissionDashboard from "./pages/CommissionDashboard";
import CommissionStatements from "./pages/CommissionStatements";
import ContractManagement from "./pages/ContractManagement";
import DashboardPage from "./pages/Dashboard";
import MachineReports from "./pages/reports/MachineReports";
import ProductReports from "./pages/reports/ProductReports";
import GlossaryPage from "./pages/help/Glossary";
import ChangelogPage from "./pages/Changelog";
import LocationPerformance from "./pages/LocationPerformance";
import LocationPerformanceReports from "./pages/reports/LocationPerformance";
import Trends from "./pages/reports/Trends";
import Stockouts from "./pages/reports/Stockouts";
import ExportsPage from "./pages/ExportsPage";
import QALauncher from "./pages/QALauncher";
import Health from "./pages/Health";
import SalesSummary7d from "./pages/reports/SalesSummary";
import ProductProfitabilityNet from "./pages/reports/ProductProfitabilityNet";
import MachineROI from "./pages/reports/MachineROI";
import MachineRoi from "./pages/MachineRoi";
import ProcessorReconciliation from "./pages/reports/ProcessorReconciliation";
import EnhancedDashboard from "./pages/EnhancedDashboard";
import MobileQuickActions from "./components/MobileQuickActions";
import RouteEfficiency from "./pages/reports/RouteEfficiency";
import LocationCommission from "./pages/reports/LocationCommission";
import InventoryHealth from "./pages/reports/InventoryHealth";
import BusinessFlow from "./pages/BusinessFlow";
import DailyOps from "./pages/DailyOps";
import { Insurance } from "./pages/Insurance";
import SmokeTest from "./pages/qa/SmokeTest";
import VerifySmoke from "./pages/qa/VerifySmoke";
import QAControl from "./pages/qa/QAControl";
import OpsConsole from "./pages/ops/OpsConsole";
import QALauncher2 from "./pages/qa/QALauncher2";
import QuickSeed from "./pages/qa/QuickSeed";
import QASmoke from "./pages/qa/QASmoke";
import SystemHealth from "./pages/qa/SystemHealth";
import DatabaseProbe from "./pages/qa/DatabaseProbe";
import PerformanceTest from "./pages/qa/PerformanceTest";
import AdminUsers from "./pages/AdminUsers";
import AdminSettings from "./pages/AdminSettings";
import AdminBilling from "./pages/AdminBilling";
import ServiceMaintenance from "./pages/ServiceMaintenance";
import QAOverview from "@/pages/qa/Overview";

const queryClient = new QueryClient();

// Force refresh - workflow integration complete

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Router>
        <Routes>
          {/* All routes are public in demo mode */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/mission-control" element={<EnhancedDashboard />} />
            <Route path="/leads" element={
              <ScaffoldPage title="Leads (Prospects)" description="Manage prospects and convert to Locations."
                columns={['Name','Type','Status','Contact','Created']} />
            } />
            <Route path="/installs" element={
              <ScaffoldPage title="Installs Pipeline" description="Survey → Contract → Install Scheduled → Live."
                columns={['Location','Stage','Owner','Updated']} />
            } />
            <Route path="/service" element={
              <ScaffoldPage title="Service & Maintenance" description="Track service logs, parts, and downtime."
                columns={['Date','Machine','Action','Notes','Parts Cost']} />
            } />
            <Route path="/prospects" element={<Prospects />} />
            <Route path="/prospects/new" element={<NewProspect />} />
            <Route path="/prospects/convert" element={<ConvertProspect />} />
            <Route path="/prospects/:id" element={<ProspectDetail />} />
            <Route path="/prospects/funnel" element={<ProspectFunnel />} />
            <Route path="/reports/prospect-funnel" element={<ProspectFunnel />} />
            <Route path="/reports/pipeline-analytics" element={<PipelineAnalytics />} />
            <Route path="/locations" element={<LocationsEnhanced />} />
            <Route path="/locations/new" element={<NewLocation />} />
            <Route path="/locations/:id" element={<LocationDetail />} />
            <Route path="/locations/:id/contract" element={<LocationContract />} />
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
            <Route path="/exports" element={<ExportsPage />} />
            <Route path="/audit" element={<Audit />} />
            <Route path="/finance" element={<FinanceManagement />} />
            <Route path="/finance/processors" element={<PaymentProcessors />} />
            <Route path="/finance/profitability" element={<ProductProfitabilityNet />} />
            <Route path="/reports/sales-summary" element={<SalesSummary7d />} />
            <Route path="/reports/product-profitability-net" element={<ProductProfitabilityNet />} />
            <Route path="/reports/machine-roi" element={<MachineROI />} />
            <Route path="/reports/machines" element={<MachineReports />} />
            <Route path="/reports/products" element={<ProductReports />} />
            <Route path="/reports/location-performance" element={<LocationPerformance />} />
            <Route path="/reports/locations" element={<LocationPerformanceReports />} />
            <Route path="/reports/trends" element={<Trends />} />
            <Route path="/reports/stockouts" element={<Stockouts />} />
            <Route path="/reports/route-efficiency" element={<RouteEfficiency />} />
            <Route path="/reports/location-commissions" element={<LocationCommission />} />
            <Route path="/reports/inventory-health" element={<InventoryHealth />} />
            <Route path="/finance/commissions" element={<CommissionDashboard />} />
            <Route path="/finance/commission-statements" element={<CommissionStatements />} />
            <Route path="/contracts" element={<ContractManagement />} />
            <Route path="/staff" element={<StaffEnhanced />} />
            <Route path="/help" element={<HelpCenter />} />
            <Route path="/help/glossary" element={<GlossaryPage />} />
            <Route path="/help/article/:id" element={<HelpArticle />} />
            <Route path="/changelog" element={<ChangelogPage />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/billing" element={<AdminBilling />} />
            <Route path="/contracts/:id" element={<ContractView />} />
            <Route path="/health" element={<Health />} />
          <Route path="/insurance" element={<Insurance />} />
          <Route path="/reports/machine-roi" element={<MachineRoi />} />
          <Route path="/reports/processor-reconciliation" element={<ProcessorReconciliation />} />
            <Route path="/qa" element={<QALauncher />} />
            <Route path="/qa/verify" element={<VerifySmoke />} />
            <Route path="/qa/control" element={<QAControl />} />
            <Route path="/ops/console" element={<OpsConsole />} />
            <Route path="/qa/launcher2" element={<QALauncher2 />} />
            <Route path="/qa/seed" element={<QuickSeed />} />
            <Route path="/qa/smoke" element={<QASmoke />} />
            <Route path="/qa/overview" element={<QAOverview />} />
            <Route path="/qa/system-health" element={<SystemHealth />} />
            <Route path="/qa/database-probe" element={<DatabaseProbe />} />
            <Route path="/qa/performance-test" element={<PerformanceTest />} />
            <Route path="/admin/kickstart" element={<OpsKickstartPage />} />
            <Route path="/account" element={<Account />} />
            {/* Feature Pack Routes */}
            <Route path="/workflow" element={<Workflow />} />
            <Route path="/business-flow" element={<BusinessFlow />} />
            <Route path="/ops" element={<DailyOps />} />
            {/* Feature pack routes with navigation */}
            {MachineOpsRoutes({ ProtectedRoute: null })}
            {ProcessorStatementsRoutes({ ProtectedRoute: null })}
            {CommissionsRoutes({ ProtectedRoute: null })}
            {FlowRefreshRoutes({ ProtectedRoute: null })}
            {LeanFlowRoutes({ ProtectedRoute: null })}
            {/* Phase 2 Business Intelligence Reports */}
            {Phase2Routes({ ProtectedRoute: null })}
            {/* Phase 3 Advanced Business Intelligence */}
            {Phase3Routes({ ProtectedRoute: null })}
            {/* Phase 4 Polish & System Health */}
            {Phase4Routes({ ProtectedRoute: null })}
            {/* Review Snapshot Diagnostic Tool */}
            {ReviewSnapshotRoutes({ ProtectedRoute: null })}
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
