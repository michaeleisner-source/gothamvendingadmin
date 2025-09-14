import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import GlobalSearch from "../components/GlobalSearch";
import HelpBot from "../components/HelpBot";

export default function AppLayout() {
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
    </div>
  );
}