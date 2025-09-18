import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, DollarSign, Package, MapPin, Calendar } from 'lucide-react';
import SalesAnalytics from '@/components/reports/SalesAnalytics';
import MachinePerformance from '@/components/reports/MachinePerformance';
import LocationAnalytics from '@/components/reports/LocationAnalytics';
import ProductProfitability from '@/components/reports/ProductProfitability';
import RevenueTrends from '@/components/reports/RevenueTrends';
import InventoryInsights from '@/components/reports/InventoryInsights';

const EnhancedReports = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Enhanced Reports</h1>
        <p className="text-muted-foreground">
          Comprehensive business intelligence and analytics
        </p>
      </div>

      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Sales
          </TabsTrigger>
          <TabsTrigger value="machines" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Machines
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Locations
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Inventory
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="sales" className="space-y-4">
          <SalesAnalytics />
        </TabsContent>
        
        <TabsContent value="machines" className="space-y-4">
          <MachinePerformance />
        </TabsContent>
        
        <TabsContent value="locations" className="space-y-4">
          <LocationAnalytics />
        </TabsContent>
        
        <TabsContent value="products" className="space-y-4">
          <ProductProfitability />
        </TabsContent>
        
        <TabsContent value="trends" className="space-y-4">
          <RevenueTrends />
        </TabsContent>
        
        <TabsContent value="inventory" className="space-y-4">
          <InventoryInsights />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedReports;