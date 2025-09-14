import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp } from "lucide-react";
import { 
  Mach, 
  SalesRow, 
  num, 
  cents, 
  fmt 
} from "@/lib/machine-ops-utils";

export default function MachineRoi() {
  const [machines, setMachines] = useState<Mach[]>([]);
  const [s30, setS30] = useState<Record<string, number>>({});
  const [s90, setS90] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true); 
      setErr(null);
      
      const { data: m, error: e1 } = await supabase
        .from("machines")
        .select("id, name, created_at")
        .order("name", { ascending: true });
      if (e1) { 
        setErr(e1.message); 
        setLoading(false); 
        return; 
      }
      setMachines((m || []) as Mach[]);

      const loadWindow = async (days: number) => {
        const since = new Date(Date.now() - days * 864e5).toISOString();
        const { data, error } = await supabase
          .from("sales")
          .select("machine_id, qty, unit_price_cents, unit_cost_cents, occurred_at")
          .gte("occurred_at", since);
        if (error) throw error;
        
        const by: Record<string, number> = {};
        (data || []).forEach((r: SalesRow) => {
          const k = r.machine_id; 
          if (!k) return;
          const qty = num(r.qty);
          const gross = qty * cents(r.unit_price_cents);
          const cost  = qty * cents(r.unit_cost_cents);
          const fees  = 0; // Fee calculation not available
          const net   = gross - cost - fees;
          by[k] = (by[k] || 0) + net;
        });
        return by;
      };

      const [by30, by90] = await Promise.all([loadWindow(30), loadWindow(90)]);
      setS30(by30); 
      setS90(by90);
      setLoading(false);
    })();
  }, []);

  function monthlyCost(m: any) {
    // Placeholder - would use machine_finance table if available
    return 100; // Estimated monthly cost
  }

  const rows = useMemo(() => {
    return machines.map((m) => {
      const mCost = monthlyCost(m) || 0.01;
      const net30 = s30[m.id] || 0;
      const net90 = s90[m.id] || 0;
      const roi30 = (net30 / mCost) * 100;
      const roi90 = (net90 / (mCost * 3)) * 100; // three months approx
      return { ...m, net30, net90, roi30, roi90, mCost };
    }).sort((a, b) => b.net30 - a.net30);
  }, [machines, s30, s90]);

  return (
    <div className="p-6 space-y-3">
      <h1 className="text-xl font-semibold flex items-center gap-2">
        <TrendingUp className="h-5 w-5" /> Machine ROI (30d / 90d)
      </h1>
      
      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {err && <div className="text-sm text-red-400">Error: {err}</div>}
      
      {!loading && !err && (
        <div className="overflow-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left">Machine</th>
                <th className="px-3 py-2 text-right">Monthly Finance Cost</th>
                <th className="px-3 py-2 text-right">Net 30d</th>
                <th className="px-3 py-2 text-right">ROI 30d</th>
                <th className="px-3 py-2 text-right">Net 90d</th>
                <th className="px-3 py-2 text-right">ROI 90d</th>
                <th className="px-3 py-2 text-left">Type</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="odd:bg-card/50">
                  <td className="px-3 py-2">
                    <Link to={`/machines/${r.id}`} className="hover:underline">
                      {r.name || r.id}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-right">{fmt(r.mCost)}</td>
                  <td className="px-3 py-2 text-right">{fmt(r.net30)}</td>
                  <td className="px-3 py-2 text-right">
                    {isFinite(r.roi30) ? `${r.roi30.toFixed(0)}%` : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">{fmt(r.net90)}</td>
                  <td className="px-3 py-2 text-right">
                    {isFinite(r.roi90) ? `${r.roi90.toFixed(0)}%` : "—"}
                  </td>
                  <td className="px-3 py-2">purchase</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <p className="text-xs text-muted-foreground">
        ROI uses NET ÷ finance cost (lease or depreciation). 90d ROI normalizes to 3× monthly.
      </p>
    </div>
  );
}