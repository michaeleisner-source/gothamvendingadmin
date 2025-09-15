import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Zap, 
  Thermometer,
  DollarSign,
  Wrench,
  Bell,
  MapPin,
  TrendingUp,
  Download
} from "lucide-react";
import { toast } from "sonner";

interface MachineAlert {
  id: string;
  machine_id: string;
  machine_name: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  triggered_at: string;
  resolved_at: string | null;
}

interface MachineMetrics {
  machine_id: string;
  machine_name: string;
  location_name: string;
  total_sales_cents: number;
  total_transactions: number;
  failed_transactions: number;
  uptime_minutes: number;
  downtime_minutes: number;
  temperature_avg: number;
  last_sale_at: string;
  alert_count: number;
}

export default function MachineHealthMonitor() {
  const [alerts, setAlerts] = useState<MachineAlert[]>([]);
  const [metrics, setMetrics] = useState<MachineMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  useEffect(() => {
    loadData();
    
    // Set up real-time subscriptions
    const alertsChannel = supabase
      .channel('machine-alerts')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'machine_health_alerts' },
        () => loadAlerts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(alertsChannel);
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadAlerts(), loadMetrics()]);
    } catch (error) {
      toast.error("Failed to load machine health data");
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    const { data, error } = await supabase
      .from('machine_health_alerts')
      .select(`
        *,
        machines!inner(name)
      `)
      .is('resolved_at', null)
      .order('triggered_at', { ascending: false });

    if (error) throw error;
    
    setAlerts(data?.map(alert => ({
      ...alert,
      machine_name: alert.machines?.name || 'Unknown'
    })) || []);
  };

  const loadMetrics = async () => {
    // Get machine performance data for last 7 days
    const { data: performanceData, error: perfError } = await supabase
      .from('machine_performance_metrics')
      .select(`
        machine_id,
        total_sales_cents,
        total_transactions,
        failed_transactions,
        uptime_minutes,
        downtime_minutes,
        temperature_avg,
        machines!inner(name),
        locations!inner(name)
      `)
      .gte('metric_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    if (perfError) throw perfError;

    // Get latest sales data per machine
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select('machine_id, occurred_at')
      .order('occurred_at', { ascending: false });

    if (salesError) throw salesError;

    // Get alert counts per machine
    const { data: alertCounts, error: alertError } = await supabase
      .from('machine_health_alerts')
      .select('machine_id')
      .is('resolved_at', null);

    if (alertError) throw alertError;

    // Aggregate the data
    const machineMetrics = new Map<string, MachineMetrics>();
    
    performanceData?.forEach(perf => {
      const machineId = perf.machine_id;
      const existing = machineMetrics.get(machineId);
      
      if (!existing) {
        machineMetrics.set(machineId, {
          machine_id: machineId,
          machine_name: perf.machines?.name || 'Unknown',
          location_name: perf.locations?.name || 'Unknown',
          total_sales_cents: perf.total_sales_cents || 0,
          total_transactions: perf.total_transactions || 0,
          failed_transactions: perf.failed_transactions || 0,
          uptime_minutes: perf.uptime_minutes || 0,
          downtime_minutes: perf.downtime_minutes || 0,
          temperature_avg: perf.temperature_avg || 0,
          last_sale_at: salesData?.find(s => s.machine_id === machineId)?.occurred_at || '',
          alert_count: alertCounts?.filter(a => a.machine_id === machineId).length || 0
        });
      } else {
        existing.total_sales_cents += perf.total_sales_cents || 0;
        existing.total_transactions += perf.total_transactions || 0;
        existing.failed_transactions += perf.failed_transactions || 0;
        existing.uptime_minutes += perf.uptime_minutes || 0;
        existing.downtime_minutes += perf.downtime_minutes || 0;
        existing.temperature_avg = (existing.temperature_avg + (perf.temperature_avg || 0)) / 2;
      }
    });

    setMetrics(Array.from(machineMetrics.values()));
  };

  const resolveAlert = async (alertId: string, notes?: string) => {
    const { error } = await supabase
      .from('machine_health_alerts')
      .update({
        resolved_at: new Date().toISOString(),
        resolution_notes: notes
      })
      .eq('id', alertId);

    if (error) {
      toast.error("Failed to resolve alert");
      return;
    }

    toast.success("Alert resolved successfully");
    loadAlerts();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'outline';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <Zap className="h-4 w-4" />;
      case 'medium': return <Clock className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const filteredAlerts = selectedSeverity === 'all' 
    ? alerts 
    : alerts.filter(alert => alert.severity === selectedSeverity);

  const exportHealthReport = () => {
    const csvData = [
      ['Machine', 'Location', 'Active Alerts', 'Uptime %', 'Sales (7d)', 'Transactions', 'Avg Temp'],
      ...metrics.map(m => [
        m.machine_name,
        m.location_name,
        m.alert_count.toString(),
        ((m.uptime_minutes / (m.uptime_minutes + m.downtime_minutes)) * 100).toFixed(1) + '%',
        (m.total_sales_cents / 100).toFixed(2),
        m.total_transactions.toString(),
        m.temperature_avg?.toFixed(1) || 'N/A'
      ])
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `machine_health_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Machine Health Monitor</h1>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline">
            <TrendingUp className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportHealthReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Critical Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {alerts.filter(a => a.severity === 'critical').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              Healthy Machines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {metrics.filter(m => m.alert_count === 0).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Revenue (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(metrics.reduce((sum, m) => sum + m.total_sales_cents, 0) / 100).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-blue-600" />
              Avg Temperature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(metrics.reduce((sum, m) => sum + (m.temperature_avg || 0), 0) / metrics.length).toFixed(1)}°F
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
          <TabsTrigger value="machines">Machine Status</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedSeverity === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSeverity('all')}
            >
              All ({alerts.length})
            </Button>
            <Button
              variant={selectedSeverity === 'critical' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSeverity('critical')}
            >
              Critical ({alerts.filter(a => a.severity === 'critical').length})
            </Button>
            <Button
              variant={selectedSeverity === 'high' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSeverity('high')}
            >
              High ({alerts.filter(a => a.severity === 'high').length})
            </Button>
            <Button
              variant={selectedSeverity === 'medium' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSeverity('medium')}
            >
              Medium ({alerts.filter(a => a.severity === 'medium').length})
            </Button>
          </div>

          <div className="space-y-4">
            {filteredAlerts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All Clear!</h3>
                  <p className="text-muted-foreground">No active alerts at this time.</p>
                </CardContent>
              </Card>
            ) : (
              filteredAlerts.map(alert => (
                <Card key={alert.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getSeverityIcon(alert.severity)}
                        <div>
                          <CardTitle className="text-base">{alert.title}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {alert.machine_name} • {new Date(alert.triggered_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{alert.description}</p>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => resolveAlert(alert.id, 'Resolved from dashboard')}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Resolve
                      </Button>
                      <Button size="sm" variant="outline">
                        <Wrench className="h-4 w-4 mr-2" />
                        Create Ticket
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="machines" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map(machine => {
              const uptimePercent = machine.uptime_minutes / (machine.uptime_minutes + machine.downtime_minutes) * 100;
              const daysSinceLastSale = machine.last_sale_at 
                ? Math.floor((Date.now() - new Date(machine.last_sale_at).getTime()) / (1000 * 60 * 60 * 24))
                : 999;

              return (
                <Card key={machine.machine_id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{machine.machine_name}</CardTitle>
                      <div className="flex items-center gap-2">
                        {machine.alert_count > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {machine.alert_count}
                          </Badge>
                        )}
                        <div className={`w-3 h-3 rounded-full ${
                          daysSinceLastSale === 0 ? 'bg-emerald-500' :
                          daysSinceLastSale <= 1 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {machine.location_name}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Uptime</span>
                        <div className="font-semibold">{uptimePercent.toFixed(1)}%</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Sales (7d)</span>
                        <div className="font-semibold">${(machine.total_sales_cents / 100).toFixed(0)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Transactions</span>
                        <div className="font-semibold">{machine.total_transactions}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Temperature</span>
                        <div className="font-semibold">{machine.temperature_avg?.toFixed(1) || 'N/A'}°F</div>
                      </div>
                    </div>
                    {daysSinceLastSale > 2 && (
                      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                        ⚠️ {daysSinceLastSale} days since last sale
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="p-3 font-semibold">Machine</th>
                  <th className="p-3 font-semibold">Location</th>
                  <th className="p-3 font-semibold">Uptime %</th>
                  <th className="p-3 font-semibold">Sales (7d)</th>
                  <th className="p-3 font-semibold">Transactions</th>
                  <th className="p-3 font-semibold">Failure Rate</th>
                  <th className="p-3 font-semibold">Avg Temp</th>
                  <th className="p-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map(machine => {
                  const uptimePercent = machine.uptime_minutes / (machine.uptime_minutes + machine.downtime_minutes) * 100;
                  const failureRate = machine.total_transactions > 0 
                    ? (machine.failed_transactions / machine.total_transactions * 100)
                    : 0;

                  return (
                    <tr key={machine.machine_id} className="border-b last:border-b-0 hover:bg-muted/50">
                      <td className="p-3 font-medium">{machine.machine_name}</td>
                      <td className="p-3">{machine.location_name}</td>
                      <td className="p-3">
                        <span className={`font-medium ${
                          uptimePercent >= 95 ? 'text-emerald-600' :
                          uptimePercent >= 85 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {uptimePercent.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-3 font-medium">${(machine.total_sales_cents / 100).toLocaleString()}</td>
                      <td className="p-3">{machine.total_transactions.toLocaleString()}</td>
                      <td className="p-3">
                        <span className={`font-medium ${
                          failureRate <= 5 ? 'text-emerald-600' :
                          failureRate <= 15 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {failureRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-3">{machine.temperature_avg?.toFixed(1) || 'N/A'}°F</td>
                      <td className="p-3">
                        {machine.alert_count === 0 ? (
                          <Badge variant="default" className="bg-emerald-100 text-emerald-800">
                            Healthy
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            {machine.alert_count} Alert{machine.alert_count > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}