import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OptimizedLoadingState } from "@/components/common/OptimizedLoadingState";
import { QuickStatsCard } from "@/components/dashboard/QuickStatsCard";
import { useDashboardStats, useLeads, useMachines, useLocations, useSales } from "@/hooks/useApiData";
import { 
  Factory, 
  MapPin, 
  Users, 
  TrendingUp, 
  Activity,
  Clock,
  DollarSign
} from "lucide-react";

const HomeDashboard = () => {
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats();
  const { data: leads, isLoading: leadsLoading } = useLeads();
  const { data: machines, isLoading: machinesLoading } = useMachines();
  const { data: locations, isLoading: locationsLoading } = useLocations();
  const { data: sales, isLoading: salesLoading } = useSales();

  const isLoading = statsLoading || leadsLoading || machinesLoading || locationsLoading;

  if (isLoading) {
    return <OptimizedLoadingState type="dashboard" title="Mission Control Dashboard" />;
  }

  const stats = dashboardStats || {
    totalRevenue: 0,
    monthlyRevenue: 0,
    activeMachines: 0,
    totalMachines: 0,
    newLeads: 0,
    totalLeads: 0,
    activeLocations: 0,
    totalLocations: 0,
    salesCount: 0
  };

  const kpiData = [
    {
      title: "Total Machines",
      value: stats.totalMachines,
      icon: Factory,
      className: "text-primary"
    },
    {
      title: "Active Machines",
      value: stats.activeMachines,
      icon: TrendingUp,
      className: "text-green-600"
    },
    {
      title: "Active Locations",
      value: stats.activeLocations,
      icon: MapPin,
      className: "text-blue-600"
    },
    {
      title: "New Leads",
      value: stats.newLeads,
      icon: Users,
      className: "text-purple-600"
    },
    {
      title: "Monthly Revenue",
      value: `$${stats.monthlyRevenue.toFixed(0)}`,
      icon: DollarSign,
      className: "text-emerald-600"
    },
    {
      title: "Total Sales",
      value: stats.salesCount,
      icon: Activity,
      className: "text-orange-600"
    }
  ];

  // Create recent activity from available data
  const recentActivity = [
    ...(sales?.slice(0, 3).map(sale => ({
      message: `Sale: ${sale.product_name} - $${sale.total_amount.toFixed(2)}`,
      timestamp: sale.sale_date,
      type: 'sale'
    })) || []),
    ...(leads?.slice(0, 2).map(lead => ({
      message: `New Lead: ${lead.name} (${lead.location_type})`,
      timestamp: lead.created_at,
      type: 'lead'
    })) || []),
    ...(machines?.slice(0, 2).map(machine => ({
      message: `Machine Status: ${machine.machine_model} - ${machine.status}`,
      timestamp: machine.updated_at,
      type: 'machine'
    })) || [])
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Mission Control</h1>
          <p className="text-muted-foreground mt-1">
            Real-time overview of your vending operations
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiData.map((kpi) => (
          <QuickStatsCard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            icon={kpi.icon}
            className={kpi.className}
          />
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-muted-foreground text-sm">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{activity.message}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Business Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Business Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Revenue</span>
                <span className="text-sm font-medium">${stats.totalRevenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Avg Revenue/Machine</span>
                <span className="text-sm font-medium">
                  ${stats.totalMachines > 0 ? (stats.totalRevenue / stats.totalMachines).toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Machine Utilization</span>
                <span className="text-sm font-medium">
                  {stats.totalMachines > 0 ? Math.round((stats.activeMachines / stats.totalMachines) * 100) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Leads</span>
                <span className="text-sm font-medium">{stats.totalLeads}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">New This Month</span>
                <span className="text-sm font-medium">{stats.newLeads}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Conversion Rate</span>
                <span className="text-sm font-medium">
                  {stats.totalLeads > 0 ? Math.round((stats.totalLocations / stats.totalLeads) * 100) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HomeDashboard;