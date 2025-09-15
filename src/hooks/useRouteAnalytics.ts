import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface RouteAnalytics {
  totalRuns: number;
  totalMiles: number;
  totalRevenue: number;
  avgStopsPerRun: number;
  avgMilesPerRun: number;
  avgRevenuePerRun: number;
  avgServiceTimePerStop: number;
  efficiency: {
    milesPerHour: number;
    revenuePerHour: number;
    stopsPerHour: number;
  };
  topRoutes: Array<{
    route: string;
    runs: number;
    avgRevenue: number;
    efficiency: number;
  }>;
  topDrivers: Array<{
    driver: string;
    runs: number;
    avgRevenue: number;
    avgStops: number;
    efficiency: number;
  }>;
  dailyTrends: Array<{
    date: string;
    runs: number;
    revenue: number;
    miles: number;
    stops: number;
  }>;
}

async function tableExists(name: string) {
  try {
    const r = await (supabase as any).from(name).select("*").limit(1);
    return !r.error;
  } catch {
    return false;
  }
}

function pick<T extends string>(obj: any, candidates: T[]): T | null {
  if (!obj) return null;
  for (const c of candidates) if (c in obj) return c;
  return null;
}

export const useRouteAnalytics = (days: number = 14) => {
  return useQuery({
    queryKey: ['route-analytics', days],
    queryFn: async (): Promise<RouteAnalytics> => {
      const sinceISO = new Date();
      sinceISO.setDate(sinceISO.getDate() - days);
      const since = sinceISO.toISOString();

      // Check if tables exist
      const haveRuns = await tableExists("route_runs");
      const haveStops = await tableExists("route_stops");

      if (!haveRuns || !haveStops) {
        return {
          totalRuns: 0,
          totalMiles: 0,
          totalRevenue: 0,
          avgStopsPerRun: 0,
          avgMilesPerRun: 0,
          avgRevenuePerRun: 0,
          avgServiceTimePerStop: 0,
          efficiency: { milesPerHour: 0, revenuePerHour: 0, stopsPerHour: 0 },
          topRoutes: [],
          topDrivers: [],
          dailyTrends: [],
        };
      }

      // Fetch route runs
      const { data: runs, error: runsError } = await (supabase as any)
        .from('route_runs')
        .select('*')
        .gte('started_at', since)
        .order('started_at', { ascending: false });

      if (runsError) throw runsError;

      // Fetch route stops
      const { data: stops, error: stopsError } = await (supabase as any)
        .from('route_stops')
        .select('*')
        .gte('arrived_at', since);

      if (stopsError) throw stopsError;

      // Fetch sales data for revenue calculation
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('machine_id, occurred_at, qty, unit_price_cents')
        .gte('occurred_at', since);

      if (salesError) throw salesError;

      // Process data
      const runsData = runs || [];
      const stopsData = stops || [];
      const salesData = sales || [];

      // Group stops by run
      const stopsByRun = new Map<string, any[]>();
      for (const stop of stopsData) {
        const runId = String((stop as any).run_id || '');
        if (!stopsByRun.has(runId)) stopsByRun.set(runId, []);
        stopsByRun.get(runId)!.push(stop);
      }

      // Group sales by machine and day
      const salesByMachineDay = new Map<string, number>();
      for (const sale of salesData) {
        const machineId = String(sale.machine_id || '');
        const day = String(sale.occurred_at || '').slice(0, 10);
        const revenue = (Number(sale.qty) || 0) * (Number(sale.unit_price_cents) || 0) / 100;
        const key = `${machineId}|${day}`;
        salesByMachineDay.set(key, (salesByMachineDay.get(key) || 0) + revenue);
      }

      // Calculate aggregated metrics
      let totalMiles = 0;
      let totalRevenue = 0;
      let totalServiceTime = 0;
      let totalStops = 0;
      let totalDurationHours = 0;

      const routeMetrics = new Map<string, any>();
      const driverMetrics = new Map<string, any>();
      const dailyMetrics = new Map<string, any>();

      for (const run of runsData) {
        const sample = run;
        const routeKey = pick(sample, ["route_name", "name", "route"]) || "route_name";
        const driverKey = pick(sample, ["driver", "assigned_to", "driver_name"]) || "driver";
        const startKey = pick(sample, ["started_at", "start_at", "started", "created_at"]) || "started_at";
        const endKey = pick(sample, ["finished_at", "end_at", "finished"]) || "finished_at";

        const route = String(run[routeKey] || 'Unknown Route');
        const driver = String(run[driverKey] || 'Unknown Driver');
        const startedAt = run[startKey];
        const finishedAt = run[endKey];
        
        const start = startedAt ? new Date(startedAt) : null;
        const end = finishedAt ? new Date(finishedAt) : null;
        const durationMs = start && end ? Math.max(0, end.getTime() - start.getTime()) : 0;
        const durationHours = durationMs / (1000 * 60 * 60);

        const runStops = stopsByRun.get(String((run as any).id)) || [];
        let runMiles = 0;
        let runServiceTime = 0;
        const machinesVisited = new Set<string>();

        for (const stop of runStops) {
          machinesVisited.add(String((stop as any).machine_id || ''));
          runMiles += Number((stop as any).miles || 0);
          runServiceTime += Number((stop as any).service_minutes || 0);
        }

        // Calculate revenue for this run
        let runRevenue = 0;
        if (start) {
          const day = startedAt.slice(0, 10);
          for (const machineId of machinesVisited) {
            const key = `${machineId}|${day}`;
            runRevenue += salesByMachineDay.get(key) || 0;
          }
        }

        totalMiles += runMiles;
        totalRevenue += runRevenue;
        totalServiceTime += runServiceTime;
        totalStops += runStops.length;
        totalDurationHours += durationHours;

        // Route metrics
        if (!routeMetrics.has(route)) {
          routeMetrics.set(route, { runs: 0, revenue: 0, miles: 0, stops: 0, duration: 0 });
        }
        const routeData = routeMetrics.get(route);
        routeData.runs++;
        routeData.revenue += runRevenue;
        routeData.miles += runMiles;
        routeData.stops += runStops.length;
        routeData.duration += durationHours;

        // Driver metrics
        if (!driverMetrics.has(driver)) {
          driverMetrics.set(driver, { runs: 0, revenue: 0, miles: 0, stops: 0, duration: 0 });
        }
        const driverData = driverMetrics.get(driver);
        driverData.runs++;
        driverData.revenue += runRevenue;
        driverData.miles += runMiles;
        driverData.stops += runStops.length;
        driverData.duration += durationHours;

        // Daily metrics
        if (start) {
          const day = startedAt.slice(0, 10);
          if (!dailyMetrics.has(day)) {
            dailyMetrics.set(day, { runs: 0, revenue: 0, miles: 0, stops: 0 });
          }
          const dayData = dailyMetrics.get(day);
          dayData.runs++;
          dayData.revenue += runRevenue;
          dayData.miles += runMiles;
          dayData.stops += runStops.length;
        }
      }

      // Process top routes
      const topRoutes = Array.from(routeMetrics.entries())
        .map(([route, data]) => ({
          route,
          runs: data.runs,
          avgRevenue: data.revenue / data.runs,
          efficiency: data.duration > 0 ? data.revenue / data.duration : 0,
        }))
        .sort((a, b) => b.efficiency - a.efficiency)
        .slice(0, 5);

      // Process top drivers
      const topDrivers = Array.from(driverMetrics.entries())
        .map(([driver, data]) => ({
          driver,
          runs: data.runs,
          avgRevenue: data.revenue / data.runs,
          avgStops: data.stops / data.runs,
          efficiency: data.duration > 0 ? data.revenue / data.duration : 0,
        }))
        .sort((a, b) => b.efficiency - a.efficiency)
        .slice(0, 5);

      // Process daily trends
      const dailyTrends = Array.from(dailyMetrics.entries())
        .map(([date, data]) => ({
          date,
          runs: data.runs,
          revenue: data.revenue,
          miles: data.miles,
          stops: data.stops,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        totalRuns: runsData.length,
        totalMiles,
        totalRevenue,
        avgStopsPerRun: runsData.length > 0 ? totalStops / runsData.length : 0,
        avgMilesPerRun: runsData.length > 0 ? totalMiles / runsData.length : 0,
        avgRevenuePerRun: runsData.length > 0 ? totalRevenue / runsData.length : 0,
        avgServiceTimePerStop: totalStops > 0 ? totalServiceTime / totalStops : 0,
        efficiency: {
          milesPerHour: totalDurationHours > 0 ? totalMiles / totalDurationHours : 0,
          revenuePerHour: totalDurationHours > 0 ? totalRevenue / totalDurationHours : 0,
          stopsPerHour: totalDurationHours > 0 ? totalStops / totalDurationHours : 0,
        },
        topRoutes,
        topDrivers,
        dailyTrends,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
};