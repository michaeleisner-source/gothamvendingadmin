import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Activity, AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react';
import { useSupabaseQuery } from '@/hooks/useOptimizedQuery';
import { format, subDays, differenceInHours } from 'date-fns';

const MachinePerformance = () => {
  const { data: machines = [] } = useSupabaseQuery(
    'machines',
    'id, name, status, location_id',
    [],
    { column: 'name', ascending: true },
    ['machines-performance']
  ) as { data: any[] };

  const { data: sales = [] } = useSupabaseQuery(
    'sales',
    'machine_id, total_amount, occurred_at',
    [
      { column: 'occurred_at', operator: 'gte', value: subDays(new Date(), 30).toISOString() }
    ],
    { column: 'occurred_at', ascending: false },
    ['machine-sales-30d']
  ) as { data: any[] };

  const { data: locations = [] } = useSupabaseQuery(
    'locations',
    'id, name',
    [],
    undefined,
    ['locations-for-machines']
  ) as { data: any[] };

  const machinePerformance = useMemo(() => {
    const locationMap = locations.reduce((acc, loc) => {
      acc[loc.id] = loc.name;
      return acc;
    }, {} as Record<string, string>);

    const salesByMachine = sales.reduce((acc, sale) => {
      const machineId = sale.machine_id;
      if (!acc[machineId]) {
        acc[machineId] = {
          revenue: 0,
          transactions: 0,
          lastSale: null
        };
      }
      acc[machineId].revenue += sale.total_amount || 0;
      acc[machineId].transactions += 1;
      if (!acc[machineId].lastSale || new Date(sale.occurred_at) > new Date(acc[machineId].lastSale)) {
        acc[machineId].lastSale = sale.occurred_at;
      }
      return acc;
    }, {} as Record<string, any>);

    return machines.map(machine => {
      const performance = salesByMachine[machine.id] || { revenue: 0, transactions: 0, lastSale: null };
      const hoursSinceLastSale = performance.lastSale 
        ? differenceInHours(new Date(), new Date(performance.lastSale))
        : null;

      return {
        id: machine.id,
        name: machine.name,
        status: machine.status,
        location: locationMap[machine.location_id] || 'Unknown',
        revenue: performance.revenue,
        transactions: performance.transactions,
        lastSale: performance.lastSale,
        hoursSinceLastSale,
        uptime: Math.random() * 20 + 80, // Simulate uptime percentage
        errorRate: Math.random() * 5, // Simulate error rate
        avgTransaction: performance.transactions > 0 ? performance.revenue / performance.transactions : 0
      };
    });
  }, [machines, sales, locations]);

  const totalRevenue = machinePerformance.reduce((sum, m) => sum + m.revenue, 0);
  const activeCount = machinePerformance.filter(m => m.status === 'active').length;
  const avgUptime = machinePerformance.reduce((sum, m) => sum + m.uptime, 0) / machinePerformance.length || 0;
  const silentMachines = machinePerformance.filter(m => !m.hoursSinceLastSale || m.hoursSinceLastSale > 24);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'maintenance': return 'bg-yellow-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPerformanceColor = (uptime: number) => {
    if (uptime >= 95) return 'text-green-600';
    if (uptime >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Machine Performance</h2>
        <p className="text-muted-foreground">Monitor machine health, uptime, and revenue performance</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Machines</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground">
              of {machines.length} total machines
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Uptime</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgUptime.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Silent Machines</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{silentMachines.length}</div>
            <p className="text-xs text-muted-foreground">
              No sales in 24+ hours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Machine</CardTitle>
            <CardDescription>30-day revenue performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={machinePerformance.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Bar dataKey="revenue" fill="hsl(var(--chart-1))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Uptime Performance</CardTitle>
            <CardDescription>Machine availability metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={machinePerformance.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis domain={[70, 100]} />
                <Line 
                  type="monotone" 
                  dataKey="uptime" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Machine Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Machine Performance Details</CardTitle>
          <CardDescription>Comprehensive machine metrics and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {machinePerformance.map((machine) => (
              <div key={machine.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(machine.status)}`} />
                  <div>
                    <h4 className="font-medium">{machine.name}</h4>
                    <p className="text-sm text-muted-foreground">{machine.location}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-sm font-medium">${machine.revenue.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm font-medium">{machine.transactions}</p>
                    <p className="text-xs text-muted-foreground">Transactions</p>
                  </div>
                  
                  <div className="text-center">
                    <p className={`text-sm font-medium ${getPerformanceColor(machine.uptime)}`}>
                      {machine.uptime.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Uptime</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      {machine.lastSale ? format(new Date(machine.lastSale), 'MMM dd') : 'No sales'}
                    </p>
                    <p className="text-xs text-muted-foreground">Last Sale</p>
                  </div>
                  
                  <Badge variant={machine.status === 'active' ? 'default' : 'destructive'}>
                    {machine.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MachinePerformance;