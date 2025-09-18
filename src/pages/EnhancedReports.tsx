import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, DollarSign, Package, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import ProfitReports from './ProfitReports';
import CostAnalysis from './CostAnalysis';
import SalesSummary7d from './reports/SalesSummary';
import InventoryHealth from './reports/InventoryHealth';

const EnhancedReports = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Enhanced Reports</h1>
        <p className="text-muted-foreground">
          Advanced reporting and analytics
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Enhanced reporting is not available with the current simplified database schema.
          This feature requires comprehensive operational data.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Reporting Overview</CardTitle>
          <CardDescription>
            Advanced analytics and reporting tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Enhanced reports require detailed sales data, machine metrics, and operational data
            that are not available in the current simplified schema.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="profit">Profit</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reports Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Comprehensive reporting suite for business intelligence.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="profit" className="space-y-4">
          <ProfitReports />
        </TabsContent>
        
        <TabsContent value="costs" className="space-y-4">
          <CostAnalysis />
        </TabsContent>
        
        <TabsContent value="sales" className="space-y-4">
          <SalesSummary7d />
        </TabsContent>
        
        <TabsContent value="inventory" className="space-y-4">
          <InventoryHealth />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedReports;