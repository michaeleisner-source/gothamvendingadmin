import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NextActionBar } from '@/feature-pack/VendingWorkflowPack';
import { supabase } from '@/integrations/supabase/client';
import { 
  AlertTriangle, TrendingUp, DollarSign, Package, 
  Clock, Battery, MapPin, Target, Activity, Zap 
} from 'lucide-react';

interface DashboardMetrics {
  revenue: {
    today: number;
    yesterday: number;
    week: number;
    month: number;
  };
  machines: {
    total: number;
    online: number;
    offline: number;
    lowBattery: number;
    needService: number;
  };
  inventory: {
    lowStock: number;
    outOfStock: number;
    totalValue: number;
  };
  alerts: {
    critical: number;
    high: number;
    medium: number;
  };
}

const EnhancedDashboard = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    revenue: { today: 0, yesterday: 0, week: 0, month: 0 },
    machines: { total: 0, online: 0, offline: 0, lowBattery: 0, needService: 0 },
    inventory: { lowStock: 0, outOfStock: 0, totalValue: 0 },
    alerts: { critical: 0, high: 0, medium: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    
    // Real-time updates every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [machinesRes, salesRes, inventoryRes, ticketsRes] = await Promise.all([
        supabase.from('machines').select('status').order('created_at'),
        supabase
          .from('sales')
          .select('unit_price_cents, qty, occurred_at')
          .gte('occurred_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('inventory_levels')
          .select('current_qty, reorder_point, products!inner(cost)')
          .lte('current_qty', 5),
        supabase
          .from('tickets')
          .select('priority, status')
          .in('status', ['open', 'in_progress'])
      ]);

      // Calculate metrics
      const machines = machinesRes.data || [];
      const sales = salesRes.data || [];
      const inventory = inventoryRes.data || [];
      const tickets = ticketsRes.data || [];

      // Revenue calculations
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

      const todayRevenue = sales
        .filter(s => new Date(s.occurred_at).toDateString() === today)
        .reduce((sum, s) => sum + (s.unit_price_cents * s.qty), 0) / 100;

      const yesterdayRevenue = sales
        .filter(s => new Date(s.occurred_at).toDateString() === yesterday)
        .reduce((sum, s) => sum + (s.unit_price_cents * s.qty), 0) / 100;

      const weekRevenue = sales
        .filter(s => new Date(s.occurred_at).getTime() >= weekAgo)
        .reduce((sum, s) => sum + (s.unit_price_cents * s.qty), 0) / 100;

      const monthRevenue = sales
        .filter(s => new Date(s.occurred_at).getTime() >= monthAgo)
        .reduce((sum, s) => sum + (s.unit_price_cents * s.qty), 0) / 100;

      // Machine health
      const totalMachines = machines.length;
      const onlineMachines = machines.filter(m => m.status === 'ONLINE').length;
      const offlineMachines = machines.filter(m => m.status === 'OFFLINE').length;

      // Inventory status
      const lowStock = inventory.filter(i => i.current_qty <= i.reorder_point && i.current_qty > 0).length;
      const outOfStock = inventory.filter(i => i.current_qty === 0).length;
      const totalValue = inventory.reduce((sum, i) => sum + (i.current_qty * (i.products.cost || 0)), 0);

      // Alerts
      const criticalAlerts = tickets.filter(t => t.priority === 'critical').length;
      const highAlerts = tickets.filter(t => t.priority === 'high').length;
      const mediumAlerts = tickets.filter(t => t.priority === 'medium').length;

      setMetrics({
        revenue: {
          today: todayRevenue,
          yesterday: yesterdayRevenue,
          week: weekRevenue,
          month: monthRevenue
        },
        machines: {
          total: totalMachines,
          online: onlineMachines,
          offline: offlineMachines,
          lowBattery: 0, // TODO: Add battery monitoring
          needService: offlineMachines
        },
        inventory: {
          lowStock,
          outOfStock,
          totalValue
        },
        alerts: {
          critical: criticalAlerts,
          high: highAlerts,
          medium: mediumAlerts
        }
      });

    } catch (error) {
      console.error('Dashboard data load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const RevenueChange = ({ current, previous }: { current: number; previous: number }) => {
    const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;
    const isPositive = change >= 0;
    return (
      <div className={`text-sm flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        <TrendingUp className={`w-3 h-3 ${isPositive ? '' : 'rotate-180'}`} />
        {Math.abs(change).toFixed(1)}% vs yesterday
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Mission Control</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Activity className="w-4 h-4" />
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
      
      <NextActionBar />

      {/* Critical Alerts Banner */}
      {(metrics.alerts.critical > 0 || metrics.inventory.outOfStock > 0) && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive font-medium">
              <AlertTriangle className="w-5 h-5" />
              Immediate Attention Required
            </div>
            <div className="mt-2 text-sm">
              {metrics.alerts.critical > 0 && `${metrics.alerts.critical} critical alerts • `}
              {metrics.inventory.outOfStock > 0 && `${metrics.inventory.outOfStock} machines out of stock`}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Revenue Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700">Today's Revenue</p>
                    <p className="text-2xl font-bold text-green-800">
                      ${metrics.revenue.today.toFixed(0)}
                    </p>
                    <RevenueChange current={metrics.revenue.today} previous={metrics.revenue.yesterday} />
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Week Revenue</p>
                    <p className="text-2xl font-semibold">${metrics.revenue.week.toFixed(0)}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Month Revenue</p>
                    <p className="text-2xl font-semibold">${metrics.revenue.month.toFixed(0)}</p>
                  </div>
                  <Target className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Inventory Value</p>
                    <p className="text-2xl font-semibold">${metrics.inventory.totalValue.toFixed(0)}</p>
                  </div>
                  <Package className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Machine Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Fleet Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{metrics.machines.online}</div>
                  <div className="text-sm text-muted-foreground">Online</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{metrics.machines.offline}</div>
                  <div className="text-sm text-muted-foreground">Offline</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{metrics.inventory.lowStock}</div>
                  <div className="text-sm text-muted-foreground">Low Stock</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-800">{metrics.inventory.outOfStock}</div>
                  <div className="text-sm text-muted-foreground">Out of Stock</div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                {metrics.machines.offline > 0 && (
                  <Button variant="outline" size="sm" className="text-red-600 border-red-200">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {metrics.machines.offline} Machines Need Attention
                  </Button>
                )}
                {metrics.inventory.outOfStock > 0 && (
                  <Button variant="outline" size="sm" className="text-orange-600 border-orange-200">
                    <Package className="w-4 h-4 mr-1" />
                    {metrics.inventory.outOfStock} Urgent Restocks
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <div className="text-center py-8 text-muted-foreground">
            Performance analytics coming soon - revenue trends, machine efficiency, and profitability analysis.
          </div>
        </TabsContent>

        <TabsContent value="health">
          <div className="text-center py-8 text-muted-foreground">
            System health monitoring coming soon - uptime tracking, error rates, and maintenance schedules.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedDashboard;