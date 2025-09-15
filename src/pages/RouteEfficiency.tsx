import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { money } from "@/utils/fees";
import { RefreshCw, Route as RouteIcon, Info, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpTooltip, HelpTooltipProvider } from "@/components/ui/HelpTooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Route Efficiency Dashboard - Unified routing analytics
 * - Integrates delivery_routes + route_stops for operational routes
 * - Uses optional route_runs for performance tracking
 * - Provides business intelligence on route optimization
 */

type AnyRow = Record<string, any>;

const fmt = (n: number) => money(Number.isFinite(n) ? n : 0);
const fmtInt = (n: number) => (Number.isFinite(n) ? Math.round(n).toString() : "0");
const fmt1 = (n: number) => (Number.isFinite(n) ? n.toFixed(1) : "0.0");
const hours = (ms: number) => (ms > 0 ? ms / 3_600_000 : 0);
const minutes = (ms: number) => (ms > 0 ? ms / 60_000 : 0);

async function tableExists(name: string): Promise<boolean> {
  // Simple existence check - try to query and handle the error
  try {
    const result = await (supabase as any).from(name).select("id").limit(1);
    return !result.error;
  } catch {
    return false;
  }
}

function SQLNotice({ title, sql }: { title: string; sql: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Info className="h-4 w-4" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-muted-foreground">Copy into Supabase → SQL Editor:</p>
        <pre className="text-xs overflow-auto rounded bg-muted p-3 whitespace-pre-wrap">{sql}</pre>
      </CardContent>
    </Card>
  );
}

type RouteMetrics = {
  id: string;
  name: string;
  driver?: string;
  totalStops: number;
  completedStops: number;
  avgServiceTime: number;
  totalMiles?: number;
  revenue: number;
  efficiency: number;
  lastRun?: string;
};

