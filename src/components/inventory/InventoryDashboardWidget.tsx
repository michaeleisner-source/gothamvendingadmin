import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react';
import { useInventoryAnalytics } from '@/hooks/useInventoryAnalytics';
import { Link } from 'react-router-dom';

export function InventoryDashboardWidget() {
  const { data: analytics, isLoading } = useInventoryAnalytics();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-8 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) return null;

  const needsAttention = analytics.outOfStockCount + analytics.lowStockCount;
  const totalValue = analytics.totalValue;
  const healthPercentage = analytics.totalItems > 0 
    ? Math.round((analytics.healthyStockCount / analytics.totalItems) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory Summary
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/inventory">
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">${totalValue.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Total Value</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{analytics.totalItems}</div>
            <div className="text-xs text-muted-foreground">Items Tracked</div>
          </div>
        </div>

        {/* Health Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Inventory Health</span>
            <Badge variant={healthPercentage >= 80 ? 'default' : healthPercentage >= 60 ? 'secondary' : 'destructive'}>
              {healthPercentage}%
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-semibold text-green-600">{analytics.healthyStockCount}</div>
              <div className="text-xs text-muted-foreground">Healthy</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-yellow-600">{analytics.lowStockCount}</div>
              <div className="text-xs text-muted-foreground">Low</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-red-600">{analytics.outOfStockCount}</div>
              <div className="text-xs text-muted-foreground">Out</div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {needsAttention > 0 && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="font-medium text-orange-900">Needs Attention</span>
            </div>
            <p className="text-sm text-orange-700 mb-2">
              {analytics.outOfStockCount} items out of stock, {analytics.lowStockCount} running low
            </p>
            <Button size="sm" variant="outline" asChild>
              <Link to="/inventory">View Details</Link>
            </Button>
          </div>
        )}

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="font-semibold">{analytics.inventoryTurnover}x</span>
            </div>
            <div className="text-xs text-muted-foreground">Turnover Rate</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">{analytics.avgDaysOfSupply}d</div>
            <div className="text-xs text-muted-foreground">Avg. Supply</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function QuickInventoryStats() {
  const { data: analytics } = useInventoryAnalytics();

  if (!analytics) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-blue-600" />
            <div>
              <div className="font-semibold">{analytics.totalItems}</div>
              <div className="text-xs text-muted-foreground">Total Items</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <div>
              <div className="font-semibold text-yellow-600">{analytics.lowStockCount}</div>
              <div className="text-xs text-muted-foreground">Low Stock</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <div>
              <div className="font-semibold text-red-600">{analytics.outOfStockCount}</div>
              <div className="text-xs text-muted-foreground">Out of Stock</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <div>
              <div className="font-semibold">{analytics.inventoryTurnover}x</div>
              <div className="text-xs text-muted-foreground">Turnover</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}