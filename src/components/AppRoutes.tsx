import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

// Import all the pages
import HomeDashboard from "@/pages/HomeDashboard";
import Locations from "@/pages/Locations";
import Machines from "@/pages/Machines";
import Products from "@/pages/Products";
import Inventory from "@/pages/Inventory";
import PurchaseOrders from "@/pages/PurchaseOrders";
import ExportsPage from "@/pages/ExportsPage";
import HelpCenter from "@/pages/HelpCenter";
import Glossary from "@/pages/help/Glossary";
import Changelog from "@/pages/Changelog";
import Staff from "@/pages/Staff";
import MachineReports from "@/pages/reports/MachineReports";
import ProductReports from "@/pages/reports/ProductReports";
import LocationPerformance from "@/pages/reports/LocationPerformance";
import Trends from "@/pages/reports/Trends";
import Stockouts from "@/pages/reports/Stockouts";
import QALauncher from "@/pages/QALauncher";
import Prospects from "@/pages/Prospects";

function Card({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div style={{padding:16}}>
      <div className="card" style={{marginBottom:12}}>
        <div style={{fontWeight:700, marginBottom:6}}>{title}</div>
      </div>
      {children && <div className="card">{children}</div>}
    </div>
  );
}

function Layout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b bg-background">
            <SidebarTrigger className="ml-2" />
            <h1 className="ml-4 font-semibold">Gotham Vending</h1>
          </header>
          
          <main className="flex-1 p-4">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        {/* Pipeline */}
        <Route path="leads" element={<Prospects />} />
        <Route path="installs" element={<Card title="Installs">Installation tracking coming soon...</Card>} />
        
        {/* Operations */}
        <Route path="locations" element={<Locations />} />
        <Route path="machines" element={<Machines />} />
        <Route path="products" element={<Products />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="purchase-orders" element={<PurchaseOrders />} />
        <Route path="service" element={<Card title="Service & Maintenance">Service management coming soon...</Card>} />
        
        {/* Sales & Reporting */}
        <Route path="dashboard" element={<HomeDashboard />} />
        <Route path="sales" element={<Card title="Sales Entry">Sales entry functionality coming soon...</Card>} />
        <Route path="reports/machines" element={<MachineReports />} />
        <Route path="reports/products" element={<ProductReports />} />
        <Route path="reports/locations" element={<LocationPerformance />} />
        <Route path="reports/trends" element={<Trends />} />
        <Route path="reports/stockouts" element={<Stockouts />} />
        <Route path="exports" element={<ExportsPage />} />
        
        {/* Admin */}
        <Route path="admin/users" element={<Staff />} />
        <Route path="admin/settings" element={<Card title="Org Settings">Settings coming soon...</Card>} />
        <Route path="admin/billing" element={<Card title="Billing">Billing management coming soon...</Card>} />
        
        {/* Help */}
        <Route path="help" element={<HelpCenter />} />
        <Route path="help/glossary" element={<Glossary />} />
        <Route path="changelog" element={<Changelog />} />
        
        {/* QA & Tools (dev only) */}
        <Route path="qa" element={<QALauncher />} />
        <Route path="qa/overview" element={<Card title="QA Overview">QA Overview page coming soon...</Card>} />
        <Route path="qa/smoke" element={<Card title="QA Smoke Test">Smoke test coming soon...</Card>} />
        <Route path="qa/seed" element={<Card title="Quick Seed">Data seeding coming soon...</Card>} />
      </Route>

      {/* 404 shows current path to help debugging */}
      <Route path="*" element={
        <Card title="Not Found">
          <p style={{marginTop:0}}>Path: <code>{location.hash || location.pathname}</code></p>
          <p style={{marginBottom:0}}>Page not found. Please check the navigation menu.</p>
        </Card>
      } />
    </Routes>
  );
}