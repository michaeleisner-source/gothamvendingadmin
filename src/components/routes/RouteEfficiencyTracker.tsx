import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Clock, Fuel, MapPin } from 'lucide-react';

interface RouteMetric {
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
  icon: React.ReactNode;
}

interface RoutePerformance {
  routeId: string;
  routeName: string;
  completionRate: number;
  fuelEfficiency: number;
  avgDeliveryTime: string;
  status: 'excellent' | 'good' | 'needs-improvement';
}

export function RouteEfficiencyTracker() {
  const metrics: RouteMetric[] = [
    {
      title: 'Average Route Time',
      value: '3.2h',
      change: -8.5,
      trend: 'down',
      icon: <Clock className="h-4 w-4" />
    },
    {
      title: 'Fuel Efficiency',
      value: '94%',
      change: 12.3,
      trend: 'up',
      icon: <Fuel className="h-4 w-4" />
    },
    {
      title: 'Route Completion',
      value: '98.5%',
      change: 2.1,
      trend: 'up',
      icon: <MapPin className="h-4 w-4" />
    }
  ];

  const routePerformance: RoutePerformance[] = [
    {
      routeId: '1',
      routeName: 'Downtown Circuit',
      completionRate: 98,
      fuelEfficiency: 95,
      avgDeliveryTime: '2.8h',
      status: 'excellent'
    },
    {
      routeId: '2',
      routeName: 'University District',
      completionRate: 94,
      fuelEfficiency: 87,
      avgDeliveryTime: '3.1h',
      status: 'good'
    },
    {
      routeId: '3',
      routeName: 'Shopping Centers',
      completionRate: 85,
      fuelEfficiency: 78,
      avgDeliveryTime: '4.2h',
      status: 'needs-improvement'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'good': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'needs-improvement': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              {metric.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center gap-1 text-xs">
                {metric.trend === 'up' ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-green-600" />
                )}
                <span className="text-green-600">
                  {Math.abs(metric.change)}% from last week
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Route Performance Details */}
      <Card>
        <CardHeader>
          <CardTitle>Route Performance Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {routePerformance.map((route) => (
              <div key={route.routeId} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{route.routeName}</h4>
                    <p className="text-sm text-muted-foreground">
                      Avg delivery time: {route.avgDeliveryTime}
                    </p>
                  </div>
                  <Badge className={getStatusColor(route.status)}>
                    {route.status.replace('-', ' ')}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Completion Rate</span>
                      <span>{route.completionRate}%</span>
                    </div>
                    <Progress value={route.completionRate} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Fuel Efficiency</span>
                      <span>{route.fuelEfficiency}%</span>
                    </div>
                    <Progress value={route.fuelEfficiency} className="h-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>AI Insights & Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10">
              <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-400">
                  Excellent Performance
                </p>
                <p className="text-sm text-green-700 dark:text-green-500">
                  Downtown Circuit is performing 15% above target efficiency. Consider expanding this route model.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10">
              <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-400">
                  Optimization Opportunity
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-500">
                  Shopping Centers route could save 45 minutes by reordering stops based on traffic patterns.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10">
              <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-400">
                  Route Consolidation
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-500">
                  University District and nearby office complex routes can be merged during low-demand periods.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}