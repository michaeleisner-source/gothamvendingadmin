import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import GlobalSearch from "../components/GlobalSearch";
import HelpBot from "../components/HelpBot";
import SmartNotifications from "../components/SmartNotifications";
import { useRouterLinkInterceptor } from "../hooks/useRouterLinkInterceptor";

export default function AppLayout() {
  useRouterLinkInterceptor();
  
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <GlobalSearch />
        <main className="flex-1 bg-background">
          <Outlet />
        </main>
      </div>
      <HelpBot />
      <SmartNotifications />
    </div>
  );
}