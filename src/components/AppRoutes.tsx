import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

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
            <h1 className="ml-4 font-semibold">Application</h1>
          </header>
          
          <main className="flex-1 p-4">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
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
  
  console.log('QAOverviewInline rendering, current path:', path);
  console.log('location.hash:', location.hash);
  console.log('location.pathname:', location.pathname);
  
  useEffect(() => {
    console.log('QAOverviewInline useEffect running');
    const onHash = () => {
      const newPath = location.hash || location.pathname;
      console.log('Hash change detected, new path:', newPath);
      setPath(newPath);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  
  return (
    <div>
      <div className="card" style={{marginBottom:12}}>
        <div style={{fontWeight:800}}>QA Overview — Online</div>
        <div style={{color:'var(--muted)'}}>Loaded at {ts}</div>
      </div>
      <div className="card">
        <p style={{marginTop:0}}>Router path: <code>{path || '(empty)'}</code></p>
        <p>Hash: <code>{location.hash}</code></p>
        <p>Pathname: <code>{location.pathname}</code></p>
        <p style={{marginBottom:0}}>This proves the <b>/qa/overview</b> route is rendering. Next we can swap in the full audit UI.</p>
      </div>
    </div>
  );
}

export default function AppRoutes() {
  console.log('AppRoutes rendering');
  console.log('Current location.hash:', location.hash);
  console.log('Current location.pathname:', location.pathname);
  
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardStub />} />
        <Route path="qa/overview" element={<QAOverviewInline />} />
        
        {/* Placeholder routes for sidebar navigation */}
        <Route path="analytics" element={<Card title="Analytics">Coming soon...</Card>} />
        <Route path="reports" element={<Card title="Reports">Coming soon...</Card>} />
        <Route path="settings" element={<Card title="Settings">Coming soon...</Card>} />
        <Route path="qa/smoke" element={<Card title="QA Smoke Test">Coming soon...</Card>} />
      </Route>

      {/* 404 shows current path to help debugging */}
      <Route path="*" element={
        <Card title="Not Found">
          <p style={{marginTop:0}}>Path: <code>{location.hash || location.pathname}</code></p>
          <p style={{marginBottom:0}}>If you expected /qa/overview, open <code>/qa/overview</code>.</p>
        </Card>
      } />
    </Routes>
  );
}