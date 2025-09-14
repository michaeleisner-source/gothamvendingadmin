import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  if (err) return <div className="p-6 text-sm text-destructive">Error: {err}</div>;
  if (agg.length === 0) return <div className="p-6 text-sm text-muted-foreground">No sales in the last 7 days.</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-3">Sales Summary (Last 7 Days)</h1>
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
              <td className="px-3 py-2 text-right">{agg.reduce((sum, r) => sum + r.count, 0).toLocaleString()}</td>
              <td className="px-3 py-2 text-right font-mono">{fmt(agg.reduce((sum, r) => sum + r.grossCents, 0))}</td>
              <td className="px-3 py-2 text-right font-mono">{fmt(agg.reduce((sum, r) => sum + r.costCents, 0))}</td>
              <td className="px-3 py-2 text-right font-mono">{fmt(agg.reduce((sum, r) => sum + r.netCents, 0))}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}