import { Routes, Route, useLocation } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Breadcrumbs from "@/components/Breadcrumbs";
import { CreateButton } from "@/components/CreateButton";
import { GlobalSearchBar } from "@/components/GlobalSearchBar";
import Index from "@/pages/Index";
import Leads from "@/pages/Leads";
import Prospects from "@/pages/Prospects";
import Locations from "@/pages/Locations";
import Machines from "@/pages/Machines";
import SalesEntry from "@/pages/SalesEntry";
import SalesDashboard from "@/pages/SalesDashboard";
import MachineInventory from "@/pages/MachineInventory";
import Products from "@/pages/Products";
import Suppliers from "@/pages/Suppliers";
import PurchaseOrders from "@/pages/PurchaseOrders";
import Reports from "@/pages/Reports";
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
import NewPurchaseOrder from "@/pages/NewPurchaseOrder";

// Subdirectory Pages
import Glossary from "@/pages/help/Glossary";
import OpsConsole from "@/pages/ops/OpsConsole";

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
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="h-14 flex items-center justify-between border-b bg-background px-4">
          <div className="flex items-center">
            <h1 className="font-semibold text-foreground">Gotham Vending</h1>
          </div>
          <div className="flex items-center gap-3">
            <GlobalSearchBar />
            <CreateButton />
          </div>
        </header>
        <Breadcrumbs />
        <main className="flex-1 p-4 bg-background">{/* ... keep existing code */}
            <Routes>
              <Route path="/" element={<Index />} />
              
              {/* Dashboards */}
              <Route path="/enhanced-dashboard" element={<EnhancedDashboard />} />
              
              {/* Sales */}
              <Route path="/prospects" element={<Prospects />} />
              <Route path="/prospects/new" element={<NewProspect />} />
              <Route path="/prospect-dashboard" element={<ProspectDashboard />} />
              <Route path="/prospect/:id" element={<ProspectDetail />} />
              <Route path="/locations" element={<Locations />} />
              <Route path="/locations/new" element={<NewLocation />} />
              <Route path="/locations-enhanced" element={<LocationsEnhanced />} />
              <Route path="/location/:id" element={<LocationDetail />} />
              <Route path="/location-performance" element={<LocationPerformance />} />
              <Route path="/sales" element={<SalesEntry />} />
              <Route path="/sales/dashboard" element={<SalesDashboard />} />
              
              {/* Operations */}
              <Route path="/machines" element={<Machines />} />
              <Route path="/machines/new" element={<Machines />} />
              <Route path="/machines-enhanced" element={<MachinesEnhanced />} />
              <Route path="/machine/:id" element={<MachineDetail />} />
              <Route path="/machine-setup" element={<MachineSetup />} />
              <Route path="/machines/:machineId/inventory" element={<MachineInventory />} />
              <Route path="/routes" element={<RouteManagement />} />
              <Route path="/delivery-routes" element={<DeliveryRoutes />} />
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
              <Route path="/products/new" element={<Products />} />
              <Route path="/products-enhanced" element={<ProductsEnhanced />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/suppliers/new" element={<Suppliers />} />
              <Route path="/suppliers-enhanced" element={<SuppliersEnhanced />} />
              <Route path="/supplier-management" element={<SupplierManagement />} />
              
              {/* Inventory & Logistics */}
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/predictive-inventory" element={<PredictiveInventory />} />
              <Route path="/restock-entry" element={<RestockEntry />} />
              
              {/* Purchasing */}
              <Route path="/purchase-orders" element={<PurchaseOrders />} />
              <Route path="/purchase-orders/new" element={<NewPurchaseOrder />} />
              
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
              <Route path="/contracts" element={<ContractManagement />} />
              <Route path="/contract/:id" element={<ContractView />} />
              <Route path="/insurance" element={<Insurance />} />
              
              {/* Analytics */}
              <Route path="/reports" element={<Reports />} />
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
  );
};

export default AppRoutes;