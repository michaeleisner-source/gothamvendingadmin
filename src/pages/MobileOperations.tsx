import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Smartphone, MapPin, RefreshCw, Truck } from 'lucide-react';
import { OfflineSyncManager } from '@/components/mobile/OfflineSyncManager';
import { GPSTrackingSystem } from '@/components/mobile/GPSTrackingSystem';

export default function MobileOperations() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Mobile & Field Operations</h1>
        <p className="text-muted-foreground mt-2">
          Mobile-first field operations with offline sync and GPS tracking capabilities
        </p>
      </div>

      <Tabs defaultValue="offline-sync" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="offline-sync" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Offline Sync
          </TabsTrigger>
          <TabsTrigger value="gps-tracking" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            GPS Tracking
          </TabsTrigger>
        </TabsList>

        <TabsContent value="offline-sync">
          <OfflineSyncManager />
        </TabsContent>

        <TabsContent value="gps-tracking">
          <GPSTrackingSystem />
        </TabsContent>
      </Tabs>
    </div>
  );
}