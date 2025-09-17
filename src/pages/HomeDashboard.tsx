import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NextActionBar } from "@/feature-pack/VendingWorkflowPack";
import { OptimizedLoadingState } from "@/components/common/OptimizedLoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { QuickStatsCard } from "@/components/dashboard/QuickStatsCard";
import { useDashboardData } from "@/hooks/useDashboardData";
import { 
  Factory, 
  MapPin, 
  Users, 
  TrendingUp, 
  Activity,
  Clock
} from "lucide-react";

const HomeDashboard = () => {
  const { data: dashboardData, isLoading } = useDashboardData();

  if (isLoading) {
    return <OptimizedLoadingState type="dashboard" title="Mission Control Dashboard" />;
  }

  const kpiData = [
    {
      title: "Total Machines",
      value: dashboardData.machines.total,
      icon: Factory,
      className: "text-primary"
    },
    {
      title: "Online Machines",
      value: dashboardData.machines.online,
      icon: TrendingUp,
      className: "text-green-600"
    },
    {
      title: "Active Locations",
      value: dashboardData.locations.total,
      icon: MapPin,
      className: "text-blue-600"
    },
    {
      title: "Active Leads",
      value: dashboardData.leads.active,
      icon: Users,
      className: "text-purple-600"
    }
  ];

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
      
      <NextActionBar />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          {dashboardData.recentActivity.length === 0 ? (
            <p className="text-muted-foreground text-sm">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {dashboardData.recentActivity.map((activity, index) => (
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
    </div>
  );
};

export default HomeDashboard;