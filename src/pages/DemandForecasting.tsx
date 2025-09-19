import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, TrendingUp, Bot, BarChart3 } from 'lucide-react';
import { DemandForecastingDashboard } from '@/components/forecasting/DemandForecastingDashboard';
import { PredictiveInventoryOptimizer } from '@/components/forecasting/PredictiveInventoryOptimizer';

export default function DemandForecasting() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">AI-Powered Demand Forecasting</h1>
        <p className="text-muted-foreground mt-2">
          Advanced machine learning algorithms to predict demand, optimize inventory, and maximize profitability
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Forecasting Dashboard
          </TabsTrigger>
          <TabsTrigger value="optimizer" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            AI Optimizer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <DemandForecastingDashboard />
        </TabsContent>

        <TabsContent value="optimizer">
          <PredictiveInventoryOptimizer />
        </TabsContent>
      </Tabs>
    </div>
  );
}