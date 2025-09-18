import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package, Clock, Bell, X } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useInventoryAnalytics } from '@/hooks/useInventoryAnalytics';

interface Alert {
  id: string;
  productName: string;
  machineName: string;
  currentQty: number;
  reorderPoint: number;
  status: 'critical' | 'low_stock' | 'out_of_stock';
  urgency: 'immediate' | 'urgent' | 'medium';
}

export function LowStockAlerts() {
  const { data: analytics, isLoading } = useInventoryAnalytics();
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Set up real-time subscription for inventory changes
    const channel = supabase
      .channel('inventory-alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory_levels'
        },
        () => {
          // Refresh analytics when inventory changes
          // The useInventoryAnalytics hook will automatically refetch
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (isLoading || !analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const allAlerts = [
    ...analytics.criticalItems.map(item => ({
      id: item.id,
      productName: item.productName,
      machineName: item.machineName,
      currentQty: item.currentQty,
      reorderPoint: item.reorderPoint,
      status: item.status as 'critical' | 'low_stock' | 'out_of_stock',
      urgency: item.urgency as 'immediate' | 'urgent' | 'medium'
    })),
    ...analytics.restockNeeds.map(item => ({
      id: item.id,
      productName: item.productName,
      machineName: item.machineName,
      currentQty: item.currentQty,
      reorderPoint: item.reorderPoint,
      status: 'low_stock' as const,
      urgency: 'medium' as const
    }))
  ].filter(alert => !dismissedAlerts.has(alert.id));

  const handleDismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
    toast({
      title: "Alert dismissed",
      description: "Alert will reappear on next inventory update if issue persists.",
    });
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'immediate': return 'bg-red-500';
      case 'urgent': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'out_of_stock': return 'destructive';
      case 'critical': return 'destructive';
      case 'low_stock': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Stock Alerts
          {allAlerts.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {allAlerts.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {allAlerts.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No stock alerts at this time</p>
            <p className="text-sm">All inventory levels are healthy</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allAlerts.slice(0, 10).map(alert => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${getUrgencyColor(alert.urgency)}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{alert.productName}</h4>
                      <Badge variant={getStatusBadge(alert.status)} className="text-xs">
                        {alert.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {alert.machineName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Current: {alert.currentQty} • Reorder at: {alert.reorderPoint}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => window.location.href = '/restock-entry'}
                  >
                    Restock
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismissAlert(alert.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            {allAlerts.length > 10 && (
              <div className="text-center py-2">
                <Button variant="outline" size="sm">
                  View All {allAlerts.length} Alerts
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function InventoryAlertsWidget() {
  const { data: analytics } = useInventoryAnalytics();

  if (!analytics) return null;

  const totalAlerts = analytics.outOfStockCount + analytics.lowStockCount;

  if (totalAlerts === 0) return null;

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <div className="flex-1">
            <p className="font-medium text-orange-900">Stock Alerts</p>
            <p className="text-sm text-orange-700">
              {analytics.outOfStockCount} out of stock, {analytics.lowStockCount} low stock
            </p>
          </div>
          <Button size="sm" variant="outline" asChild>
            <a href="/inventory">View All</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}