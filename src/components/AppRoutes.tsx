import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Breadcrumbs from "@/components/Breadcrumbs";
import { CreateButton } from "@/components/CreateButton";
import { GlobalSearchBar } from "@/components/GlobalSearchBar";
import { useAuth } from "@/components/auth/AuthProvider";
import { isDemoMode } from "@/lib/auth";
import Index from "@/pages/Index";
import Leads from "@/pages/Leads";
import Prospects from "@/pages/Prospects";
import Locations from "@/pages/Locations";
import Machines from "@/pages/Machines";
import SalesEntry from "@/pages/SalesEntry";
import SalesDashboard from "@/pages/SalesDashboard";
import MachineInventoryPage from "@/pages/machines/MachineInventoryPage";
import LowStockPage from "@/pages/alerts/LowStockPage";
import Products from "@/pages/Products";
import Suppliers from "@/pages/Suppliers";
import PurchaseOrders from "@/pages/PurchaseOrders";
import Reports from "@/pages/Reports";
import ReportsHub from "@/pages/ReportsHub";
import Account from "@/pages/Account";
import Auth from "@/pages/Auth";
import RouteManagement from "@/pages/RouteManagement";
import DriverDashboard from "@/pages/DriverDashboard";
import SupplierManagement from "@/pages/SupplierManagement";
import MaintenanceScheduler from "@/pages/MaintenanceScheduler";
import NotFound from "@/pages/NotFound";

// Admin & Management
import AdminBilling from "@/pages/AdminBilling";
import AdminSettings from "@/pages/AdminSettings";
import AdminUsers from "@/pages/AdminUsers";
import Staff from "@/pages/Staff";
import StaffEnhanced from "@/pages/StaffEnhanced";

// Enhanced Dashboards
import EnhancedDashboard from "@/pages/EnhancedDashboard";
import EnhancedReports from "@/pages/EnhancedReports";
import CustomerAnalytics from "@/pages/CustomerAnalytics";
import PipelineAnalytics from "@/pages/PipelineAnalytics";

// Financial & Business
import FinanceManagement from "@/pages/FinanceManagement";
import CommissionDashboard from "@/pages/CommissionDashboard";
import CommissionStatements from "@/pages/CommissionStatements";
import CostAnalysis from "@/pages/CostAnalysis";
import ProductMargins from "@/pages/ProductMargins";
import ProfitReports from "@/pages/ProfitReports";
import MachineFinance from "@/pages/MachineFinance";
import MachineRoi from "@/pages/MachineRoi";
import PaymentProcessors from "@/pages/PaymentProcessors";

// Operations & Maintenance
import MachineMaintenance from "@/pages/MachineMaintenance";
import MaintenanceBacklog from "@/pages/MaintenanceBacklog";
import MachineHealthMonitor from "@/pages/MachineHealthMonitor";
import DailyOps from "@/pages/DailyOps";
import BusinessFlow from "@/pages/BusinessFlow";
import CashCollectionManager from "@/pages/CashCollectionManager";
import CashCollectionPage from "@/pages/finance/CashCollectionPage";

// Enhanced Entity Pages
import LocationsEnhanced from "@/pages/LocationsEnhanced";
import LocationDetail from "@/pages/LocationDetail";
import LocationPerformance from "@/pages/LocationPerformance";
import MachinesEnhanced from "@/pages/MachinesEnhanced";
import MachineDetail from "@/pages/MachineDetail";
import MachineSetup from "@/pages/MachineSetup";
import ProductsEnhanced from "@/pages/ProductsEnhanced";
import SuppliersEnhanced from "@/pages/SuppliersEnhanced";
import ProspectDashboard from "@/pages/ProspectDashboard";
import ProspectDetail from "@/pages/ProspectDetail";

// Inventory & Logistics
import Inventory from "@/pages/Inventory";
import PredictiveInventory from "@/pages/PredictiveInventory";
import DeliveryRoutes from "@/pages/DeliveryRoutes";
import RestockEntry from "@/pages/RestockEntry";

// Contracts & Insurance
import NewContract from "@/pages/NewContract";
import Contracts from "@/pages/Contracts";
import ContractManagement from "@/pages/ContractManagement";
import ContractView from "@/pages/ContractView";
import Insurance from "@/pages/Insurance";

