import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import ScaffoldPage from '@/pages/_ScaffoldPage';

let ProspectDashboard: React.ComponentType<any> | null = null;
try { ProspectDashboard = require('@/pages/ProspectDashboard').default; } catch { ProspectDashboard = null; }

const ROUTES: { path: string; title: string; el?: React.ReactNode }[] = [
  { path: '/leads',              title: 'Leads' },
  { path: '/installs',           title: 'Installs' },
  { path: '/dashboard',          title: 'Dashboard' },
  { path: '/locations',          title: 'Locations' },
  { path: '/machines',           title: 'Machines' },
  { path: '/products',           title: 'Products' },
  { path: '/inventory',          title: 'Inventory' },
  { path: '/purchase-orders',    title: 'Purchase Orders' },
  { path: '/service',            title: 'Service' },
  { path: '/sales',              title: 'Sales Detail' },
  { path: '/reports/machines',   title: 'Machine Performance' },
  { path: '/reports/products',   title: 'Product Performance' },
  { path: '/reports/locations',  title: 'Location Performance' },
  { path: '/reports/trends',     title: 'Trends' },
  { path: '/reports/stockouts',  title: 'Inventory & Stock-outs' },
  { path: '/exports',            title: 'Exports' },
  { path: '/admin/users',        title: 'Users & Roles' },
  { path: '/admin/settings',     title: 'Org Settings' },
  { path: '/admin/billing',      title: 'Billing' },
  { path: '/help',               title: 'Help Center' },
  { path: '/help/glossary',      title: 'Glossary' },
  { path: '/changelog',          title: 'Changelog' },
  { path: '/prospectsdashboard', title: 'Prospects', el: ProspectDashboard ? <ProspectDashboard/> : undefined },
];

function Page({ title, el }: { title: string; el?: React.ReactNode }) {
  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent('gv:breadcrumb:set', { detail: title }));
    return () => {
      window.dispatchEvent(new CustomEvent('gv:breadcrumb:set', { detail: null }));
    };
  }, [title]);
  return el ?? <ScaffoldPage title={title} />;
}

function NotFound() { return <div className="card" style={{padding:16}}><b>Not Found</b></div>; }

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Navigate to="/leads" replace />} />
        {ROUTES.map(r => <Route key={r.path} path={r.path} element={<Page title={r.title} el={r.el} />} />)}
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
