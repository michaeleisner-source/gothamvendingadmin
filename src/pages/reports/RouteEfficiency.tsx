import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { money } from "@/utils/fees";
import { RefreshCw, Route as RouteIcon, Info, Search, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Header } from "@/components/ui/Header";
import { RouteKPIs } from "@/components/routes/RouteKPIs";
import { TopRoutes, TopDrivers, DailyTrends } from "@/components/routes/RouteMetrics";
import { useToast } from "@/hooks/use-toast";

type AnyRow = Record<string, any>;

const fmt = (n: number) => money(Number.isFinite(n) ? n : 0);
const fmtInt = (n: number) => (Number.isFinite(n) ? Math.round(n).toString() : "0");
const fmt1 = (n: number) => (Number.isFinite(n) ? n.toFixed(1) : "0.0");
const hours = (ms: number) => (ms > 0 ? ms / 3_600_000 : 0);
const minutes = (ms: number) => (ms > 0 ? ms / 60_000 : 0);

async function tableExists(name: string) {
  try {
    const r = await (supabase as any).from(name).select("*").limit(1);
    return !r.error;
  } catch {
    return false;
  }
}

function pick<T extends string>(obj: AnyRow | undefined, candidates: T[]): T | null {
  if (!obj) return null;
  for (const c of candidates) if (c in obj) return c;
  return null;
}

function SQLNotice({ title, sql }: { title: string; sql: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-sm font-medium flex items-center gap-2 mb-3">
          <Info className="h-4 w-4 text-blue-600" /> {title}
        </div>
        <div className="text-xs text-muted-foreground mb-2">Copy into Supabase → SQL Editor:</div>
        <pre className="text-xs overflow-auto rounded bg-muted p-3 whitespace-pre-wrap border">{sql}</pre>
      </CardContent>
    </Card>
  );
}

type RunAgg = {
  id: string;
  route: string;
  driver: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  odometerStart?: number | null;
  odometerEnd?: number | null;
  miles: number;
  stops: number;
  machinesVisited: number;
  serviceMinutes: number;
  sales: number;
  salesPerHour: number;
  milesPerStop: number;
  minPerStop: number;
};

