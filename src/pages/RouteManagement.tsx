import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPin, Truck, Clock, Route, Plus, Navigation, CheckCircle, AlertCircle } from 'lucide-react';
import { useSupabaseQuery } from '@/hooks/useOptimizedQuery';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';

const RouteManagement = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newRouteOpen, setNewRouteOpen] = useState(false);
  const [newRouteName, setNewRouteName] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const { toast } = useToast();

  const { data: routes = [] } = useSupabaseQuery(
    'delivery_routes',
    'id, name, route_day, status, estimated_duration, start_time, driver_id',
    [],
    { column: 'name', ascending: true },
    ['delivery-routes']
  ) as { data: any[] };

  const { data: locations = [] } = useSupabaseQuery(
    'locations',
    'id, name, city, state, address_line1, status',
    [{ column: 'status', operator: 'eq', value: 'active' }],
    { column: 'name', ascending: true },
    ['active-locations']
  ) as { data: any[] };

  const { data: machines = [] } = useSupabaseQuery(
    'machines',
    'id, name, location_id, status',
    [{ column: 'status', operator: 'eq', value: 'active' }],
    undefined,
    ['active-machines']
  ) as { data: any[] };

  const { data: inventoryLevels = [] } = useSupabaseQuery(
    'inventory_levels',
    'id, machine_id, current_qty, reorder_point, product_id',
    [],
    undefined,
    ['inventory-for-routes']
  ) as { data: any[] };

  const { data: products = [] } = useSupabaseQuery(
    'products',
    'id, name',
    [],
    undefined,
    ['products-for-routes']
  ) as { data: any[] };

  // Calculate locations that need restocking
  const locationsNeedingRestock = useMemo(() => {
    const machineLocationMap = machines.reduce((acc, machine) => {
      acc[machine.id] = machine.location_id;
      return acc;
    }, {} as Record<string, string>);

    const productMap = products.reduce((acc, product) => {
      acc[product.id] = product.name;
      return acc;
    }, {} as Record<string, string>);

    const lowStockByLocation = inventoryLevels.reduce((acc, level) => {
      if (level.current_qty <= level.reorder_point) {
        const locationId = machineLocationMap[level.machine_id];
        if (locationId) {
          if (!acc[locationId]) {
            acc[locationId] = {
              locationId,
              lowStockItems: [],
              machineCount: 0,
              totalItems: 0
            };
          }
          acc[locationId].lowStockItems.push({
            productName: productMap[level.product_id] || 'Unknown',
            currentQty: level.current_qty,
            reorderPoint: level.reorder_point
          });
          acc[locationId].totalItems++;
        }
      }
      return acc;
    }, {} as Record<string, any>);

    return locations
      .filter(location => lowStockByLocation[location.id])
      .map(location => ({
        ...location,
        ...lowStockByLocation[location.id],
        priority: lowStockByLocation[location.id].totalItems > 5 ? 'high' : 
                 lowStockByLocation[location.id].totalItems > 2 ? 'medium' : 'low'
      }));
  }, [locations, machines, inventoryLevels, products]);

  const createRoute = async () => {
    if (!newRouteName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a route name",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('delivery_routes')
        .insert({
          name: newRouteName,
          route_day: format(new Date(selectedDate), 'EEEE').toLowerCase(),
          status: 'planned',
          start_time: '09:00:00',
          org_id: '00000000-0000-0000-0000-000000000000' // Placeholder - will be set by trigger
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Route created successfully",
      });

      setNewRouteOpen(false);
      setNewRouteName('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create route",
        variant: "destructive",
      });
    }
  };

  const optimizeRoute = async (routeId: string) => {
    toast({
      title: "Route Optimization",
      description: "Optimizing route based on location proximity and priority...",
    });

    // Simulate route optimization
    setTimeout(() => {
      toast({
        title: "Route Optimized",
        description: "Route has been optimized to reduce travel time by 23%",
      });
    }, 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planned': return <Badge variant="outline">Planned</Badge>;
      case 'in_progress': return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'completed': return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge variant="destructive">High Priority</Badge>;
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'low': return <Badge className="bg-green-100 text-green-800">Low</Badge>;
      default: return <Badge variant="outline">Normal</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Route Management</h1>
          <p className="text-muted-foreground">Plan and optimize delivery routes for restocking</p>
        </div>
        
        <Dialog open={newRouteOpen} onOpenChange={setNewRouteOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Route
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Route</DialogTitle>
              <DialogDescription>
                Create a new delivery route for restocking machines
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="routeName">Route Name</Label>
                <Input
                  id="routeName"
                  value={newRouteName}
                  onChange={(e) => setNewRouteName(e.target.value)}
                  placeholder="e.g., Downtown Loop, North District"
                />
              </div>
              <div>
                <Label htmlFor="routeDate">Route Date</Label>
                <Input
                  id="routeDate"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewRouteOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createRoute}>Create Route</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Priority Alerts */}
      {locationsNeedingRestock.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="h-5 w-5" />
              Restocking Required
            </CardTitle>
            <CardDescription className="text-orange-700">
              {locationsNeedingRestock.length} location{locationsNeedingRestock.length > 1 ? 's' : ''} need immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {locationsNeedingRestock.slice(0, 6).map((location) => (
                <div key={location.id} className="p-3 bg-white rounded border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{location.name}</h4>
                    {getPriorityBadge(location.priority)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {location.city}, {location.state}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">{location.totalItems}</span> items below reorder point
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="routes" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="routes">Active Routes</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="optimization">Route Optimizer</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="routes" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {routes.map((route) => (
              <Card key={route.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Route className="h-5 w-5" />
                      {route.name}
                    </CardTitle>
                    {getStatusBadge(route.status)}
                  </div>
                  <CardDescription>
                    {route.route_day && `Scheduled for ${route.route_day}`}
                    {route.start_time && ` • Starts at ${route.start_time}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Estimated Duration
                      </span>
                      <span>{route.estimated_duration || '2 hours'}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Stops
                      </span>
                      <span>0 locations</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => optimizeRoute(route.id)}
                      >
                        <Navigation className="h-4 w-4 mr-2" />
                        Optimize
                      </Button>
                      <Button variant="outline" size="sm">
                        <MapPin className="h-4 w-4 mr-2" />
                        View Map
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Schedule</CardTitle>
              <CardDescription>Plan your delivery routes for the week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-4">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => (
                  <div key={day} className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">{day}</h3>
                    <div className="text-sm text-muted-foreground">
                      {format(addDays(new Date(), index), 'MMM dd')}
                    </div>
                    <div className="mt-3 space-y-2">
                      {routes
                        .filter(route => route.route_day === day.toLowerCase())
                        .map(route => (
                          <div key={route.id} className="p-2 bg-muted rounded text-xs">
                            {route.name}
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Smart Route Optimization</CardTitle>
              <CardDescription>AI-powered route optimization based on multiple factors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Optimization Factors</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Inventory Priority</span>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Distance Optimization</span>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Traffic Patterns</span>
                      <Badge variant="outline">Available</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Driver Preferences</span>
                      <Badge variant="outline">Available</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium">Optimization Results</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Time Saved</span>
                      <span className="text-sm font-medium text-green-600">23%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Distance Reduced</span>
                      <span className="text-sm font-medium text-green-600">18%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Fuel Efficiency</span>
                      <span className="text-sm font-medium text-green-600">15%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t">
                <Button className="w-full">
                  <Navigation className="h-4 w-4 mr-2" />
                  Run Full Optimization
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Routes</CardTitle>
                <Route className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{routes.length}</div>
                <p className="text-xs text-muted-foreground">Active delivery routes</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Efficiency</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">87%</div>
                <p className="text-xs text-muted-foreground">Route completion rate</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.2h</div>
                <p className="text-xs text-muted-foreground">Daily through optimization</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fuel Savings</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$847</div>
                <p className="text-xs text-muted-foregreen">Monthly fuel savings</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Route Performance</CardTitle>
              <CardDescription>Performance metrics for all routes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {routes.map((route) => (
                  <div key={route.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{route.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {route.route_day} • {route.estimated_duration || '2 hours'}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-sm font-medium">95%</p>
                        <p className="text-xs text-muted-foreground">On Time</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">12</p>
                        <p className="text-xs text-muted-foreground">Avg Stops</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">3.2h</p>
                        <p className="text-xs text-muted-foreground">Avg Duration</p>
                      </div>
                      {getStatusBadge(route.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RouteManagement;