// Tools & Utilities
import ExportsPage from "@/pages/ExportsPage";
import Audit from "@/pages/Audit";
import DeletionLogs from "@/pages/DeletionLogs";
import Health from "@/pages/Health";
import HelpCenter from "@/pages/HelpCenter";
import HelpArticle from "@/pages/HelpArticle";
import Changelog from "@/pages/Changelog";
import QALauncher from "@/pages/QALauncher";
import Picklists from "@/pages/Picklists";

// Form Pages
import NewLocation from "@/pages/NewLocation";
import NewProspect from "@/pages/NewProspect";
import NewMachine from "@/pages/NewMachine";
import NewLocationWorkflow from "@/pages/workflows/NewLocationWorkflow";
import NewProduct from "@/pages/NewProduct";
import NewPurchaseOrder from "@/pages/NewPurchaseOrder";

// Subdirectory Pages
import Glossary from "@/pages/help/Glossary";
import UserManual from "@/pages/help/UserManual";
import SOPs from "@/pages/help/SOPs";
import AdminGuide from "@/pages/help/AdminGuide";
import TrainingMaterials from "@/pages/help/TrainingMaterials";
import OpsConsole from "@/pages/ops/OpsConsole";

import Customers from "@/pages/Customers";
import CustomerDetail from "@/pages/CustomerDetail";  
import CustomerInsights from "@/pages/CustomerInsights";
import CustomerExperience from "@/pages/CustomerExperience";
import DocumentProcessing from "@/pages/DocumentProcessing";
import MobileOperations from "@/pages/MobileOperations";
import DemandForecasting from "@/pages/DemandForecasting";
import MachineTemplates from "@/pages/MachineTemplates";
import MachineAPIManagement from "@/pages/MachineAPIManagement";
import ContractEdit from "@/pages/ContractEdit";
import PricingManagement from "@/pages/PricingManagement";
import ProductCatalog from "@/pages/ProductCatalog";
import CashFlow from "@/pages/CashFlow";
import StaffPerformance from "@/pages/StaffPerformance";

// Report Pages
import InventoryHealth from "@/pages/reports/InventoryHealth";
import InventoryReportsPage from "@/pages/reports/InventoryReportsPage";
import LocationCommission from "@/pages/reports/LocationCommission";
import MachineROI from "@/pages/reports/MachineROI";
import MachineReports from "@/pages/reports/MachineReports";
import ProcessorReconciliation from "@/pages/reports/ProcessorReconciliation";
import ProductProfitabilityNet from "@/pages/reports/ProductProfitabilityNet";
import ProductReports from "@/pages/reports/ProductReports";
import ProspectFunnel from "@/pages/reports/ProspectFunnel";
import RouteEfficiency from "@/pages/reports/RouteEfficiency";
import SalesDetailPage from "@/pages/reports/SalesDetailPage";
import SalesSummary from "@/pages/reports/SalesSummary";
import SilentMachines from "@/pages/reports/SilentMachines";
import Stockouts from "@/pages/reports/Stockouts";
import Trends from "@/pages/reports/Trends";

// Simple redirect component for auth page in demo mode
const AuthRedirect = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    console.log("AuthRedirect component mounted, redirecting to home...");
    navigate("/", { replace: true });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
};

const AppRoutes = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while auth is being determined
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // In demo mode, always show the main app
  if (isDemoMode()) {
    return <MainAppLayout />;
  }

  // If not authenticated and not on auth page, show auth page
  if (!user && location.pathname !== '/auth') {
    return <Auth />;
  }

  // If authenticated and on auth page, redirect to main app
  if (user && location.pathname === '/auth') {
    return <MainAppLayout />;
  }

  // Show auth page if on /auth route
  if (location.pathname === '/auth') {
    return <Auth />;
  }

  // Show main app for authenticated users
  return <MainAppLayout />;
};

