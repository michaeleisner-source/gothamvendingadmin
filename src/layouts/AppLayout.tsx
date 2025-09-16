import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import HelpBot from "../components/HelpBot";
import ScopeBar from "@/components/ScopeBar";
import AppHeader from "@/components/AppHeader";
import { AppBreadcrumbs } from "@/components/AppBreadcrumbs";
import { useRouterLinkInterceptor } from "../hooks/useRouterLinkInterceptor";

export default function AppLayout() {
  useRouterLinkInterceptor();
  
  return (
    <div className="gv-content">
      {/* sidebar */}
      <Sidebar />

      {/* main column */}
      <div className="gv-main-col">
        {/* gotham header */}
        <AppHeader />

        {/* legacy scope bar - can be removed later */}
        <ScopeBar />

        {/* page content */}
        <main className="gv-page">
          <Outlet />
        </main>
      </div>
      
      <HelpBot />
    </div>
  );
}