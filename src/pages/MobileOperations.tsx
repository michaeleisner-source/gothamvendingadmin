import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Smartphone, Wifi, MapPin, Camera, Bell } from 'lucide-react';
import { OfflineSyncManager } from '@/components/mobile/OfflineSyncManager';
import { GPSTrackingSystem } from '@/components/mobile/GPSTrackingSystem';
import { CameraCapture } from '@/components/mobile/CameraCapture';
import { PushNotifications } from '@/components/mobile/PushNotifications';
import { EnhancedGPSTracker } from '@/components/mobile/EnhancedGPSTracker';

export default function MobileOperations() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Mobile & Field Operations</h1>
        <p className="text-muted-foreground mt-2">
          Mobile-first field operations with offline sync and GPS tracking capabilities
        </p>
      </div>

      <Tabs defaultValue="offline" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="offline" className="flex items-center gap-2">
            <Wifi className="h-4 w-4" />
            Offline Sync
          </TabsTrigger>
          <TabsTrigger value="gps" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            GPS Tracking
          </TabsTrigger>
          <TabsTrigger value="camera" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Camera
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="offline">
          <OfflineSyncManager />
        </TabsContent>

        <TabsContent value="gps">
          <div className="grid gap-6">
            <GPSTrackingSystem />
            <EnhancedGPSTracker />
          </div>
        </TabsContent>

        <TabsContent value="camera">
          <div className="grid gap-6">
            <CameraCapture 
              title="Document Scanner"
              onImageCapture={(url) => console.log('Captured:', url)}
            />
            <CameraCapture 
              title="Inventory Photos"
              onImageCapture={(url) => console.log('Inventory photo:', url)}
            />
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <PushNotifications />
        </TabsContent>
      </Tabs>
    </div>
  );
}