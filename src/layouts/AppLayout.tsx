import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import AppHeader from "../components/AppHeader";
import Breadcrumbs from "../components/Breadcrumbs";

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