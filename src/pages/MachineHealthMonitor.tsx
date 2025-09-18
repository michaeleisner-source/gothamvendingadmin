import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MachineHealthMonitor as HealthMonitor } from '@/components/machine-ops/MachineHealthMonitor';
import { PredictiveMaintenance } from '@/components/machine-ops/PredictiveMaintenance';
import { MachinePerformanceDashboard } from '@/components/machine-ops/MachinePerformanceDashboard';
import { Activity, AlertTriangle, Wrench, BarChart3 } from 'lucide-react';

export default function MachineHealthMonitorPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Machine Health Monitor</h1>
        <p className="text-muted-foreground mt-2">
          Monitor machine health, predict maintenance needs, and track performance metrics
        </p>
      </div>

      <Tabs defaultValue="health" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="health" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Health Status
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Predictive Maintenance
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance Dashboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="health">
          <HealthMonitor />
        </TabsContent>

        <TabsContent value="maintenance">
          <PredictiveMaintenance />
        </TabsContent>

        <TabsContent value="performance">
          <MachinePerformanceDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}