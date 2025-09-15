import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import GlobalSearch from "../components/GlobalSearch";
import HelpBot from "../components/HelpBot";
import ScopeBar from "@/components/ScopeBar";
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
        {/* header */}
        <header>
          <GlobalSearch />
        </header>

        {/* global scope bar */}
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