import React from 'react';
import { Package, DollarSign, AlertTriangle, TrendingUp, RefreshCw, Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useInventoryAnalytics } from '@/hooks/useInventoryAnalytics';
import { Skeleton } from '@/components/ui/skeleton';

export function InventoryKPIs() {
  const { data: analytics, isLoading } = useInventoryAnalytics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  if (!analytics) return null;

  const kpis = [
    {
      title: 'Total Inventory Value',
      value: `$${analytics.totalValue.toLocaleString()}`,
      subtitle: `${analytics.totalItems} items`,
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: 'Revenue Potential',
      value: `$${analytics.totalRevenuePotential.toLocaleString()}`,
      subtitle: `${((analytics.totalRevenuePotential / Math.max(analytics.totalValue, 1) - 1) * 100).toFixed(1)}% margin`,
      icon: TrendingUp,
      color: 'text-blue-600',
    },
    {
      title: 'Stock Health',
      value: `${analytics.stockDistribution.good}`,
      subtitle: `${Math.round((analytics.stockDistribution.good / analytics.totalItems) * 100)}% healthy`,
      icon: Package,
      color: 'text-green-600',
    },
    {
      title: 'Needs Attention',
      value: `${analytics.lowStockCount + analytics.outOfStockCount}`,
      subtitle: `${analytics.outOfStockCount} out of stock`,
      icon: AlertTriangle,
      color: 'text-orange-600',
    },
    {
      title: 'Avg Days Supply',
      value: `${analytics.avgDaysOfSupply}`,
      subtitle: analytics.avgDaysOfSupply < 7 ? 'Critical' : analytics.avgDaysOfSupply < 14 ? 'Low' : 'Good',
      icon: Activity,
      color: analytics.avgDaysOfSupply < 7 ? 'text-red-600' : 
            analytics.avgDaysOfSupply < 14 ? 'text-orange-600' : 'text-green-600',
    },
    {
      title: 'Inventory Turnover',
      value: `${analytics.inventoryTurnover}x`,
      subtitle: 'Annual turnover',
      icon: RefreshCw,
      color: 'text-purple-600',
    },
    {
      title: 'Fast Moving Items',
      value: `${analytics.fastMovingItems}`,
      subtitle: `${Math.round((analytics.fastMovingItems / analytics.totalItems) * 100)}% of inventory`,
      icon: TrendingUp,
      color: 'text-green-600',
    },
    {
      title: 'Slow Moving Items',
      value: `${analytics.slowMovingItems}`,
      subtitle: 'Need attention',
      icon: Package,
      color: 'text-yellow-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <Card key={kpi.title}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{kpi.title}</p>
                <p className="text-2xl font-semibold">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.subtitle}</p>
              </div>
              <kpi.icon className={`h-8 w-8 ${kpi.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function InventoryStockDistribution() {
  const { data: analytics, isLoading } = useInventoryAnalytics();

  if (isLoading) {
    return <Skeleton className="h-48" />;
  }

  if (!analytics) return null;

  const total = analytics.totalItems;
  const distribution = [
    { label: 'Good Stock', count: analytics.stockDistribution.good, color: 'bg-green-500', percentage: (analytics.stockDistribution.good / total) * 100 },
    { label: 'Medium Stock', count: analytics.stockDistribution.medium, color: 'bg-yellow-500', percentage: (analytics.stockDistribution.medium / total) * 100 },
    { label: 'Low Stock', count: analytics.stockDistribution.low, color: 'bg-orange-500', percentage: (analytics.stockDistribution.low / total) * 100 },
    { label: 'Out of Stock', count: analytics.stockDistribution.out, color: 'bg-red-500', percentage: (analytics.stockDistribution.out / total) * 100 },
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Stock Distribution</h3>
        <div className="space-y-4">
          {distribution.map((item) => (
            <div key={item.label} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium">{item.count}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <Progress value={item.percentage} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}