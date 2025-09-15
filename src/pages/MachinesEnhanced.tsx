import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Factory, AlertTriangle, CheckCircle, Wrench, DollarSign, 
  TrendingUp, Search, Plus, Activity, Zap 
} from 'lucide-react';
import { MachinesList } from '@/components/MachinesList';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MachineMetrics {
  total: number;
  online: number;
  offline: number;
  maintenance: number;
  revenue24h: number;
  avgUptime: number;
  alertCount: number;
}

const MachinesEnhanced = () => {
  const [metrics, setMetrics] = useState<MachineMetrics>({
    total: 0,
    online: 0,
    offline: 0,
    maintenance: 0,
    revenue24h: 0,
    avgUptime: 95.5,
    alertCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const [machinesRes, salesRes] = await Promise.all([
        supabase.from('machines').select('status').order('created_at'),
        supabase
          .from('sales')
          .select('unit_price_cents, qty')
          .gte('occurred_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ]);

      const machines = machinesRes.data || [];
      const sales = salesRes.data || [];

      // Calculate metrics
      const total = machines.length;
      const online = machines.filter(m => m.status === 'ONLINE').length;
      const offline = machines.filter(m => m.status === 'OFFLINE').length;
      const maintenance = machines.filter(m => m.status === 'MAINTENANCE' || m.status === 'SERVICE').length;
      
      const revenue24h = sales.reduce((sum, s) => sum + (s.unit_price_cents * s.qty), 0) / 100;

      setMetrics({
        total,
        online,
        offline,
        maintenance,
        revenue24h,
        avgUptime: total > 0 ? Math.round((online / total) * 100 * 10) / 10 : 0,
        alertCount: offline + maintenance
      });
    } catch (error) {
      toast.error('Failed to load machine metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Machine Operations</h1>
          <p className="text-muted-foreground">Monitor and manage your vending machine fleet</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Machine
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Machines</p>
                <p className="text-2xl font-bold">{metrics.total}</p>
              </div>
              <Factory className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Online</p>
                <p className="text-2xl font-bold text-green-800">{metrics.online}</p>
                <p className="text-xs text-green-600">{metrics.avgUptime}% uptime</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700">Offline</p>
                <p className="text-2xl font-bold text-red-800">{metrics.offline}</p>
                <p className="text-xs text-red-600">Need attention</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">24h Revenue</p>
                <p className="text-2xl font-bold">${metrics.revenue24h.toFixed(0)}</p>
                <p className="text-xs text-green-600">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  Active sales
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fleet Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Fleet Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-green-600">{metrics.online}</div>
              <p className="text-sm text-muted-foreground">Operational</p>
              <div className="w-full bg-green-100 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${metrics.total > 0 ? (metrics.online / metrics.total) * 100 : 0}%` }}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-3xl font-bold text-orange-600">{metrics.maintenance}</div>
              <p className="text-sm text-muted-foreground">Maintenance</p>
              <div className="w-full bg-orange-100 rounded-full h-2">
                <div 
                  className="bg-orange-600 h-2 rounded-full" 
                  style={{ width: `${metrics.total > 0 ? (metrics.maintenance / metrics.total) * 100 : 0}%` }}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-3xl font-bold text-red-600">{metrics.offline}</div>
              <p className="text-sm text-muted-foreground">Offline</p>
              <div className="w-full bg-red-100 rounded-full h-2">
                <div 
                  className="bg-red-600 h-2 rounded-full" 
                  style={{ width: `${metrics.total > 0 ? (metrics.offline / metrics.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {metrics.alertCount > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">{metrics.alertCount} machines need attention</span>
              </div>
              <p className="text-sm text-red-600 mt-1">
                Review offline and maintenance machines for immediate action
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search machines by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Status:</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ONLINE">Online</SelectItem>
                  <SelectItem value="OFFLINE">Offline</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Machines List */}
      <MachinesList />
    </div>
  );
};

export default MachinesEnhanced;