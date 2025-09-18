import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Truck, Zap, AlertTriangle } from 'lucide-react';
import { useInventoryAnalytics } from '@/hooks/useInventoryAnalytics';
import { useToast } from '@/hooks/use-toast';

interface OptimizedRoute {
  id: string;
  name: string;
  priority: 'high' | 'medium' | 'low';
  stops: {
    locationName: string;
    address: string;
    urgency: 'critical' | 'low' | 'restock';
    estimatedTime: string;
    distance: string;
  }[];
  totalTime: string;
  totalDistance: string;
  fuelEfficiency: number;
}

export function SmartRouteOptimizer() {
  const { data: inventoryData } = useInventoryAnalytics();
  const { toast } = useToast();
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedRoutes, setOptimizedRoutes] = useState<OptimizedRoute[]>([]);

  const handleOptimizeRoutes = async () => {
    setOptimizing(true);
    
    // Simulate AI route optimization based on inventory data
    setTimeout(() => {
      const routes: OptimizedRoute[] = [
        {
          id: '1',
          name: 'Critical Restock Route',
          priority: 'high',
          stops: [
            {
              locationName: 'Downtown Medical Center',
              address: '123 Health St',
              urgency: 'critical',
              estimatedTime: '45 min',
              distance: '12 mi'
            },
            {
              locationName: 'University Campus',
              address: '456 College Ave',
              urgency: 'low',
              estimatedTime: '30 min',
              distance: '8 mi'
            },
            {
              locationName: 'Tech Park Building A',
              address: '789 Innovation Dr',
              urgency: 'restock',
              estimatedTime: '25 min',
              distance: '6 mi'
            }
          ],
          totalTime: '2h 15m',
          totalDistance: '26 miles',
          fuelEfficiency: 94
        },
        {
          id: '2',
          name: 'Shopping District Route',
          priority: 'medium',
          stops: [
            {
              locationName: 'Metro Mall',
              address: '321 Shop Blvd',
              urgency: 'restock',
              estimatedTime: '35 min',
              distance: '15 mi'
            },
            {
              locationName: 'Grocery Plaza',
              address: '654 Market St',
              urgency: 'low',
              estimatedTime: '20 min',
              distance: '4 mi'
            }
          ],
          totalTime: '1h 30m',
          totalDistance: '19 miles',
          fuelEfficiency: 87
        }
      ];
      
      setOptimizedRoutes(routes);
      setOptimizing(false);
      
      toast({
        title: "Routes Optimized",
        description: `Generated ${routes.length} optimized routes based on current inventory levels and priority`,
      });
    }, 2000);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'low': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'restock': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'low': return <MapPin className="h-4 w-4 text-muted-foreground" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Optimization Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Smart Route Optimization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Optimize routes based on inventory levels, priorities, and location proximity
              </p>
              {inventoryData && (
                <p className="text-xs text-muted-foreground">
                  Found {inventoryData.criticalItems.length} critical inventory alerts
                </p>
              )}
            </div>
            <Button 
              onClick={handleOptimizeRoutes}
              disabled={optimizing}
              className="flex items-center gap-2"
            >
              {optimizing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Optimize Routes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Optimized Routes */}
      {optimizedRoutes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Optimized Routes</h3>
          {optimizedRoutes.map((route) => (
            <Card key={route.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getPriorityIcon(route.priority)}
                    {route.name}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {route.totalTime}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {route.totalDistance}
                    </div>
                    <div className="flex items-center gap-1">
                      <Truck className="h-4 w-4" />
                      {route.fuelEfficiency}% efficient
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {route.stops.map((stop, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{stop.locationName}</p>
                          <p className="text-sm text-muted-foreground">{stop.address}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getUrgencyColor(stop.urgency)}>
                          {stop.urgency}
                        </Badge>
                        <div className="text-sm text-muted-foreground">
                          {stop.estimatedTime} • {stop.distance}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="default" size="sm">
                    Start Route
                  </Button>
                  <Button variant="outline" size="sm">
                    Assign Driver
                  </Button>
                  <Button variant="outline" size="sm">
                    Edit Route
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}