export default function RouteEfficiency() {
  const { toast } = useToast();
  const [haveRuns, setHaveRuns] = useState<boolean | null>(null);
  const [haveStops, setHaveStops] = useState<boolean | null>(null);
  const [runs, setRuns] = useState<AnyRow[]>([]);
  const [stops, setStops] = useState<AnyRow[]>([]);
  const [sales, setSales] = useState<AnyRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRoute, setFilterRoute] = useState<string>("all");
  const [filterDriver, setFilterDriver] = useState<string>("all");
  const [days, setDays] = useState(14);

  const sinceISO = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString();
  }, [days]);

  const loadData = async () => {
    setLoading(true);
    setErr(null);
    try {
      const haveRuns_ = await tableExists("route_runs");
      const haveStops_ = await tableExists("route_stops");
      setHaveRuns(haveRuns_);
      setHaveStops(haveStops_);

      // Sales (for "same-day" aggregation)
      const s = await supabase
        .from("sales")
        .select("machine_id, occurred_at, qty, unit_price_cents")
        .gte("occurred_at", sinceISO)
        .limit(100000);
      if (s.error) throw s.error;
      setSales(s.data || []);

      // ------- SAFE FETCH: route_runs -------
      if (haveRuns_) {
        let r = await (supabase as any)
          .from("route_runs")
          .select("*")
          .gte("started_at", sinceISO)
          .order("started_at", { ascending: false })
          .limit(10000);

        if (r.error) {
          // fallback: try created_at, then plain select
          const r2 = await (supabase as any)
            .from("route_runs")
            .select("*")
            .gte("created_at", sinceISO)
            .order("created_at", { ascending: false })
            .limit(10000);
          if (!r2.error) {
            setRuns(r2.data || []);
          } else {
            const r3 = await (supabase as any).from("route_runs").select("*").limit(10000);
            if (!r3.error) setRuns(r3.data || []);
            else throw r3.error;
          }
        } else {
          setRuns(r.data || []);
        }
      }

      // ------- SAFE FETCH: route_stops -------
      if (haveStops_) {
        let st = await (supabase as any)
          .from("route_stops")
          .select("*")
          .gte("arrived_at", sinceISO)
          .order("arrived_at", { ascending: false })
          .limit(100000);

        if (st.error) {
          // fallback: try created_at, then plain select
          const st2 = await (supabase as any)
            .from("route_stops")
            .select("*")
            .gte("created_at", sinceISO)
            .order("created_at", { ascending: false })
            .limit(100000);
          if (!st2.error) {
            setStops(st2.data || []);
          } else {
            const st3 = await (supabase as any).from("route_stops").select("*").limit(100000);
            if (!st3.error) setStops(st3.data || []);
            else throw st3.error;
          }
        } else {
          setStops(st.data || []);
        }
      }
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [sinceISO]);

  const aggs = useMemo<RunAgg[]>(() => {
    if (!haveRuns || !runs.length) return [];

    // Detect likely column names from the first run row
    const sample = runs[0] || {};
    const routeKey = pick(sample, ["route_name", "name", "route"]) || "route_name";
    const driverKey = pick(sample, ["driver", "assigned_to", "driver_name"]) || "driver";
    const startKey = pick(sample, ["started_at", "start_at", "started", "created_at"]) || "started_at";
    const endKey = pick(sample, ["finished_at", "end_at", "finished"]) || "finished_at";
    const odoStartKey = pick(sample, ["odometer_start", "odo_start"]);
    const odoEndKey = pick(sample, ["odometer_end", "odo_end"]);

    // Group stops by run
    const byRun = new Map<string, AnyRow[]>();
    if (haveStops) {
      for (const st of stops) {
        const rid = String(st.run_id ?? "");
        if (!byRun.has(rid)) byRun.set(rid, []);
        byRun.get(rid)!.push(st);
      }
    }

    // Pre-group sales by machine + day (yyyy-mm-dd)
    function dayKey(iso: string) { return iso.slice(0, 10); }
    const salesByMachineDay = new Map<string, number>(); // key: mId|day → $gross
    for (const s of sales) {
      const m = String(s.machine_id ?? "");
      const iso = String(s.occurred_at ?? "");
      if (!m || !iso) continue;
      const grossCents = (Number(s.qty) || 0) * (Number(s.unit_price_cents) || 0);
      const key = `${m}|${dayKey(iso)}`;
      salesByMachineDay.set(key, (salesByMachineDay.get(key) || 0) + grossCents / 100);
    }

    const out: RunAgg[] = [];
    for (const r of runs) {
      const id = String(r.id ?? "");
      const startedISO = r[startKey] as string | null | undefined;
      const finishedISO = r[endKey] as string | null | undefined;
      const start = startedISO ? new Date(startedISO) : null;
      const end = finishedISO ? new Date(finishedISO) : null;
      const durMs = start && end ? Math.max(0, end.getTime() - start.getTime()) : 0;
      const durH = hours(durMs);

      const stopsForRun = byRun.get(id) || [];

      // stop-level dynamic picks
      let stopsCount = 0;
      let serviceMin = 0;
      let miles = 0;
      const machinesVisited = new Set<string>();

      for (const st of stopsForRun) {
        stopsCount += 1;
        const mid = String(st.machine_id ?? "");
        if (mid) machinesVisited.add(mid);

        const svcMinCol = pick(st, ["service_minutes", "service_mins"]);
        if (svcMinCol && Number.isFinite(Number(st[svcMinCol]))) {
          serviceMin += Number(st[svcMinCol]) || 0;
        } else {
          const arrKey = pick(st, ["arrived_at", "arrival_at", "arrived"]);
          const depKey = pick(st, ["departed_at", "departure_at", "departed"]);
          const a = arrKey && st[arrKey] ? new Date(st[arrKey]) : null;
          const d = depKey && st[depKey] ? new Date(st[depKey]) : null;
          if (a && d) serviceMin += minutes(d.getTime() - a.getTime());
        }

        const milesCol = pick(st, ["miles", "distance_miles"]);
        if (milesCol && Number.isFinite(Number(st[milesCol]))) {
          miles += Number(st[milesCol]) || 0;
        }
      }

      if (miles === 0 && odoStartKey && odoEndKey && Number.isFinite(Number(r[odoStartKey!])) && Number.isFinite(Number(r[odoEndKey!]))) {
        miles = Math.max(0, Number(r[odoEndKey!]) - Number(r[odoStartKey!]));
      }

      // same-day sales for visited machines (day of startedAt)
      let sameDaySales = 0;
      if (start) {
        const day = startedISO!.slice(0, 10);
        for (const mid of machinesVisited) {
          const key = `${mid}|${day}`;
          sameDaySales += salesByMachineDay.get(key) || 0;
        }
      }

      const mph = durH > 0 ? sameDaySales / durH : 0;
      const mps = stopsCount > 0 ? miles / stopsCount : 0;
      const minPerStop = stopsCount > 0 ? serviceMin / stopsCount : 0;

      out.push({
        id,
        route: String(r[routeKey] ?? "—"),
        driver: String(r[driverKey] ?? "—"),
        startedAt: startedISO ?? null,
        finishedAt: finishedISO ?? null,
        odometerStart: odoStartKey ? Number(r[odoStartKey]) || null : null,
        odometerEnd: odoEndKey ? Number(r[odoEndKey]) || null : null,
        miles,
        stops: stopsCount,
        machinesVisited: machinesVisited.size,
        serviceMinutes: serviceMin,
        sales: sameDaySales,
        salesPerHour: mph,
        milesPerStop: mps,
        minPerStop: minPerStop,
      });
    }

    // Latest first
    out.sort((a, b) => {
      const ta = a.startedAt ? new Date(a.startedAt).getTime() : 0;
      const tb = b.startedAt ? new Date(b.startedAt).getTime() : 0;
      return tb - ta;
    });
    return out;
  }, [haveRuns, haveStops, runs, stops, sales]);

  const routes = useMemo(() => {
    const routeSet = new Set(aggs.map(r => r.route).filter(r => r !== "—"));
    return Array.from(routeSet).sort();
  }, [aggs]);

  const drivers = useMemo(() => {
    const driverSet = new Set(aggs.map(r => r.driver).filter(d => d !== "—"));
    return Array.from(driverSet).sort();
  }, [aggs]);

  const filteredAggs = useMemo(() => {
    return aggs.filter(run => {
      const routeMatch = filterRoute === "all" || run.route === filterRoute;
      const driverMatch = filterDriver === "all" || run.driver === filterDriver;
      const searchMatch = !searchTerm || 
        run.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
        run.driver.toLowerCase().includes(searchTerm.toLowerCase());
      return routeMatch && driverMatch && searchMatch;
    });
  }, [aggs, filterRoute, filterDriver, searchTerm]);

  const exportRouteCSV = () => {
    if (!filteredAggs.length) {
      toast({
        title: "No data to export",
        description: "No route data available for export",
        variant: "destructive"
      });
      return;
    }

    const headers = [
      'Date', 'Route', 'Driver', 'Stops', 'Machines', 'Service (min)',
      'Miles', 'Sales ($)', 'Sales/hr', 'Miles/stop', 'Min/stop'
    ];
    
    const csvContent = [
      headers.join(','),
      ...filteredAggs.map(r => [
        r.startedAt ? new Date(r.startedAt).toLocaleDateString() : "—",
        r.route,
        r.driver,
        fmtInt(r.stops),
        fmtInt(r.machinesVisited),
        fmt1(r.serviceMinutes),
        fmt1(r.miles),
        fmt(r.sales),
        fmt1(r.salesPerHour),
        fmt1(r.milesPerStop),
        fmt1(r.minPerStop)
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `route-efficiency-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export successful",
      description: "Route efficiency report has been downloaded"
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-destructive">Error: {err}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Header 
          title="Route Efficiency" 
          subtitle={`Performance metrics and analytics for the last ${days} days`}
        />
        <div className="flex gap-2">
          <Select value={days.toString()} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="14">14 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportRouteCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {!haveRuns || !haveStops ? (
        <SQLNotice
          title="Optional: create route_runs and route_stops to unlock Route Efficiency"
          sql={`-- Minimal schema to track restock runs & stops
create table if not exists public.route_runs (
  id uuid primary key default gen_random_uuid(),
  route_name text,
  driver text,
  started_at timestamptz,
  finished_at timestamptz,
  odometer_start numeric,
  odometer_end numeric
);

create table if not exists public.route_stops (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.route_runs(id) on delete cascade,
  machine_id uuid not null references public.machines(id) on delete cascade,
  arrived_at timestamptz,
  departed_at timestamptz,
  service_minutes integer,
  miles numeric
);

-- Example seed (delete later):
insert into public.route_runs(route_name, driver, started_at, finished_at, odometer_start, odometer_end)
values ('Downtown A', 'Chris', now() - interval '3 hours', now(), 10231, 10246)
returning id;`}
        />
      ) : null}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Route Details</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Enhanced KPIs */}
          <RouteKPIs />
          
          {/* Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopRoutes />
            <TopDrivers />
          </div>
          
          <DailyTrends />
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search routes or drivers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Route:</label>
                  <Select value={filterRoute} onValueChange={setFilterRoute}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Routes</SelectItem>
                      {routes.map(route => (
                        <SelectItem key={route} value={route}>
                          {route}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Driver:</label>
                  <Select value={filterDriver} onValueChange={setFilterDriver}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Drivers</SelectItem>
                      {drivers.map(driver => (
                        <SelectItem key={driver} value={driver}>
                          {driver}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Route Details Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <RouteIcon className="h-5 w-5" />
                  Route Details ({filteredAggs.length} runs)
                </span>
                <Badge variant="secondary">
                  ${filteredAggs.reduce((sum, r) => sum + r.sales, 0).toFixed(0)} total revenue
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead className="text-right">Stops</TableHead>
                      <TableHead className="text-right">Machines</TableHead>
                      <TableHead className="text-right">Service (min)</TableHead>
                      <TableHead className="text-right">Miles</TableHead>
                      <TableHead className="text-right">Sales ($)</TableHead>
                      <TableHead className="text-right">Sales/hr</TableHead>
                      <TableHead className="text-right">Miles/stop</TableHead>
                      <TableHead className="text-right">Min/stop</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAggs.length ? filteredAggs.map(r => (
                      <TableRow key={r.id}>
                        <TableCell>{r.startedAt ? new Date(r.startedAt).toLocaleDateString() : "—"}</TableCell>
                        <TableCell>
                          <div className="font-medium">{r.route}</div>
                        </TableCell>
                        <TableCell>{r.driver}</TableCell>
                        <TableCell className="text-right">{fmtInt(r.stops)}</TableCell>
                        <TableCell className="text-right">{fmtInt(r.machinesVisited)}</TableCell>
                        <TableCell className="text-right">{fmt1(r.serviceMinutes)}</TableCell>
                        <TableCell className="text-right">{fmt1(r.miles)}</TableCell>
                        <TableCell className="text-right font-medium">{fmt(r.sales)}</TableCell>
                        <TableCell className="text-right">{fmt1(r.salesPerHour)}</TableCell>
                        <TableCell className="text-right">{fmt1(r.milesPerStop)}</TableCell>
                        <TableCell className="text-right">{fmt1(r.minPerStop)}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={11}>
                          <div className="py-8 text-center text-muted-foreground">
                            {haveRuns && haveStops
                              ? "No runs match the current filters."
                              : "Create the tables with the SQL above to start tracking route efficiency."}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopRoutes />
            <TopDrivers />
          </div>
          <DailyTrends />
        </TabsContent>
      </Tabs>
    </div>
  );
}