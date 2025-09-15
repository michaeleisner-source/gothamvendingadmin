import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, RefreshCw, TrendingUp, DollarSign, Activity, Target } from "lucide-react";

type Row = { 
  machine_id: string; 
  occurred_at: string;
  qty: number;
  unit_price_cents: number;
  unit_cost_cents?: number;
} & Record<string, any>;

// Utility functions
function pickNum(obj: Record<string, any>, keys: string[]): number {
  for (const key of keys) {
    if (key in obj && obj[key] != null) {
      const val = Number(obj[key]);
      if (!isNaN(val)) return val;
    }
  }
  return 0;
}

function num(value: any): number {
  const val = Number(value);
  return isNaN(val) ? 0 : val;
}

function fmt(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

export default function SalesSummary7d() {
  const [rows, setRows] = useState<Row[]>([]);
  const [machines, setMachines] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);

      // 1) pull last 7 days of sales
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: sales, error: e1 } = await supabase
        .from("sales")
        .select("machine_id, occurred_at, qty, unit_price_cents, unit_cost_cents")
        .gte("occurred_at", since);

      if (e1) { setErr(e1.message); setLoading(false); return; }

      setRows((sales || []) as Row[]);

      // 2) map machine_id → name
      const { data: m, error: e2 } = await supabase
        .from("machines")
        .select("id, name");

      if (!e2 && m) {
        const map: Record<string, string> = {};
        for (const r of m) map[r.id] = r.name ?? r.id;
        setMachines(map);
      }

      setLoading(false);
    })();
  }, []);

  const agg = useMemo(() => {
    const by: Record<string, { grossCents: number; costCents: number; netCents: number; count: number }> = {};
    
    for (const r of rows) {
      const grossCents = r.qty * r.unit_price_cents;
      const costCents = r.qty * (r.unit_cost_cents || 0);
      const netCents = grossCents - costCents;

      if (!by[r.machine_id]) {
        by[r.machine_id] = { grossCents: 0, costCents: 0, netCents: 0, count: 0 };
      }
      
      by[r.machine_id].grossCents += grossCents;
      by[r.machine_id].costCents += costCents;
      by[r.machine_id].netCents += netCents;
      by[r.machine_id].count += 1;
    }
    
    return Object.entries(by)
      .map(([mid, v]) => ({ 
        machine_id: mid, 
        name: machines[mid] || mid, 
        ...v 
      }))
      .sort((a, b) => b.netCents - a.netCents);
  }, [rows, machines]);

  // Calculate KPI metrics
  const kpiMetrics = useMemo(() => {
    const totalTransactions = agg.reduce((sum, r) => sum + r.count, 0);
    const totalGross = agg.reduce((sum, r) => sum + r.grossCents, 0) / 100;
    const totalCost = agg.reduce((sum, r) => sum + r.costCents, 0) / 100;
    const totalNet = agg.reduce((sum, r) => sum + r.netCents, 0) / 100;
    const avgTransactionValue = totalTransactions > 0 ? totalGross / totalTransactions : 0;
    const profitMargin = totalGross > 0 ? (totalNet / totalGross) * 100 : 0;

    return {
      totalTransactions,
      totalGross,
      totalCost,
      totalNet,
      avgTransactionValue,
      profitMargin,
      activeMachines: agg.length
    };
  }, [agg]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid grid-cols-4 gap-4">
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
        <div className="text-sm text-destructive">Error: {err}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales Summary</h1>
          <p className="text-muted-foreground">Revenue analysis for the last 7 days</p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Total Revenue</p>
                <p className="text-2xl font-bold text-green-800">${kpiMetrics.totalGross.toFixed(0)}</p>
                <p className="text-xs text-green-600">7-day gross sales</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Profit</p>
                <p className="text-2xl font-bold">${kpiMetrics.totalNet.toFixed(0)}</p>
                <p className="text-xs text-blue-600">{kpiMetrics.profitMargin.toFixed(1)}% margin</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold">{kpiMetrics.totalTransactions.toLocaleString()}</p>
                <p className="text-xs text-purple-600">Total sales count</p>
              </div>
              <Activity className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Transaction</p>
                <p className="text-2xl font-bold">${kpiMetrics.avgTransactionValue.toFixed(2)}</p>
                <p className="text-xs text-orange-600">Per sale value</p>
              </div>
              <Target className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-600">${kpiMetrics.totalGross.toFixed(0)}</div>
              <p className="text-sm text-muted-foreground">Gross Revenue</p>
              <p className="text-xs text-green-600">Total sales value</p>
            </div>
            
            <div className="space-y-2">
              <div className="text-2xl font-bold text-red-600">${kpiMetrics.totalCost.toFixed(0)}</div>
              <p className="text-sm text-muted-foreground">Cost of Goods</p>
              <p className="text-xs text-red-600">Total COGS</p>
            </div>
            
            <div className="space-y-2">
              <div className="text-2xl font-bold text-blue-600">{kpiMetrics.activeMachines}</div>
              <p className="text-sm text-muted-foreground">Active Machines</p>
              <p className="text-xs text-blue-600">With sales</p>
            </div>
          </div>

          {kpiMetrics.profitMargin < 20 && kpiMetrics.totalGross > 0 && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 text-orange-700">
                <TrendingUp className="w-4 h-4" />
                <span className="font-medium">Low margin alert</span>
              </div>
              <p className="text-sm text-orange-600 mt-1">
                Profit margin is below 20%. Consider reviewing pricing strategy.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sales Data Table */}
      {agg.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No sales data</h3>
            <p className="text-muted-foreground">No sales recorded in the last 7 days.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Sales by Machine ({agg.length} machines)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left">Machine</th>
                    <th className="px-3 py-2 text-right">Transactions</th>
                    <th className="px-3 py-2 text-right">Gross Revenue</th>
                    <th className="px-3 py-2 text-right">Cost</th>
                    <th className="px-3 py-2 text-right">Net Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {agg.map(r => (
                    <tr key={r.machine_id} className="odd:bg-card/50">
                      <td className="px-3 py-2 font-medium">{r.name}</td>
                      <td className="px-3 py-2 text-right">{r.count.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right font-mono">{fmt(r.grossCents)}</td>
                      <td className="px-3 py-2 text-right font-mono text-muted-foreground">{fmt(r.costCents)}</td>
                      <td className="px-3 py-2 text-right font-mono font-semibold">{fmt(r.netCents)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted border-t">
                  <tr className="font-semibold">
                    <td className="px-3 py-2">Total</td>
                    <td className="px-3 py-2 text-right">{kpiMetrics.totalTransactions.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right font-mono">${kpiMetrics.totalGross.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-mono">${kpiMetrics.totalCost.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-mono">${kpiMetrics.totalNet.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}