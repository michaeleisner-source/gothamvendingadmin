import { Routes, Route, Navigate } from 'react-router-dom';
import OverviewSmoke from '../pages/qa/OverviewSmoke';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Optional: land on dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* ✅ SMOKE ROUTE */}
      <Route path="/qa/overview" element={<OverviewSmoke />} />

      {/* 404 */}
      <Route path="*" element={<div className="card">Not Found</div>} />
    </Routes>
  );
}