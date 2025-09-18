import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  Users, 
  Cog, 
  Package, 
  Activity,
  ArrowRight,
  Clock,
  AlertTriangle
} from "lucide-react";
import { Link } from "react-router-dom";

interface ActivityItem {
  id: string;
  type: 'sale' | 'prospect' | 'machine' | 'inventory' | 'alert';
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
  status?: 'success' | 'warning' | 'error' | 'info';
  actionUrl?: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  loading?: boolean;
  title?: string;
  maxItems?: number;
}

export function ActivityFeed({ 
  activities, 
  loading = false, 
  title = "Recent Activity",
  maxItems = 8 
}: ActivityFeedProps) {
  const getActivityIcon = (type: string, status?: string) => {
    const baseClasses = "h-4 w-4";
    
    switch (type) {
      case 'sale':
        return <DollarSign className={`${baseClasses} text-green-600`} />;
      case 'prospect':
        return <Users className={`${baseClasses} text-blue-600`} />;
      case 'machine':
        return <Cog className={`${baseClasses} text-orange-600`} />;
      case 'inventory':
        return <Package className={`${baseClasses} text-purple-600`} />;
      case 'alert':
        return <AlertTriangle className={`${baseClasses} text-red-600`} />;
      default:
        return <Activity className={`${baseClasses} text-muted-foreground`} />;
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const variants = {
      success: 'default',
      warning: 'outline',
      error: 'destructive',
      info: 'secondary'
    };
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'} className="text-xs">
        {status}
      </Badge>
    );
  };

  const formatTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3 animate-pulse">
              <div className="h-8 w-8 bg-muted rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
              <div className="h-4 bg-muted rounded w-16"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const displayedActivities = activities.slice(0, maxItems);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {title}
        </CardTitle>
        {activities.length > maxItems && (
          <Button variant="ghost" size="sm" asChild>
            <Link to="/activity">
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {displayedActivities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.type, activity.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">
                      {activity.title}
                    </p>
                    <div className="flex items-center gap-2">
                      {activity.amount && (
                        <span className="text-sm font-medium text-green-600">
                          {formatCurrency(activity.amount)}
                        </span>
                      )}
                      {getStatusBadge(activity.status)}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {activity.description}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(activity.timestamp)}
                    </div>
                    {activity.actionUrl && (
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={activity.actionUrl} className="text-xs">
                          View
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper functions to create activity items
export const createSaleActivity = (sale: any): ActivityItem => ({
  id: sale.id,
  type: 'sale',
  title: 'New Sale',
  description: `${sale.product_name || 'Product'} sold`,
  timestamp: sale.occurred_at || sale.created_at,
  amount: sale.total_amount || sale.unit_price_cents / 100,
  status: 'success',
  actionUrl: `/sales/${sale.id}`
});

export const createProspectActivity = (prospect: any): ActivityItem => ({
  id: prospect.id,
  type: 'prospect',
  title: 'New Prospect',
  description: `${prospect.name || prospect.company || 'New lead'} added`,
  timestamp: prospect.created_at,
  status: 'info',
  actionUrl: `/prospects/${prospect.id}`
});

export const createMachineActivity = (machine: any, event: string): ActivityItem => ({
  id: `${machine.id}-${Date.now()}`,
  type: 'machine',
  title: 'Machine Status',
  description: `${machine.name} ${event}`,
  timestamp: new Date().toISOString(),
  status: event.includes('offline') ? 'error' : event.includes('maintenance') ? 'warning' : 'info',
  actionUrl: `/machines/${machine.id}`
});

export const createInventoryActivity = (item: any): ActivityItem => ({
  id: `inventory-${item.id}-${Date.now()}`,
  type: 'inventory',
  title: 'Low Stock Alert',
  description: `${item.product_name} needs restocking`,
  timestamp: new Date().toISOString(),
  status: 'warning',
  actionUrl: `/inventory`
});