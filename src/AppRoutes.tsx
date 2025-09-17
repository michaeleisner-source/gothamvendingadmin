import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '@/layouts/AppLayout';

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
import QuickSeed from "@/pages/qa/QuickSeed";
import SalesEntry from "@/pages/SalesEntry";
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

function NotFound() {
  return <div className="card" style={{padding:16}}><b>Not Found</b></div>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
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
        <Route path="sales" element={<SalesEntry />} />
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
        <Route path="qa/seed" element={<QuickSeed />} />
      </Route>

      {/* 404 shows current path to help debugging */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
