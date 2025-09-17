import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import ProspectDashboard from './pages/ProspectDashboard';

function NotFound() {
  return <div className="card" style={{padding:16}}><b>Not Found</b></div>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Navigate to="/prospectsdashboard" replace />} />
        <Route path="/prospectsdashboard" element={<ProspectDashboard />} />
        {/* add your other routes here (dashboard, reports, etc.) */}
      </Route>

      {/* fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
