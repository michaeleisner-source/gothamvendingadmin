import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  AlertTriangle,
  Activity,
  Target,
  Zap
} from "lucide-react";

interface MetricData {
  title: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'green' | 'blue' | 'purple' | 'orange' | 'red';
  format?: 'currency' | 'number' | 'percentage';
}

interface MetricsCardsProps {
  metrics: MetricData[];
  loading?: boolean;
}

export function MetricsCards({ metrics, loading = false }: MetricsCardsProps) {
  const getColorClasses = (color: string) => {
    const colors = {
      green: 'border-l-green-500 text-green-600',
      blue: 'border-l-blue-500 text-blue-600',
      purple: 'border-l-purple-500 text-purple-600',
      orange: 'border-l-orange-500 text-orange-600',
      red: 'border-l-red-500 text-red-600'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const formatValue = (value: number | string, format?: string) => {
    if (typeof value === 'string') return value;
    
    switch (format) {
      case 'currency':
        return `$${value.toFixed(2)}`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'number':
        return value.toLocaleString();
      default:
        return value.toString();
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-20"></div>
              <div className="h-4 bg-muted rounded w-16 mt-2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        const colorClasses = getColorClasses(metric.color);
        
        return (
          <Card key={index} className={`relative overflow-hidden border-l-4 ${colorClasses.split(' ')[0]}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <Icon className={`h-4 w-4 ${colorClasses.split(' ')[1]}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${colorClasses.split(' ')[1]}`}>
                {formatValue(metric.value, metric.format)}
              </div>
              {metric.change !== undefined && (
                <div className="flex items-center space-x-2 text-xs mt-1">
                  <Badge 
                    variant={metric.change >= 0 ? "default" : "destructive"} 
                    className="text-xs"
                  >
                    {metric.change >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(metric.change).toFixed(1)}%
                  </Badge>
                  {metric.changeLabel && (
                    <span className="text-muted-foreground">{metric.changeLabel}</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Pre-configured metric sets
export const getRevenueMetrics = (data: any) => [
  {
    title: "Today's Revenue",
    value: data.today || 0,
    change: data.growth || 0,
    changeLabel: "vs yesterday",
    icon: DollarSign,
    color: 'green' as const,
    format: 'currency' as const
  },
  {
    title: "Transactions",
    value: data.transactions || 0,
    icon: ShoppingCart,
    color: 'blue' as const,
    format: 'number' as const
  },
  {
    title: "Avg Transaction",
    value: data.avgTransaction || 0,
    icon: Target,
    color: 'purple' as const,
    format: 'currency' as const
  },
  {
    title: "Items Sold",
    value: data.itemsSold || 0,
    icon: Package,
    color: 'orange' as const,
    format: 'number' as const
  }
];

export const getMachineMetrics = (data: any) => [
  {
    title: "Total Machines",
    value: data.total || 0,
    icon: Activity,
    color: 'blue' as const,
    format: 'number' as const
  },
  {
    title: "Online",
    value: data.online || 0,
    change: data.onlineChange,
    icon: Zap,
    color: 'green' as const,
    format: 'number' as const
  },
  {
    title: "Offline",
    value: data.offline || 0,
    icon: AlertTriangle,
    color: 'red' as const,
    format: 'number' as const
  },
  {
    title: "Uptime",
    value: data.uptimePercentage || 0,
    icon: Activity,
    color: 'green' as const,
    format: 'percentage' as const
  }
];

export const getProspectMetrics = (data: any) => [
  {
    title: "Total Prospects",
    value: data.total || 0,
    icon: Users,
    color: 'blue' as const,
    format: 'number' as const
  },
  {
    title: "Qualified",
    value: data.qualified || 0,
    icon: Target,
    color: 'green' as const,
    format: 'number' as const
  },
  {
    title: "In Negotiation",
    value: data.inNegotiation || 0,
    icon: Users,
    color: 'orange' as const,
    format: 'number' as const
  },
  {
    title: "Conversion Rate",
    value: data.conversionRate || 0,
    change: data.conversionChange,
    icon: TrendingUp,
    color: 'purple' as const,
    format: 'percentage' as const
  }
];