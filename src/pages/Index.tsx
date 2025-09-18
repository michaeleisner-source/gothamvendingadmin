import { useDashboardStats } from "@/hooks/useApiData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Users, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function Index() {
  const { data, isLoading, error } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Lead Management Dashboard</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load dashboard data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Lead Management Dashboard</h1>
          <p className="text-muted-foreground">
            Track and manage your sales prospects
          </p>
        </div>
        <Link to="/leads">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Manage Leads
          </Button>
        </Link>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Leads
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              All leads in system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              New Leads
            </CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.newLeads}</div>
            <p className="text-xs text-muted-foreground">
              Require follow-up
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Interested Leads
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.interestedLeads}</div>
            <p className="text-xs text-muted-foreground">
              Hot prospects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Conversion Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalLeads > 0 ? ((data.closedLeads / data.totalLeads) * 100).toFixed(1) : '0'}%</div>
            <p className="text-xs text-muted-foreground">
              {data.closedLeads} closed deals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lead Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Status Overview</CardTitle>
          <CardDescription>
            Current pipeline distribution
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm">New</span>
            <Badge variant="secondary">{data.newLeads}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Interested</span>
            <Badge variant="default">{data.interestedLeads}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Closed</span>
            <Badge variant="outline" className="text-green-600">{data.closedLeads}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Get started with lead management
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Link to="/leads">
            <Button variant="outline">
              <Users className="mr-2 h-4 w-4" />
              View All Leads
            </Button>
          </Link>
          <Link to="/leads">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add New Lead
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}