import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, Navigation, Route, Clock, 
  Truck, Target, AlertTriangle, CheckCircle,
  Play, Pause, Square, Zap, Timer
} from 'lucide-react';

export const GPSTrackingSystem = () => {
  const [trackingActive, setTrackingActive] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if (trackingActive && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.error('GPS Error:', error),
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [trackingActive]);

  const activeRoutes = [
    {
      id: 'R001',
      driver: 'John Smith',
      vehicle: 'Truck-01',
      status: 'in-progress',
      progress: 65,
      currentStop: 'Downtown Office',
      nextStop: 'University Campus',
      eta: '2:45 PM',
      stopsCompleted: 4,
      totalStops: 8,
      distance: '12.3 miles',
      speed: '35 mph'
    },
    {
      id: 'R002',
      driver: 'Sarah Johnson',
      vehicle: 'Van-03',
      status: 'delayed',
      progress: 30,
      currentStop: 'Hospital Lobby',
      nextStop: 'Shopping Mall',
      eta: '3:15 PM',
      stopsCompleted: 2,
      totalStops: 6,
      distance: '8.7 miles',
      speed: '28 mph'
    },
    {
      id: 'R003',
      driver: 'Mike Chen',
      vehicle: 'Truck-02',
      status: 'completed',
      progress: 100,
      currentStop: 'Base',
      nextStop: '-',
      eta: 'Completed',
      stopsCompleted: 10,
      totalStops: 10,
      distance: '24.8 miles',
      speed: '0 mph'
    }
  ];

  const geofenceAlerts = [
    {
      id: 1,
      type: 'departure',
      location: 'Downtown Office',
      driver: 'John Smith',
      time: '2:10 PM',
      status: 'normal'
    },
    {
      id: 2,
      type: 'arrival',
      location: 'University Campus',
      driver: 'Sarah Johnson',
      time: '1:45 PM',
      status: 'early'
    },
    {
      id: 3,
      type: 'delay',
      location: 'Hospital Lobby',
      driver: 'Mike Chen',
      time: '1:30 PM',
      status: 'warning'
    }
  ];

  const trackingStats = [
    { label: 'Active Vehicles', value: '8', change: '+2', icon: Truck },
    { label: 'Routes in Progress', value: '5', change: '0', icon: Route },
    { label: 'Avg Speed', value: '32 mph', change: '+3', icon: Zap },
    { label: 'On-Time Rate', value: '87%', change: '+5%', icon: Timer }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'delayed': return 'bg-red-100 text-red-800 border-red-200';
      case 'early': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'departure': return Navigation;
      case 'arrival': return Target;
      case 'delay': return AlertTriangle;
      default: return MapPin;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tracking Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {trackingStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <Badge variant="secondary" className="text-xs">
                    {stat.change}
                  </Badge>
                </div>
                <stat.icon className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* GPS Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              GPS Tracking Control
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={trackingActive ? 'default' : 'outline'}>
                {trackingActive ? 'Active' : 'Inactive'}
              </Badge>
              <Button
                size="sm"
                variant={trackingActive ? 'destructive' : 'default'}
                onClick={() => setTrackingActive(!trackingActive)}
              >
                {trackingActive ? (
                  <>
                    <Square className="h-4 w-4 mr-2" />
                    Stop Tracking
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Tracking
                  </>
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentLocation ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Current Position</h4>
                <p className="text-sm text-muted-foreground">
                  Lat: {currentLocation.lat.toFixed(6)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Lng: {currentLocation.lng.toFixed(6)}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Tracking Status</h4>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm">Real-time tracking active</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {trackingActive 
                  ? 'Acquiring GPS signal...' 
                  : 'Click "Start Tracking" to begin GPS monitoring'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="routes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="routes">Active Routes</TabsTrigger>
          <TabsTrigger value="alerts">Geofence Alerts</TabsTrigger>
          <TabsTrigger value="history">Tracking History</TabsTrigger>
        </TabsList>

        <TabsContent value="routes" className="space-y-4">
          <div className="space-y-4">
            {activeRoutes.map((route) => (
              <Card key={route.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Truck className="h-6 w-6 text-primary" />
                      <div>
                        <h3 className="font-semibold">{route.driver}</h3>
                        <p className="text-sm text-muted-foreground">
                          {route.vehicle} • Route {route.id}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(route.status)}>
                      {route.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium mb-1">Current Stop</p>
                      <p className="text-sm text-muted-foreground">{route.currentStop}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Next Stop</p>
                      <p className="text-sm text-muted-foreground">{route.nextStop}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">ETA</p>
                      <p className="text-sm text-muted-foreground">{route.eta}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress: {route.stopsCompleted}/{route.totalStops} stops</span>
                      <span>{route.progress}%</span>
                    </div>
                    <Progress value={route.progress} className="h-2" />
                  </div>

                  <div className="flex justify-between text-sm text-muted-foreground mt-3">
                    <span>Distance: {route.distance}</span>
                    <span>Speed: {route.speed}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="space-y-3">
            {geofenceAlerts.map((alert) => {
              const AlertIcon = getAlertIcon(alert.type);
              return (
                <Card key={alert.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertIcon className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium capitalize">
                            {alert.type} Alert
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {alert.driver} at {alert.location}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(alert.status)}>
                          {alert.status}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {alert.time}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Route History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Historical tracking data and route analytics would be displayed here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};