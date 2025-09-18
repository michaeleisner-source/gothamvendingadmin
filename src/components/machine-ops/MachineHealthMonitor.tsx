import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Thermometer,
  Zap,
  TrendingUp,
  Wrench
} from 'lucide-react';
import { useSupabaseQuery } from '@/hooks/useOptimizedQuery';

interface MachineHealth {
  id: string;
  name: string;
  location: string;
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  uptime: number;
  temperature: number;
  powerConsumption: number;
  salesVelocity: number;
  lastMaintenance: string;
  nextMaintenance: string;
  alerts: string[];
}

export function MachineHealthMonitor() {
  // Mock data - replace with real Supabase query
  const mockMachines: MachineHealth[] = [
    {
      id: '1',
      name: 'VM-001',
      location: 'Downtown Office',
      status: 'healthy',
      uptime: 98.5,
      temperature: 72,
      powerConsumption: 145,
      salesVelocity: 85,
      lastMaintenance: '2024-01-15',
      nextMaintenance: '2024-04-15',
      alerts: []
    },
    {
      id: '2',
      name: 'VM-002',
      location: 'Hospital Lobby',
      status: 'warning',
      uptime: 92.1,
      temperature: 78,
      powerConsumption: 165,
      salesVelocity: 72,
      lastMaintenance: '2024-01-10',
      nextMaintenance: '2024-04-10',
      alerts: ['High temperature detected', 'Coin mechanism slow']
    },
    {
      id: '3',
      name: 'VM-003',
      location: 'University Campus',
      status: 'critical',
      uptime: 87.3,
      temperature: 85,
      powerConsumption: 180,
      salesVelocity: 45,
      lastMaintenance: '2023-12-20',
      nextMaintenance: '2024-03-20',
      alerts: ['Overheating warning', 'Bill acceptor malfunction', 'Low inventory']
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'offline': return <Activity className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Healthy</p>
              <div className="text-2xl font-bold">1</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Warning</p>
              <div className="text-2xl font-bold">1</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Critical</p>
              <div className="text-2xl font-bold">1</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Activity className="h-8 w-8 text-muted-foreground" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Offline</p>
              <div className="text-2xl font-bold">0</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {mockMachines.map((machine) => (
          <Card key={machine.id} className="relative">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {machine.name}
              </CardTitle>
              <Badge 
                variant={machine.status === 'healthy' ? 'default' : 'destructive'}
                className="flex items-center gap-1"
              >
                {getStatusIcon(machine.status)}
                {machine.status}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground mb-4">
                {machine.location}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm">
                    <Activity className="h-4 w-4 mr-2" />
                    Uptime
                  </div>
                  <div className="text-sm font-medium">{machine.uptime}%</div>
                </div>
                <Progress value={machine.uptime} className="w-full" />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm">
                    <Thermometer className="h-4 w-4 mr-2" />
                    Temperature
                  </div>
                  <div className="text-sm font-medium">{machine.temperature}°F</div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm">
                    <Zap className="h-4 w-4 mr-2" />
                    Power
                  </div>
                  <div className="text-sm font-medium">{machine.powerConsumption}W</div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Sales Velocity
                  </div>
                  <div className="text-sm font-medium">{machine.salesVelocity}%</div>
                </div>
                <Progress value={machine.salesVelocity} className="w-full" />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-2" />
                    Next Service
                  </div>
                  <div className="text-sm font-medium">
                    {new Date(machine.nextMaintenance).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              {machine.alerts.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                  <div className="text-sm font-medium text-yellow-800 mb-2">Active Alerts</div>
                  {machine.alerts.map((alert, index) => (
                    <div key={index} className="text-xs text-yellow-700 mb-1">
                      • {alert}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" className="flex-1">
                  <Wrench className="h-4 w-4 mr-1" />
                  Service
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}