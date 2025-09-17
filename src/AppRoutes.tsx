import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '@/layouts/AppLayout';

// TEMP: tiny safepage to prove rendering works
function SafeHome() {
  return (
    <div style={{padding:16}}>
      <div className="card" style={{marginBottom:12}}>
        <div style={{fontWeight:800}}>Safe Home</div>
        <div style={{color:'var(--muted)'}}>If you can see this, the shell is healthy. Use sidebar to test other pages.</div>
      </div>
    </div>
  );
}

// If your Prospect dashboard exists, import it; otherwise keep SafeHome
let ProspectDashboard: React.ComponentType<any> | null = null;
try { ProspectDashboard = require('@/pages/ProspectDashboard').default; } catch { ProspectDashboard = null; }

function NotFound() {
  return <div className="card" style={{padding:16}}><b>Not Found</b></div>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Navigate to="/safe-home" replace />} />
        <Route path="/safe-home" element={<SafeHome />} />
        {ProspectDashboard && <Route path="/prospectsdashboard" element={<ProspectDashboard />} />}

        {/* Keep other routes; if a page throws, RootErrorBoundary will show the error card */}
        {/* Example placeholders so nav doesn't 404 */}
        <Route path="/dashboard" element={<div className="card" style={{padding:16}}>Dashboard placeholder</div>} />
        <Route path="/exports" element={<div className="card" style={{padding:16}}>Exports placeholder</div>} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
