import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import AppHeader from "./AppHeader";
import Breadcrumbs from "./Breadcrumbs";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <AppHeader />
        <Breadcrumbs />
        <main className="flex-1 bg-muted/30">
          <div className="p-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}