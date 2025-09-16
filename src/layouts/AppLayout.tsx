import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import HelpBot from "../components/HelpBot";
import ScopeBar from "@/components/ScopeBar";
import { AppBreadcrumbs } from "@/components/AppBreadcrumbs";
import { useRouterLinkInterceptor } from "../hooks/useRouterLinkInterceptor";

export default function AppLayout() {
  useRouterLinkInterceptor();
  
  return (
    <div className="flex h-screen">
      {/* sidebar */}
      <aside>
        <Sidebar />
      </aside>

      {/* main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* new global header with breadcrumbs */}
        <div className="h-14 bg-card border-b border-border flex items-center gap-4 px-4 sticky top-0 z-10">
          <AppBreadcrumbs />
          
          <div className="flex items-center gap-3 ml-auto">
            {/* Organization Selector */}
            <select className="bg-background border border-input rounded-md px-2 py-1 text-sm">
              <option>Gotham Vending</option>
            </select>

            {/* Date Range Selector */}
            <select className="bg-background border border-input rounded-md px-2 py-1 text-sm">
              <option>Last 30 days</option>
              <option>Last 7 days</option>
              <option>Last 90 days</option>
            </select>

            {/* Search */}
            <input
              placeholder="Search..."
              className="pl-3 pr-4 py-2 w-48 bg-background border border-input rounded-md text-sm"
            />

            {/* Avatar */}
            <div className="size-8 rounded-full bg-gradient-to-br from-primary to-primary/70 grid place-items-center">
              <span className="text-xs font-semibold text-primary-foreground">GV</span>
            </div>
          </div>
        </div>

        {/* legacy scope bar - can be removed later */}
        <ScopeBar />

        {/* page outlet */}
        <main className="flex-1 min-w-0 overflow-auto bg-background">
          <Outlet />
        </main>
      </div>
      
      <HelpBot />
    </div>
  );
}