const MainAppLayout = () => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b bg-background px-4">
            <div className="flex items-center">
              <SidebarTrigger />
              <h1 className="ml-4 font-semibold text-foreground">Gotham Vending</h1>
            </div>
            <div className="flex items-center gap-3">
              <GlobalSearchBar />
              <CreateButton />
            </div>
          </header>
          <Breadcrumbs />
          <main className="flex-1 p-4 bg-background">
            <Routes>
              <Route path="/" element={<Index />} />
              
              {/* Auth disabled during development */}
              {/* <Route path="/auth" element={<Auth />} /> */}
              
              {/* Dashboards */}
              <Route path="/enhanced-dashboard" element={<EnhancedDashboard />} />
              
              {/* Sales */}
              <Route path="/prospects" element={<Prospects />} />
              <Route path="/prospects/new" element={<NewProspect />} />
              <Route path="/prospect-dashboard" element={<ProspectDashboard />} />
              <Route path="/prospect/:id" element={<ProspectDetail />} />
              
              {/* Customer Management */}
              <Route path="/customers" element={<Customers />} />
              <Route path="/customers/:id" element={<CustomerDetail />} />
              <Route path="/customer-insights" element={<CustomerInsights />} />
              <Route path="/customer-experience" element={<CustomerExperience />} />
              <Route path="/document-processing" element={<DocumentProcessing />} />
              <Route path="/mobile-operations" element={<MobileOperations />} />
              <Route path="/demand-forecasting" element={<DemandForecasting />} />
              
              <Route path="/locations" element={<Locations />} />
              <Route path="/locations/new" element={<NewLocation />} />
              <Route path="/locations-enhanced" element={<LocationsEnhanced />} />
              <Route path="/location/:id" element={<LocationDetail />} />
              <Route path="/location-performance" element={<LocationPerformance />} />
              <Route path="/sales" element={<SalesEntry />} />
              <Route path="/sales/dashboard" element={<SalesDashboard />} />
              <Route path="/sales-dashboard" element={<SalesDashboard />} />
              
              {/* Operations */}
              <Route path="/machines" element={<Machines />} />
              <Route path="/machines/new" element={<NewMachine />} />
              <Route path="/machines/api" element={<MachineAPIManagement />} />
              <Route path="/machines-enhanced" element={<MachinesEnhanced />} />
              <Route path="/machine/:id" element={<MachineDetail />} />
              <Route path="/machine-setup" element={<MachineSetup />} />
              <Route path="/machines/:machineId/inventory" element={<MachineInventoryPage />} />
              <Route path="/alerts/low-stock" element={<LowStockPage />} />
              <Route path="/routes" element={<RouteManagement />} />
        <Route path="/delivery-routes" element={<DeliveryRoutes />} />
        <Route path="/workflows/new-location" element={<NewLocationWorkflow />} />
              <Route path="/driver" element={<DriverDashboard />} />
              <Route path="/maintenance" element={<MaintenanceScheduler />} />
              <Route path="/machine-maintenance" element={<MachineMaintenance />} />
              <Route path="/maintenance-backlog" element={<MaintenanceBacklog />} />
              <Route path="/machine-health" element={<MachineHealthMonitor />} />
              <Route path="/daily-ops" element={<DailyOps />} />
              <Route path="/business-flow" element={<BusinessFlow />} />
              <Route path="/cash-collection" element={<CashCollectionManager />} />
              
              {/* Catalog */}
              <Route path="/products" element={<Products />} />
              <Route path="/products/new" element={<NewProduct />} />
              <Route path="/products-enhanced" element={<ProductsEnhanced />} />
              <Route path="/catalog" element={<ProductCatalog />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/suppliers/new" element={<Suppliers />} />
              <Route path="/suppliers-enhanced" element={<SuppliersEnhanced />} />
              <Route path="/supplier-management" element={<SupplierManagement />} />
              
              {/* System Configuration */}
              <Route path="/machine-templates" element={<MachineTemplates />} />
              <Route path="/pricing" element={<PricingManagement />} />
              
              {/* Inventory & Logistics */}
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/predictive-inventory" element={<PredictiveInventory />} />
              <Route path="/restock-entry" element={<RestockEntry />} />
              
              {/* Purchasing */}
              <Route path="/purchase-orders" element={<PurchaseOrders />} />
              <Route path="/purchase-orders/new" element={<NewPurchaseOrder />} />
              
               {/* Finance & Cash Flow */}
               <Route path="/finance/cash-flow" element={<CashFlow />} />
               <Route path="/finance/cash-collection" element={<CashCollectionPage />} />
              
              {/* Analytics & Staff */}
              <Route path="/analytics/staff" element={<StaffPerformance />} />
              
              {/* Report Sub-Pages */}
              <Route path="/reports/inventory" element={<InventoryHealth />} />
              <Route path="/reports/inventory-detail" element={<InventoryReportsPage />} />
              <Route path="/reports/location-commission" element={<LocationCommission />} />
              <Route path="/reports/machine-roi" element={<MachineROI />} />
              <Route path="/reports/machines" element={<MachineReports />} />
              <Route path="/reports/processor-reconciliation" element={<ProcessorReconciliation />} />
              <Route path="/reports/product-profitability" element={<ProductProfitabilityNet />} />
              <Route path="/reports/products" element={<ProductReports />} />
              <Route path="/reports/prospect-funnel" element={<ProspectFunnel />} />
              <Route path="/reports/route-efficiency" element={<RouteEfficiency />} />
              <Route path="/reports/sales-detail" element={<SalesDetailPage />} />
              <Route path="/reports/sales-summary" element={<SalesSummary />} />
              <Route path="/reports/silent-machines" element={<SilentMachines />} />
              <Route path="/reports/stockouts" element={<Stockouts />} />
              <Route path="/reports/trends" element={<Trends />} />
              
              {/* Financial & Business */}
              <Route path="/finance" element={<FinanceManagement />} />
              <Route path="/commissions" element={<CommissionDashboard />} />
              <Route path="/commission-statements" element={<CommissionStatements />} />
              <Route path="/cost-analysis" element={<CostAnalysis />} />
              <Route path="/product-margins" element={<ProductMargins />} />
              <Route path="/profit-reports" element={<ProfitReports />} />
              <Route path="/machine-finance" element={<MachineFinance />} />
              <Route path="/machine-roi" element={<MachineRoi />} />
              <Route path="/payment-processors" element={<PaymentProcessors />} />
              
              {/* Contracts & Insurance */}
              <Route path="/contracts" element={<Contracts />} />
              <Route path="/contracts/new" element={<NewContract />} />
              <Route path="/contracts/:id/edit" element={<ContractEdit />} />
              <Route path="/contract-management" element={<ContractManagement />} />
              <Route path="/contract/:id" element={<ContractView />} />
              <Route path="/insurance" element={<Insurance />} />
              
              {/* Analytics */}
              <Route path="/reports" element={<ReportsHub />} />
              <Route path="/reports-legacy" element={<Reports />} />
              <Route path="/enhanced-reports" element={<EnhancedReports />} />
              <Route path="/customer-analytics" element={<CustomerAnalytics />} />
              <Route path="/pipeline-analytics" element={<PipelineAnalytics />} />
              
              {/* Admin & Management */}
              <Route path="/admin/billing" element={<AdminBilling />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/staff" element={<Staff />} />
              <Route path="/staff-enhanced" element={<StaffEnhanced />} />
              
              {/* Tools & Utilities */}
              <Route path="/exports" element={<ExportsPage />} />
              <Route path="/audit" element={<Audit />} />
              <Route path="/deletion-logs" element={<DeletionLogs />} />
              <Route path="/health" element={<Health />} />
              <Route path="/help" element={<HelpCenter />} />
              <Route path="/help/:slug" element={<HelpArticle />} />
              <Route path="/changelog" element={<Changelog />} />
              <Route path="/qa-launcher" element={<QALauncher />} />
              <Route path="/picklists" element={<Picklists />} />
              
              {/* Subdirectory Pages */}
              <Route path="/help/glossary" element={<Glossary />} />
              <Route path="/help/user-manual" element={<UserManual />} />
              <Route path="/help/sops" element={<SOPs />} />
              <Route path="/help/admin-guide" element={<AdminGuide />} />
              <Route path="/help/training" element={<TrainingMaterials />} />
              <Route path="/ops/console" element={<OpsConsole />} />
              
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