export default function RouteEfficiency() {
  const [deliveryRoutes, setDeliveryRoutes] = useState<AnyRow[]>([]);
  const [routeStops, setRouteStops] = useState<AnyRow[]>([]);
  const [sales, setSales] = useState<AnyRow[]>([]);
  const [haveRouteRuns, setHaveRouteRuns] = useState<boolean | null>(null);
  const [routeRuns, setRouteRuns] = useState<AnyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sinceISO = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString();
  }, []);

  useEffect(() => {
    loadData();
  }, [sinceISO]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Check if route_runs exists for enhanced metrics
      const haveRuns = await tableExists("route_runs");
      setHaveRouteRuns(haveRuns);

      // Load core delivery routes
      const routesRes = await supabase
        .from("delivery_routes")
        .select(`
          *,
          staff!delivery_routes_driver_id_fkey(full_name)
        `)
        .order("created_at", { ascending: false });

      if (routesRes.error) throw routesRes.error;
      setDeliveryRoutes(routesRes.data || []);

      // Load route stops for the last 14 days
      const stopsRes = await supabase
        .from("route_stops")
        .select("*")
        .gte("created_at", sinceISO)
        .order("created_at", { ascending: false });

      if (stopsRes.error) throw stopsRes.error;
      setRouteStops(stopsRes.data || []);

      // Load sales data for revenue calculation
      const salesRes = await supabase
        .from("sales")
        .select("machine_id, occurred_at, qty, unit_price_cents")
        .gte("occurred_at", sinceISO);

      if (salesRes.error) throw salesRes.error;
      setSales(salesRes.data || []);

      // If route_runs exists, load performance data
      if (haveRuns) {
        try {
          const runsRes = await (supabase as any)
            .from("route_runs")
            .select("*")
            .gte("run_date", sinceISO.slice(0, 10))
            .order("run_date", { ascending: false });

          if (!runsRes.error) {
            setRouteRuns(runsRes.data || []);
          }
        } catch (error) {
          console.warn("Error loading route_runs data:", error);
          // Continue without route_runs data
        }
      }
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const routeMetrics = useMemo<RouteMetrics[]>(() => {
    const metrics: RouteMetrics[] = [];

    // Group sales by machine and day for revenue calculation
    const salesByMachine = new Map<string, number>();
    for (const sale of sales) {
      const machineId = String(sale.machine_id || "");
      if (!machineId) continue;
      const revenue = (Number(sale.qty) || 0) * (Number(sale.unit_price_cents) || 0) / 100;
      salesByMachine.set(machineId, (salesByMachine.get(machineId) || 0) + revenue);
    }

    // Group stops by route
    const stopsByRoute = new Map<string, AnyRow[]>();
    for (const stop of routeStops) {
      const routeId = String(stop.route_id || "");
      if (!routeId) continue;
      if (!stopsByRoute.has(routeId)) stopsByRoute.set(routeId, []);
      stopsByRoute.get(routeId)!.push(stop);
    }

    for (const route of deliveryRoutes) {
      const routeId = String(route.id);
      const stops = stopsByRoute.get(routeId) || [];
      
      const totalStops = stops.length;
      const completedStops = stops.filter(s => s.completed).length;
      
      // Calculate average service time
      let totalServiceMinutes = 0;
      let serviceStopCount = 0;
      for (const stop of stops) {
        if (stop.actual_arrival && stop.estimated_arrival) {
          const arrival = new Date(stop.actual_arrival);
          const estimated = new Date(stop.estimated_arrival);
          totalServiceMinutes += minutes(arrival.getTime() - estimated.getTime());
          serviceStopCount++;
        }
      }
      const avgServiceTime = serviceStopCount > 0 ? totalServiceMinutes / serviceStopCount : 0;

      // Calculate revenue from machines on this route
      let routeRevenue = 0;
      const machinesOnRoute = new Set<string>();
      for (const stop of stops) {
        const machineId = String(stop.machine_id || "");
        if (machineId) {
          machinesOnRoute.add(machineId);
          routeRevenue += salesByMachine.get(machineId) || 0;
        }
      }

      // Efficiency score: revenue per stop, adjusted for completion rate
      const efficiency = totalStops > 0 
        ? (routeRevenue / totalStops) * (completedStops / totalStops)
        : 0;

      metrics.push({
        id: routeId,
        name: String(route.name || "Unnamed Route"),
        driver: route.staff?.full_name || "Unassigned",
        totalStops,
        completedStops,
        avgServiceTime,
        revenue: routeRevenue,
        efficiency,
        lastRun: stops.length > 0 
          ? new Date(Math.max(...stops.map(s => new Date(s.created_at || 0).getTime()))).toISOString()
          : undefined
      });
    }

    return metrics.sort((a, b) => b.efficiency - a.efficiency);
  }, [deliveryRoutes, routeStops, sales]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-destructive">
              <Info className="h-8 w-8 mx-auto mb-2" />
              <p>Error loading route data: {error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalRoutes = routeMetrics.length;
  const avgEfficiency = totalRoutes > 0 
    ? routeMetrics.reduce((sum, r) => sum + r.efficiency, 0) / totalRoutes 
    : 0;
  const totalRevenue = routeMetrics.reduce((sum, r) => sum + r.revenue, 0);

  return (
    <HelpTooltipProvider>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <RouteIcon className="h-8 w-8" />
              Route Efficiency
            </h1>
            <p className="text-muted-foreground mt-1">Analyze delivery route performance and optimization opportunities</p>
          </div>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm hover:bg-muted transition-colors"
          >
            <RefreshCw className="h-4 w-4" /> Refresh Data
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Routes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{totalRoutes}</span>
                <HelpTooltip content="Number of active delivery routes in your system" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Efficiency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{fmt(avgEfficiency)}</span>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <HelpTooltip content="Revenue per stop, weighted by completion rate. Higher is better." />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue (14d)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-green-600">{fmt(totalRevenue)}</span>
                <HelpTooltip content="Total sales revenue from all machines on active routes in the last 14 days" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="performance" className="space-y-4">
          <TabsList>
            <TabsTrigger value="performance">Route Performance</TabsTrigger>
            <TabsTrigger value="setup">Setup & Integration</TabsTrigger>
          </TabsList>

          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>Route Performance Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                {routeMetrics.length === 0 ? (
                  <div className="text-center py-8">
                    <RouteIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No route data available</h3>
                    <p className="text-muted-foreground">
                      Create delivery routes and record stops to see performance metrics.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-3 py-2 text-left">Route Name</th>
                          <th className="px-3 py-2 text-left">Driver</th>
                          <th className="px-3 py-2 text-right">Stops</th>
                          <th className="px-3 py-2 text-right">Completed</th>
                          <th className="px-3 py-2 text-right">Avg Service (min)</th>
                          <th className="px-3 py-2 text-right">Revenue</th>
                          <th className="px-3 py-2 text-right">Efficiency</th>
                          <th className="px-3 py-2 text-right">Last Run</th>
                        </tr>
                      </thead>
                      <tbody>
                        {routeMetrics.map(route => (
                          <tr key={route.id} className="border-t">
                            <td className="px-3 py-2 font-medium">{route.name}</td>
                            <td className="px-3 py-2">{route.driver}</td>
                            <td className="px-3 py-2 text-right">{route.totalStops}</td>
                            <td className="px-3 py-2 text-right">
                              <span className={`px-2 py-1 rounded text-xs ${
                                route.completedStops === route.totalStops 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {route.completedStops}/{route.totalStops}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right">{fmt1(route.avgServiceTime)}</td>
                            <td className="px-3 py-2 text-right">{fmt(route.revenue)}</td>
                            <td className="px-3 py-2 text-right font-medium">{fmt(route.efficiency)}</td>
                            <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                              {route.lastRun ? new Date(route.lastRun).toLocaleDateString() : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="setup">
            <div className="space-y-4">
              {!haveRouteRuns && (
                <SQLNotice
                  title="Optional: Enhanced Route Tracking with route_runs"
                  sql={`-- Enhanced route performance tracking
CREATE TABLE IF NOT EXISTS public.route_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL DEFAULT current_org(),
  route_id uuid NOT NULL REFERENCES public.delivery_routes(id) ON DELETE CASCADE,
  run_date date NOT NULL DEFAULT CURRENT_DATE,
  start_time timestamptz,
  end_time timestamptz,
  miles numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.route_runs ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "route_runs_org_policy" ON public.route_runs
  FOR ALL USING (is_org_member(org_id))
  WITH CHECK (org_id = current_org());

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_route_runs_date ON public.route_runs(run_date);
CREATE INDEX IF NOT EXISTS idx_route_runs_route ON public.route_runs(route_id);`}
                />
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Integration Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Delivery Routes</span>
                    <span className="text-green-600">✓ Connected</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Route Stops</span>
                    <span className="text-green-600">✓ Connected</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Sales Data</span>
                    <span className="text-green-600">✓ Connected</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Enhanced Tracking (route_runs)</span>
                    <span className={haveRouteRuns ? "text-green-600" : "text-amber-600"}>
                      {haveRouteRuns ? "✓ Available" : "⚠ Optional"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </HelpTooltipProvider>
  );
}