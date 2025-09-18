import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MapPin, TrendingUp, Users, Star } from 'lucide-react';
import { useSupabaseQuery } from '@/hooks/useOptimizedQuery';
import { subDays } from 'date-fns';

const LocationAnalytics = () => {
  const { data: locations = [] } = useSupabaseQuery(
    'locations',
    'id, name, city, state, status, revenue_split',
    [],
    { column: 'name', ascending: true },
    ['locations-analytics']
  ) as { data: any[] };

  const { data: machines = [] } = useSupabaseQuery(
    'machines',
    'id, name, location_id, status',
    [],
    undefined,
    ['machines-by-location']
  ) as { data: any[] };

  const { data: sales = [] } = useSupabaseQuery(
    'sales',
    'machine_id, total_amount, occurred_at',
    [
      { column: 'occurred_at', operator: 'gte', value: subDays(new Date(), 30).toISOString() }
    ],
    { column: 'occurred_at', ascending: false },
    ['location-sales-30d']
  ) as { data: any[] };

  const locationPerformance = useMemo(() => {
    // Map machines to locations
    const machineLocationMap = machines.reduce((acc, machine) => {
      acc[machine.id] = machine.location_id;
      return acc;
    }, {} as Record<string, string>);

    // Calculate sales by location
    const salesByLocation = sales.reduce((acc, sale) => {
      const locationId = machineLocationMap[sale.machine_id];
      if (!locationId) return acc;
      
      if (!acc[locationId]) {
        acc[locationId] = {
          revenue: 0,
          transactions: 0,
          machineCount: 0,
          activeMachines: 0
        };
      }
      acc[locationId].revenue += sale.total_amount || 0;
      acc[locationId].transactions += 1;
      return acc;
    }, {} as Record<string, any>);

    // Count machines per location
    const machinesPerLocation = machines.reduce((acc, machine) => {
      if (!acc[machine.location_id]) {
        acc[machine.location_id] = { total: 0, active: 0 };
      }
      acc[machine.location_id].total += 1;
      if (machine.status === 'active') {
        acc[machine.location_id].active += 1;
      }
      return acc;
    }, {} as Record<string, any>);

    return locations.map(location => {
      const performance = salesByLocation[location.id] || { revenue: 0, transactions: 0 };
      const machineStats = machinesPerLocation[location.id] || { total: 0, active: 0 };
      
      return {
        id: location.id,
        name: location.name,
        city: location.city,
        state: location.state,
        status: location.status,
        revenueSplit: location.revenue_split,
        revenue: performance.revenue,
        transactions: performance.transactions,
        machineCount: machineStats.total,
        activeMachines: machineStats.active,
        avgTransaction: performance.transactions > 0 ? performance.revenue / performance.transactions : 0,
        revenuePerMachine: machineStats.total > 0 ? performance.revenue / machineStats.total : 0,
        performance: performance.revenue > 100 ? 'high' : performance.revenue > 50 ? 'medium' : 'low'
      };
    });
  }, [locations, machines, sales]);

  const totalRevenue = locationPerformance.reduce((sum, loc) => sum + loc.revenue, 0);
  const totalMachines = locationPerformance.reduce((sum, loc) => sum + loc.machineCount, 0);
  const activeLocations = locationPerformance.filter(loc => loc.status === 'active').length;
  const avgRevenuePerLocation = locationPerformance.length > 0 ? totalRevenue / locationPerformance.length : 0;

  const topPerformers = locationPerformance
    .filter(loc => loc.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const performanceDistribution = [
    { name: 'High Performers', value: locationPerformance.filter(l => l.performance === 'high').length, fill: 'hsl(var(--chart-1))' },
    { name: 'Medium Performers', value: locationPerformance.filter(l => l.performance === 'medium').length, fill: 'hsl(var(--chart-2))' },
    { name: 'Low Performers', value: locationPerformance.filter(l => l.performance === 'low').length, fill: 'hsl(var(--chart-3))' }
  ];

  const getPerformanceBadge = (performance: string) => {
    switch (performance) {
      case 'high': return <Badge className="bg-green-100 text-green-800">High</Badge>;
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'low': return <Badge className="bg-red-100 text-red-800">Low</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Location Analytics</h2>
        <p className="text-muted-foreground">Performance insights across all locations</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLocations}</div>
            <p className="text-xs text-muted-foreground">
              of {locations.length} total locations
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Avg per Location</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${avgRevenuePerLocation.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Revenue per location
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Machines</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMachines}</div>
            <p className="text-xs text-muted-foreground">
              Across all locations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Locations</CardTitle>
            <CardDescription>Revenue leaders in the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topPerformers}>
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
            <CardTitle>Performance Distribution</CardTitle>
            <CardDescription>Location performance categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={performanceDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }: any) => `${name} ${(Number(percent || 0) * 100).toFixed(0)}%`}
                >
                  {performanceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Location Details */}
      <Card>
        <CardHeader>
          <CardTitle>Location Performance Details</CardTitle>
          <CardDescription>Comprehensive metrics for all locations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {locationPerformance.map((location) => (
              <div key={location.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div>
                    <h4 className="font-medium">{location.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {location.city}, {location.state}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-sm font-medium">${location.revenue.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm font-medium">{location.transactions}</p>
                    <p className="text-xs text-muted-foreground">Transactions</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm font-medium">{location.activeMachines}/{location.machineCount}</p>
                    <p className="text-xs text-muted-foreground">Active Machines</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm font-medium">${location.revenuePerMachine.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Per Machine</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm font-medium">{location.revenueSplit}%</p>
                    <p className="text-xs text-muted-foreground">Revenue Split</p>
                  </div>
                  
                  {getPerformanceBadge(location.performance)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationAnalytics;