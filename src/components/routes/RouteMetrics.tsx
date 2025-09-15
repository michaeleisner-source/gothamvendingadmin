import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouteAnalytics } from '@/hooks/useRouteAnalytics';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, User, Route, TrendingUp } from 'lucide-react';

export function TopRoutes() {
  const { data: analytics, isLoading } = useRouteAnalytics();

  if (isLoading) {
    return <Skeleton className="h-64" />;
  }

  if (!analytics) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-600" />
          Top Performing Routes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {analytics.topRoutes.map((route, index) => (
            <div key={route.route} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                  <span className="text-sm font-semibold">#{index + 1}</span>
                </div>
                <div>
                  <div className="font-medium">{route.route}</div>
                  <div className="text-sm text-muted-foreground">{route.runs} runs</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">${route.efficiency.toFixed(0)}/hr</div>
                <div className="text-sm text-muted-foreground">
                  ${Math.round(route.avgRevenue)} avg
                </div>
              </div>
            </div>
          ))}
          {analytics.topRoutes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Route className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No route data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function TopDrivers() {
  const { data: analytics, isLoading } = useRouteAnalytics();

  if (isLoading) {
    return <Skeleton className="h-64" />;
  }

  if (!analytics) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-blue-600" />
          Top Performing Drivers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {analytics.topDrivers.map((driver, index) => (
            <div key={driver.driver} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                  <span className="text-sm font-semibold">#{index + 1}</span>
                </div>
                <div>
                  <div className="font-medium">{driver.driver}</div>
                  <div className="text-sm text-muted-foreground">
                    {driver.runs} runs • {driver.avgStops.toFixed(1)} stops/run
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">${driver.efficiency.toFixed(0)}/hr</div>
                <div className="text-sm text-muted-foreground">
                  ${Math.round(driver.avgRevenue)} avg
                </div>
              </div>
            </div>
          ))}
          {analytics.topDrivers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No driver data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function DailyTrends() {
  const { data: analytics, isLoading } = useRouteAnalytics();

  if (isLoading) {
    return <Skeleton className="h-80" />;
  }

  if (!analytics) return null;

  const maxRevenue = Math.max(...analytics.dailyTrends.map(d => d.revenue), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          Daily Trends (Last 14 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {analytics.dailyTrends.map((day) => (
            <div key={day.date} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{new Date(day.date).toLocaleDateString()}</span>
                  <Badge variant="secondary" className="text-xs">
                    {day.runs} runs
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="font-semibold">${day.revenue.toFixed(0)}</div>
                  <div className="text-xs text-muted-foreground">
                    {day.stops} stops • {day.miles.toFixed(0)} miles
                  </div>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${(day.revenue / maxRevenue) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
          {analytics.dailyTrends.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No trend data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}