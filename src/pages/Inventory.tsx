import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus, Activity, BarChart3 } from "lucide-react";
import { InventoryKPIs } from '@/components/inventory/InventoryKPIs';
import { LowStockAlerts } from '@/components/inventory/LowStockAlerts';
import { RealtimeInventoryGrid } from '@/components/inventory/RealtimeInventoryGrid';
import { HelpTooltip, HelpTooltipProvider } from '@/components/ui/HelpTooltip';

export default function Inventory() {
  return (
    <HelpTooltipProvider>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Activity className="h-8 w-8 text-primary" />
            <div className="flex items-center gap-2">
              <div>
                <h1 className="text-3xl font-bold">Inventory Management</h1>
                <p className="text-muted-foreground">Real-time stock tracking and automated alerts</p>
              </div>
              <HelpTooltip content="Monitor stock levels across all machines in real-time. Get automated alerts for low stock, track inventory value, and manage restock operations efficiently." />
            </div>
          </div>

        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link to="/restock-entry">
              <Plus className="mr-2 h-4 w-4" />
              Start Restock
            </Link>
          </Button>
          
          <Button variant="outline" asChild>
            <Link to="/reports/inventory">
              <BarChart3 className="mr-2 h-4 w-4" />
              View Reports
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* KPI Cards */}
          <InventoryKPIs />

          {/* Real-time Inventory Grid */}
          <RealtimeInventoryGrid />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Low Stock Alerts */}
          <LowStockAlerts />
          
          {/* Quick Actions */}
          <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start flex items-center gap-1" asChild>
            <Link to="/predictive-inventory">
              <BarChart3 className="h-4 w-4 mr-2" />
              Predictive Analytics
              <HelpTooltip content="AI-powered demand forecasting to optimize stock levels" size="sm" />
            </Link>
          </Button>
          <Button variant="outline" className="w-full justify-start flex items-center gap-1" asChild>
            <Link to="/purchase-orders">
              <Plus className="h-4 w-4 mr-2" />
              Create Purchase Order
              <HelpTooltip content="Generate purchase orders to restock inventory based on current levels" size="sm" />
            </Link>
          </Button>
          <Button variant="outline" className="w-full justify-start flex items-center gap-1" asChild>
            <Link to="/machines">
              <Activity className="h-4 w-4 mr-2" />
              Machine Status
              <HelpTooltip content="View operational status of all machines in your network" size="sm" />
            </Link>
          </Button>
          </div>
        </div>
      </div>
    </div>
    </HelpTooltipProvider>
  );
}