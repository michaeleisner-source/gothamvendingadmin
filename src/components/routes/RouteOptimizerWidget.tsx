import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Zap, MapPin, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { useInventoryAnalytics } from '@/hooks/useInventoryAnalytics';
import { Link } from 'react-router-dom';

export function RouteOptimizerWidget() {
  const { data: inventoryData } = useInventoryAnalytics();

  const urgentStops = inventoryData?.criticalItems.slice(0, 3) || [];
  const totalOptimization = 94; // Simulated efficiency score

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Route Optimizer
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to="/routes">
              View All
            </Link>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Optimization Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Route Efficiency</span>
            <span className="font-medium">{totalOptimization}%</span>
          </div>
          <Progress value={totalOptimization} className="h-2" />
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3 text-green-600" />
            <span className="text-green-600">+12% this week</span>
          </div>
        </div>

        {/* Urgent Stops */}
        {urgentStops.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Priority Stops
            </h4>
            <div className="space-y-2">
              {urgentStops.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate">{item.machineName}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="text-center">
            <div className="text-lg font-semibold">6</div>
            <div className="text-xs text-muted-foreground">Active Routes</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold flex items-center justify-center gap-1">
              <Clock className="h-4 w-4" />
              3.2h
            </div>
            <div className="text-xs text-muted-foreground">Avg Time</div>
          </div>
        </div>

        {/* Quick Action */}
        <Button asChild className="w-full" size="sm">
          <Link to="/routes">
            <Zap className="h-4 w-4 mr-2" />
            Optimize Routes
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}