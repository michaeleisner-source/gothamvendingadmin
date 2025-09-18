import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Clock, Navigation, CheckCircle, AlertCircle, Truck, Package, Camera, MessageSquare } from 'lucide-react';
import { useSupabaseQuery } from '@/hooks/useOptimizedQuery';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const DriverDashboard = () => {
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: routes = [] } = useSupabaseQuery(
    'delivery_routes',
    'id, name, route_day, status, estimated_duration, start_time',
    [{ column: 'status', operator: 'in', value: '("planned","in_progress")' }],
    { column: 'start_time', ascending: true },
    ['driver-routes']
  ) as { data: any[] };

  const { data: locations = [] } = useSupabaseQuery(
    'locations',
    'id, name, city, state, address_line1, address_line2, postal_code, contact_name, contact_phone',
    [{ column: 'status', operator: 'eq', value: 'active' }],
    { column: 'name', ascending: true },
    ['driver-locations']
  ) as { data: any[] };

  // Mock route stops data (in a real app, this would come from a route_stops table)
  const mockRouteStops = [
    { id: 1, locationId: locations[0]?.id, sequence: 1, status: 'pending', estimatedTime: '09:30', actualTime: null },
    { id: 2, locationId: locations[1]?.id, sequence: 2, status: 'pending', estimatedTime: '10:15', actualTime: null },
    { id: 3, locationId: locations[2]?.id, sequence: 3, status: 'pending', estimatedTime: '11:00', actualTime: null },
  ];

  const [routeStops, setRouteStops] = useState(mockRouteStops);
  const [currentStop, setCurrentStop] = useState(0);

  const todaysRoute = routes.find(route => route.route_day === format(new Date(), 'EEEE').toLowerCase());
  const completedStops = routeStops.filter(stop => stop.status === 'completed').length;
  const totalStops = routeStops.length;
  const progressPercentage = totalStops > 0 ? (completedStops / totalStops) * 100 : 0;

  const startRoute = async (routeId: string) => {
    try {
      const { error } = await supabase
        .from('delivery_routes')
        .update({ status: 'in_progress' })
        .eq('id', routeId);

      if (error) throw error;

      toast({
        title: "Route Started",
        description: "Your delivery route has been started. Safe driving!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start route",
        variant: "destructive",
      });
    }
  };

  const completeStop = async (stopId: number) => {
    const updatedStops = routeStops.map(stop => 
      stop.id === stopId 
        ? { ...stop, status: 'completed', actualTime: format(new Date(), 'HH:mm') }
        : stop
    );
    setRouteStops(updatedStops);
    setCurrentStop(currentStop + 1);
    setConfirmDialogOpen(false);
    setDeliveryNotes('');
    setPhotoUrl('');

    toast({
      title: "Stop Completed",
      description: "Delivery confirmed and logged successfully",
    });
  };

  const getLocationById = (locationId: string) => {
    return locations.find(loc => loc.id === locationId);
  };

  const getCurrentStopData = () => {
    if (currentStop >= routeStops.length) return null;
    const stop = routeStops[currentStop];
    const location = getLocationById(stop.locationId);
    return { stop, location };
  };

  const currentStopData = getCurrentStopData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Driver Dashboard</h1>
          <p className="text-muted-foreground">Manage your delivery routes and track progress</p>
        </div>
        <Badge className="bg-green-100 text-green-800 text-sm px-3 py-1">
          <Truck className="h-4 w-4 mr-2" />
          On Duty
        </Badge>
      </div>

      {/* Today's Route Overview */}
      {todaysRoute && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-blue-800">Today's Route: {todaysRoute.name}</CardTitle>
              <Badge variant={todaysRoute.status === 'in_progress' ? 'default' : 'outline'}>
                {todaysRoute.status === 'in_progress' ? 'In Progress' : 'Ready to Start'}
              </Badge>
            </div>
            <CardDescription className="text-blue-700">
              Scheduled start: {todaysRoute.start_time} • Est. duration: {todaysRoute.estimated_duration || '4 hours'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="text-2xl font-bold text-blue-800">
                {completedStops} / {totalStops} stops completed
              </div>
              {todaysRoute.status !== 'in_progress' && (
                <Button onClick={() => startRoute(todaysRoute.id)}>
                  <Navigation className="h-4 w-4 mr-2" />
                  Start Route
                </Button>
              )}
            </div>
            <Progress value={progressPercentage} className="mb-2" />
            <p className="text-sm text-blue-600">{progressPercentage.toFixed(0)}% complete</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="current">Current Stop</TabsTrigger>
          <TabsTrigger value="route">Full Route</TabsTrigger>
          <TabsTrigger value="navigation">Navigation</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          {currentStopData ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Stop {currentStop + 1}: {currentStopData.location?.name}
                  </CardTitle>
                  <Badge className="bg-orange-100 text-orange-800">Current</Badge>
                </div>
                <CardDescription>
                  Estimated arrival: {currentStopData.stop.estimatedTime}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Location Details</h4>
                    <div className="space-y-2 text-sm">
                      <p>{currentStopData.location?.address_line1}</p>
                      {currentStopData.location?.address_line2 && (
                        <p>{currentStopData.location.address_line2}</p>
                      )}
                      <p>{currentStopData.location?.city}, {currentStopData.location?.state} {currentStopData.location?.postal_code}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Contact Information</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Contact:</strong> {currentStopData.location?.contact_name}</p>
                      <p><strong>Phone:</strong> {currentStopData.location?.contact_phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <Navigation className="h-4 w-4 mr-2" />
                    Navigate
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Call Contact
                  </Button>
                  <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="flex-1">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Complete Stop
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Complete Delivery</DialogTitle>
                        <DialogDescription>
                          Confirm completion of delivery at {currentStopData.location?.name}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="notes">Delivery Notes (Optional)</Label>
                          <Textarea
                            id="notes"
                            value={deliveryNotes}
                            onChange={(e) => setDeliveryNotes(e.target.value)}
                            placeholder="Any special notes about this delivery..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="photo">Photo URL (Optional)</Label>
                          <Input
                            id="photo"
                            type="url"
                            value={photoUrl}
                            onChange={(e) => setPhotoUrl(e.target.value)}
                            placeholder="https://example.com/delivery-photo.jpg"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Upload a photo as proof of delivery
                          </p>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={() => completeStop(currentStopData.stop.id)}>
                          Confirm Completion
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <h3 className="text-lg font-medium mb-2">Route Complete!</h3>
                <p className="text-muted-foreground">
                  All stops have been completed successfully.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="route" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Full Route Overview</CardTitle>
              <CardDescription>All stops for today's delivery route</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {routeStops.map((stop, index) => {
                  const location = getLocationById(stop.locationId);
                  const isCompleted = stop.status === 'completed';
                  const isCurrent = index === currentStop && !isCompleted;
                  
                  return (
                    <div
                      key={stop.id}
                      className={`flex items-center gap-4 p-4 border rounded-lg ${
                        isCurrent ? 'border-blue-500 bg-blue-50' : 
                        isCompleted ? 'border-green-500 bg-green-50' : 'border-gray-200'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isCompleted ? 'bg-green-600 text-white' :
                        isCurrent ? 'bg-blue-600 text-white' : 'bg-gray-300'
                      }`}>
                        {isCompleted ? <CheckCircle className="h-4 w-4" /> : stop.sequence}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-medium">{location?.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {location?.city}, {location?.state}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {isCompleted ? stop.actualTime : stop.estimatedTime}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isCompleted ? 'Completed' : 'Estimated'}
                        </p>
                      </div>
                      
                      <Badge variant={
                        isCompleted ? 'default' :
                        isCurrent ? 'secondary' : 'outline'
                      }>
                        {isCompleted ? 'Done' : isCurrent ? 'Current' : 'Pending'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="navigation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>GPS Navigation</CardTitle>
              <CardDescription>Turn-by-turn directions and route optimization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <div className="text-center">
                  <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-muted-foreground">Map integration would appear here</p>
                  <p className="text-sm text-muted-foreground">
                    Connect with Google Maps, Apple Maps, or Waze
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <Clock className="h-6 w-6 mx-auto mb-2" />
                      <p className="text-sm font-medium">ETA to Next Stop</p>
                      <p className="text-lg font-bold">12 min</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <Navigation className="h-6 w-6 mx-auto mb-2" />
                      <p className="text-sm font-medium">Distance</p>
                      <p className="text-lg font-bold">3.2 mi</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                      <p className="text-sm font-medium">Traffic</p>
                      <p className="text-lg font-bold text-green-600">Light</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Delivery History</CardTitle>
              <CardDescription>Recent delivery completions and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
                        <p className="text-sm font-medium">Completed Today</p>
                        <p className="text-lg font-bold">{completedStops}</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                        <p className="text-sm font-medium">On-Time Rate</p>
                        <p className="text-lg font-bold">94%</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <Package className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                        <p className="text-sm font-medium">This Week</p>
                        <p className="text-lg font-bold">47 stops</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Recent Deliveries</h4>
                  <div className="space-y-2">
                    {routeStops.filter(stop => stop.status === 'completed').map((stop) => {
                      const location = getLocationById(stop.locationId);
                      return (
                        <div key={stop.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <p className="font-medium">{location?.name}</p>
                            <p className="text-sm text-muted-foreground">{location?.city}, {location?.state}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{stop.actualTime}</p>
                            <Badge className="bg-green-100 text-green-800">Completed</Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DriverDashboard;