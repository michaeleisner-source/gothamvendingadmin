import { Routes, Route, Navigate } from 'react-router-dom';
import QAOverview from '../pages/qa/Overview';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Optional: land on dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* ✅ SMOKE ROUTE */}
      <Route path="/qa/overview" element={<QAOverview />} />

      {/* 404 */}
      <Route path="*" element={<div className="card">Not Found</div>} />
    </Routes>
  );
}