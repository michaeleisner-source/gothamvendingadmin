import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Brain, BarChart3, ArrowRight, Target, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { useDashboardData } from "@/hooks/useDashboardData";

export function AnalyticsDashboardWidget() {
  const { data: dashboardData, isLoading } = useDashboardData();

  // Mock analytics data
  const performanceTrend = [
    { month: "Jan", performance: 78 },
    { month: "Feb", performance: 82 },
    { month: "Mar", performance: 85 },
    { month: "Apr", performance: 89 },
    { month: "May", performance: 92 },
    { month: "Jun", performance: 88 }
  ];

  const riskDistribution = [
    { name: "Low Risk", value: 70, color: "#10b981" },
    { name: "Medium Risk", value: 20, color: "#f59e0b" },
    { name: "High Risk", value: 10, color: "#ef4444" }
  ];

  const keyInsights = [
    {
      title: "Revenue Growth",
      value: "+15.2%",
      trend: "up" as const,
      description: "Above industry average"
    },
    {
      title: "Predictive Accuracy",
      value: "87%",
      trend: "stable" as const,
      description: "AI model performance"
    },
    {
      title: "Operational Score",
      value: "92/100",
      trend: "up" as const,
      description: "Benchmark ranking"
    }
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Advanced Analytics</CardTitle>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Advanced Analytics
        </CardTitle>
        <CardDescription>
          AI-powered insights and business intelligence
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Insights */}
        <div className="grid grid-cols-3 gap-4">
          {keyInsights.map((insight, index) => (
            <div key={index} className="text-center">
              <div className="text-lg font-bold">{insight.value}</div>
              <div className="text-sm font-medium">{insight.title}</div>
              <div className="text-xs text-muted-foreground">{insight.description}</div>
            </div>
          ))}
        </div>

        {/* Performance Trend */}
        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Performance Trend
          </h4>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis hide />
                <Tooltip formatter={(value) => [`${value}%`, 'Performance Score']} />
                <Line 
                  type="monotone" 
                  dataKey="performance" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Analysis & Predictions */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2 text-sm">Risk Distribution</h4>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={15}
                    outerRadius={35}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, 'Risk Level']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">AI Predictions</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs">Revenue +8% next month</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-xs">2 machines need service</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-xs">Demand spike in Q4</span>
              </div>
            </div>
          </div>
        </div>

        {/* Priority Alerts */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Priority Alerts
          </h4>
          <div className="space-y-1">
            <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded-md">
              <span className="text-xs">High demand predicted for location VM-15</span>
              <Badge variant="secondary" className="text-xs">Medium</Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/20 rounded-md">
              <span className="text-xs">Q4 targets 12% ahead of schedule</span>
              <Badge variant="default" className="text-xs">Good</Badge>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link to="/reports" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              View Reports
            </Link>
          </Button>
          <Button asChild size="sm" className="flex-1">
            <Link to="/enhanced-dashboard" className="flex items-center gap-2">
              Full Analytics
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}