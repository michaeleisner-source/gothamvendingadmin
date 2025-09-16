import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { DemoProvider } from "../lib/demo";
import { ScopeProvider } from "@/context/Scope";
import AppLayout from '../layouts/AppLayout';
import QAOverview from '../pages/qa/Overview';
import Dashboard from '../pages/Dashboard';
import "../index.css";

const queryClient = new QueryClient();

export default function AppRoutes() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ScopeProvider>
          <DemoProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<AppLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="qa/overview" element={<QAOverview />} />
              </Route>
              
              {/* 404 */}
              <Route path="*" element={<div className="card">Not Found</div>} />
            </Routes>
          </DemoProvider>
        </ScopeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}