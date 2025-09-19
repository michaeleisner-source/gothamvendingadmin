import React, { useState, useEffect } from 'react';
import { Geolocation, Position } from '@capacitor/geolocation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Clock, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function EnhancedGPSTracker() {
  const [position, setPosition] = useState<Position | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [accuracy, setAccuracy] = useState<number>(0);
  const [watchId, setWatchId] = useState<string | null>(null);
  const [locationHistory, setLocationHistory] = useState<Position[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (watchId) {
        Geolocation.clearWatch({ id: watchId });
      }
    };
  }, [watchId]);

  const getCurrentPosition = async () => {
    try {
      const permissions = await Geolocation.requestPermissions();
      
      if (permissions.location === 'granted') {
        const coordinates = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000
        });
        
        setPosition(coordinates);
        setAccuracy(coordinates.coords.accuracy);
        setLocationHistory(prev => [coordinates, ...prev.slice(0, 9)]);
        
        toast({
          title: "Location Updated",
          description: `Accuracy: ${coordinates.coords.accuracy.toFixed(1)}m`
        });
      } else {
        toast({
          title: "Location Permission Denied",
          description: "Please enable location access in settings",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
      toast({
        title: "Location Error",
        description: "Failed to get current location",
        variant: "destructive"
      });
    }
  };

  const startTracking = async () => {
    try {
      const id = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 30000
        },
        (position, err) => {
          if (err) {
            console.error('Location tracking error:', err);
            return;
          }
          
          if (position) {
            setPosition(position);
            setAccuracy(position.coords.accuracy);
            setLocationHistory(prev => [position, ...prev.slice(0, 19)]);
          }
        }
      );
      
      setWatchId(id);
      setIsTracking(true);
      
      toast({
        title: "GPS Tracking Started",
        description: "Real-time location tracking enabled"
      });
    } catch (error) {
      console.error('Error starting location tracking:', error);
      toast({
        title: "Tracking Error",
        description: "Failed to start GPS tracking",
        variant: "destructive"
      });
    }
  };

  const stopTracking = async () => {
    if (watchId) {
      await Geolocation.clearWatch({ id: watchId });
      setWatchId(null);
      setIsTracking(false);
      
      toast({
        title: "GPS Tracking Stopped",
        description: "Location tracking disabled"
      });
    }
  };

  const formatCoordinate = (coord: number) => {
    return coord.toFixed(6);
  };

  const getAccuracyStatus = (accuracy: number) => {
    if (accuracy <= 5) return { status: "Excellent", variant: "default" as const };
    if (accuracy <= 15) return { status: "Good", variant: "secondary" as const };
    if (accuracy <= 50) return { status: "Fair", variant: "outline" as const };
    return { status: "Poor", variant: "destructive" as const };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Enhanced GPS Tracker
          {isTracking && (
            <Badge variant="default" className="animate-pulse">
              <Zap className="h-3 w-3 mr-1" />
              Live
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={getCurrentPosition}
            className="flex items-center gap-2"
          >
            <Navigation className="h-4 w-4" />
            Get Location
          </Button>
          
          {!isTracking ? (
            <Button 
              onClick={startTracking}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Start Tracking
            </Button>
          ) : (
            <Button 
              onClick={stopTracking}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Stop Tracking
            </Button>
          )}
        </div>

        {position && (
          <div className="space-y-3 p-3 bg-muted/50 rounded">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Location</span>
              <Badge {...getAccuracyStatus(accuracy)}>
                {getAccuracyStatus(accuracy).status} (±{accuracy.toFixed(1)}m)
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Latitude:</span>
                <div className="font-mono">{formatCoordinate(position.coords.latitude)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Longitude:</span>
                <div className="font-mono">{formatCoordinate(position.coords.longitude)}</div>
              </div>
            </div>

            {position.coords.altitude && (
              <div className="text-sm">
                <span className="text-muted-foreground">Altitude:</span>
                <span className="ml-2 font-mono">{position.coords.altitude.toFixed(1)}m</span>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Last updated: {new Date(position.timestamp).toLocaleTimeString()}
            </div>
          </div>
        )}

        {locationHistory.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Location History</h4>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {locationHistory.slice(0, 5).map((loc, index) => (
                <div key={index} className="p-2 bg-muted/30 rounded text-xs">
                  <div className="flex justify-between items-center">
                    <span>{formatCoordinate(loc.coords.latitude)}, {formatCoordinate(loc.coords.longitude)}</span>
                    <span className="text-muted-foreground">
                      {new Date(loc.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    Accuracy: ±{loc.coords.accuracy.toFixed(1)}m
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}