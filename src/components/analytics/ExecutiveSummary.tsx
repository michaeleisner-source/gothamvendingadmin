import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, DollarSign, Target, AlertTriangle, CheckCircle } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useVendingData } from "@/hooks/useVendingData";

export function ExecutiveSummary() {
  const { data: dashboardData, isLoading } = useDashboardData();
  const vendingData = useVendingData();
  
  // Calculate metrics from vending data
  const revenue = vendingData.data?.sales.reduce((total, sale) => total + (sale.qty * sale.unit_price_cents), 0) || 0;
  const profitMargin = 28; // Mock value for now
  const machineUtilization = 85; // Mock value for now

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Executive Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const kpis = [
    {
      title: "Monthly Revenue",
      value: `$${(revenue / 100).toLocaleString()}`,
      change: "+12.5%",
      trend: "up" as const,
      target: 85,
      status: "on-track" as const
    },
    {
      title: "Profit Margin",
      value: `${profitMargin}%`,
      change: "+2.1%",
      trend: "up" as const,
      target: 72,
      status: "on-track" as const
    },
    {
      title: "Machine Utilization",
      value: `${machineUtilization}%`,
      change: "-3.2%",
      trend: "down" as const,
      target: 65,
      status: "attention" as const
    },
    {
      title: "Active Locations",
      value: dashboardData?.locations.active.toString() || "0",
      change: "+5",
      trend: "up" as const,
      target: 90,
      status: "on-track" as const
    }
  ];

  const alerts = [
    {
      type: "warning" as const,
      message: "3 machines require maintenance",
      priority: "medium" as const
    },
    {
      type: "info" as const,
      message: "New location contract ready for review",
      priority: "low" as const
    },
    {
      type: "success" as const,
      message: "Q4 revenue target exceeded by 8%",
      priority: "high" as const
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Executive Summary
          </CardTitle>
          <CardDescription>
            Key performance indicators and business health overview
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {kpis.map((kpi, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {kpi.title}
                  </span>
                  <Badge 
                    variant={kpi.status === "on-track" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {kpi.status === "on-track" ? "On Track" : "Needs Attention"}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{kpi.value}</span>
                    <div className={`flex items-center gap-1 text-sm ${
                      kpi.trend === "up" ? "text-green-600" : "text-red-600"
                    }`}>
                      {kpi.trend === "up" ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      {kpi.change}
                    </div>
                  </div>
                  <Progress value={kpi.target} className="h-2" />
                  <span className="text-xs text-muted-foreground">
                    {kpi.target}% of target
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Priority Alerts
            </h4>
            <div className="space-y-2">
              {alerts.map((alert, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  {alert.type === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                  {alert.type === "info" && <DollarSign className="h-4 w-4 text-blue-500" />}
                  {alert.type === "success" && <CheckCircle className="h-4 w-4 text-green-500" />}
                  <span className="text-sm flex-1">{alert.message}</span>
                  <Badge 
                    variant={alert.priority === "high" ? "destructive" : 
                            alert.priority === "medium" ? "secondary" : "outline"}
                    className="text-xs"
                  >
                    {alert.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}