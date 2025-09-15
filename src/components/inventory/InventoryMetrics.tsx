import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useInventoryAnalytics } from '@/hooks/useInventoryAnalytics';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, TrendingUp, TrendingDown, Minus, MapPin, Package } from 'lucide-react';

export function TopPerformingMachines() {
  const { data: analytics, isLoading } = useInventoryAnalytics();

  if (isLoading) {
    return <Skeleton className="h-64" />;
  }

  if (!analytics) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Machine Stock Health
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {analytics.topPerformingMachines.map((machine) => (
            <div key={machine.machine_name} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{machine.machine_name}</span>
                  {machine.needs_attention && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Attention
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{machine.total_items} items</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold">{machine.stock_health}%</div>
                <Progress value={machine.stock_health} className="w-20 h-2" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function VelocityTrends() {
  const { data: analytics, isLoading } = useInventoryAnalytics();

  if (isLoading) {
    return <Skeleton className="h-80" />;
  }

  if (!analytics) return null;

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Moving Products</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {analytics.velocityTrends.map((item, index) => (
            <div key={`${item.sku}-${index}`} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{item.product_name}</span>
                  <Badge variant="secondary" className="text-xs">{item.sku}</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{item.days_supply === 999 ? '∞' : `${Math.round(item.days_supply)} days`} supply</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getTrendIcon(item.trend)}
                <div className="text-right">
                  <div className="font-semibold">{item.velocity.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">per day</div>
                </div>
              </div>
            </div>
          ))}
          {analytics.velocityTrends.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No velocity data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function CriticalItemsAlert() {
  const { data: analytics, isLoading } = useInventoryAnalytics();

  if (isLoading) {
    return <Skeleton className="h-64" />;
  }

  if (!analytics) return null;

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'outline';
      default: return 'outline';
    }
  };

  const getUrgencyText = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'Critical';
      case 'high': return 'High';
      case 'medium': return 'Medium';
      default: return 'Low';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          Critical Stock Alerts ({analytics.criticalItems.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {analytics.criticalItems.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{item.product_name}</span>
                  <Badge variant={getUrgencyColor(item.urgency)}>
                    {getUrgencyText(item.urgency)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{item.machine_name}</p>
              </div>
              <div className="text-right">
                <div className="font-semibold">
                  {item.current_qty} / {item.reorder_point}
                </div>
                <div className="text-xs text-muted-foreground">Current / Reorder</div>
              </div>
            </div>
          ))}
          {analytics.criticalItems.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No critical stock alerts</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}