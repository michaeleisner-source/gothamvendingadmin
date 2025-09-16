import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

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

function DashboardStub() {
  return (
    <Card title="Dashboard (Stub)">
      <p style={{margin:0, color:'var(--muted)'}}>Temporary dashboard to verify routing.</p>
    </Card>
  );
}

/** Minimal QA page (inline, no imports) to prove the route renders */
function QAOverviewInline() {
  const [ts] = useState(() => new Date().toLocaleString());
  // tiny proof-of-life check: ensure hash router path contains /qa/overview
  const [path, setPath] = useState<string>(location.hash || location.pathname);
  useEffect(() => {
    const onHash = () => setPath(location.hash || location.pathname);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return (
    <div style={{padding:16}}>
      <div className="card" style={{marginBottom:12}}>
        <div style={{fontWeight:800}}>QA Overview — Online</div>
        <div style={{color:'var(--muted)'}}>Loaded at {ts}</div>
      </div>
      <div className="card">
        <p style={{marginTop:0}}>Router path: <code>{path || '(empty)'}</code></p>
        <p style={{marginBottom:0}}>This proves the <b>/qa/overview</b> route is rendering. Next we can swap in the full audit UI.</p>
      </div>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* land on dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* working routes */}
      <Route path="/dashboard" element={<DashboardStub />} />
      <Route path="/qa/overview" element={<QAOverviewInline />} />

      {/* 404 shows current path to help debugging */}
      <Route path="*" element={
        <Card title="Not Found">
          <p style={{marginTop:0}}>Path: <code>{location.hash || location.pathname}</code></p>
          <p style={{marginBottom:0}}>If you expected /qa/overview, open <code>/#/qa/overview</code>.</p>
        </Card>
      } />
    </Routes>
  );
}