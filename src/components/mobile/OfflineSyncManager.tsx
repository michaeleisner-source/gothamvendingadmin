import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Wifi, WifiOff, RefreshCw, Download, Upload, 
  CheckCircle, AlertTriangle, Clock, Database,
  Smartphone, Server, RotateCcw
} from 'lucide-react';

export const OfflineSyncManager = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'complete' | 'error'>('idle');
  const [syncProgress, setSyncProgress] = useState(0);

  useEffect(() => {
    const handleOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  const syncData = async () => {
    setSyncStatus('syncing');
    setSyncProgress(0);
    
    // Simulate sync process
    const steps = [
      'Uploading pending sales...',
      'Downloading inventory updates...',
      'Syncing route changes...',
      'Updating machine status...',
      'Finalizing sync...'
    ];
    
    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setSyncProgress(((i + 1) / steps.length) * 100);
    }
    
    setSyncStatus('complete');
    setTimeout(() => setSyncStatus('idle'), 3000);
  };

  const offlineData = [
    { 
      type: 'Sales Records', 
      count: 23, 
      lastSync: '2 hours ago',
      status: 'pending',
      size: '2.3 MB'
    },
    { 
      type: 'Inventory Updates', 
      count: 15, 
      lastSync: '45 min ago',
      status: 'synced',
      size: '892 KB'
    },
    { 
      type: 'Route Stops', 
      count: 8, 
      lastSync: '1 hour ago',
      status: 'pending',
      size: '156 KB'
    },
    { 
      type: 'Machine Status', 
      count: 12, 
      lastSync: '30 min ago',
      status: 'synced',
      size: '234 KB'
    }
  ];

  const syncSettings = [
    { 
      name: 'Auto-sync when online', 
      enabled: true, 
      description: 'Automatically sync data when connection is restored'
    },
    { 
      name: 'Background sync', 
      enabled: true, 
      description: 'Sync data in background while app is running'
    },
    { 
      name: 'WiFi only sync', 
      enabled: false, 
      description: 'Only sync when connected to WiFi'
    },
    { 
      name: 'Compress data', 
      enabled: true, 
      description: 'Compress data to reduce bandwidth usage'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'synced': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className={isOnline ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isOnline ? (
                <Wifi className="h-6 w-6 text-green-600" />
              ) : (
                <WifiOff className="h-6 w-6 text-red-600" />
              )}
              <div>
                <h3 className="font-semibold">
                  {isOnline ? 'Online' : 'Offline Mode'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isOnline 
                    ? 'Connected to server - real-time sync available'
                    : 'Working offline - data will sync when connection is restored'
                  }
                </p>
              </div>
            </div>
            {isOnline && (
              <Button 
                onClick={syncData}
                disabled={syncStatus === 'syncing'}
                className="flex items-center gap-2"
              >
                {syncStatus === 'syncing' ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
              </Button>
            )}
          </div>
          
          {syncStatus === 'syncing' && (
            <div className="mt-4">
              <Progress value={syncProgress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                Syncing data... {Math.round(syncProgress)}% complete
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Offline Data Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Offline Data Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {offlineData.map((data) => (
              <Card key={data.type} className="border-dashed">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{data.type}</h4>
                    <Badge className={getStatusColor(data.status)}>
                      {data.status === 'synced' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {data.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                      {data.status === 'error' && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {data.status}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Records:</span>
                      <span className="font-medium">{data.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span className="font-medium">{data.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last sync:</span>
                      <span className="font-medium">{data.lastSync}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sync Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Upload className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">2.8 MB</p>
            <p className="text-sm text-muted-foreground">Data uploaded today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Download className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">1.4 MB</p>
            <p className="text-sm text-muted-foreground">Data downloaded today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Smartphone className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">47</p>
            <p className="text-sm text-muted-foreground">Offline actions stored</p>
          </CardContent>
        </Card>
      </div>

      {/* Sync Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Sync Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {syncSettings.map((setting) => (
              <div key={setting.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{setting.name}</h4>
                  <p className="text-sm text-muted-foreground">{setting.description}</p>
                </div>
                <Badge variant={setting.enabled ? 'default' : 'outline'}>
                  {setting.enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};