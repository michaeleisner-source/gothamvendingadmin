import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import ProspectDashboard from './pages/ProspectDashboard';

function NotFound() {
  return (
    <div style={{padding:16}}>
      <div className="card"><b>Not Found</b><div>Path: <code>{location.pathname}{location.hash}</code></div></div>
    </div>
  );
}

export default function AppRoutes() {
  console.log('AppRoutes loading, current path:', location.pathname, location.hash);
  
  return (
    <Routes>
      {/* Make sure dashboard works even if layout has an issue */}
      <Route path="/prospectsdashboard" element={<ProspectDashboard />} />

      {/* Your normal app under the layout */}
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Navigate to="/prospectsdashboard" replace />} />
        {/* keep your other routes here */}
      </Route>

      <Route path="*" element={<NotFound/>} />
    </Routes>
  );
}
