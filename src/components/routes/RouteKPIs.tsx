import React from 'react';
import { Route, Clock, DollarSign, MapPin, Gauge, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useRouteAnalytics } from '@/hooks/useRouteAnalytics';
import { Skeleton } from '@/components/ui/skeleton';

export function RouteKPIs() {
  const { data: analytics, isLoading } = useRouteAnalytics();

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
      title: 'Total Routes Run',
      value: analytics.totalRuns.toString(),
      subtitle: 'Last 14 days',
      icon: Route,
      color: 'text-blue-600',
    },
    {
      title: 'Total Revenue',
      value: `$${analytics.totalRevenue.toLocaleString()}`,
      subtitle: `$${Math.round(analytics.avgRevenuePerRun)} avg/run`,
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: 'Miles Traveled',
      value: `${analytics.totalMiles.toFixed(0)}`,
      subtitle: `${analytics.avgMilesPerRun.toFixed(1)} avg/run`,
      icon: MapPin,
      color: 'text-purple-600',
    },
    {
      title: 'Revenue per Hour',
      value: `$${analytics.efficiency.revenuePerHour.toFixed(0)}`,
      subtitle: 'Efficiency metric',
      icon: TrendingUp,
      color: 'text-orange-600',
    },
    {
      title: 'Stops per Run',
      value: analytics.avgStopsPerRun.toFixed(1),
      subtitle: `${analytics.efficiency.stopsPerHour.toFixed(1)} per hour`,
      icon: MapPin,
      color: 'text-indigo-600',
    },
    {
      title: 'Miles per Hour',
      value: analytics.efficiency.milesPerHour.toFixed(1),
      subtitle: 'Average speed',
      icon: Gauge,
      color: 'text-cyan-600',
    },
    {
      title: 'Service Time',
      value: `${analytics.avgServiceTimePerStop.toFixed(1)}m`,
      subtitle: 'Avg per stop',
      icon: Clock,
      color: 'text-yellow-600',
    },
    {
      title: 'Route Efficiency',
      value: `${((analytics.efficiency.revenuePerHour / Math.max(analytics.efficiency.milesPerHour, 1)) * 10).toFixed(1)}`,
      subtitle: 'Revenue/mile ratio',
      icon: TrendingUp,
      color: 'text-emerald-600',
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