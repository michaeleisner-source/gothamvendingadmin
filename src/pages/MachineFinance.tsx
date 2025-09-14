import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, TrendingUp } from "lucide-react";
import { 
  SalesRow, 
  num, 
  cents, 
  fmt, 
  daysBetween, 
  safeDate 
} from "@/lib/machine-ops-utils";

type SimpleMachine = {
  id: string;
  name?: string | null;
  location_id?: string | null;
  created_at?: string | null;
};

export default function MachineFinance() {
  const [machines, setMachines] = useState<SimpleMachine[]>([]);
  const [sales30, setSales30] = useState<Record<string, { gross: number; cost: number; fees: number; net: number }>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true); 
      setErr(null);
      
      // Machines with available fields
      const { data: m, error: e1 } = await supabase
        .from("machines")
        .select("id, name, location_id, created_at")
        .order("name", { ascending: true });
      if (e1) { 
        setErr(e1.message); 
        setLoading(false); 
        return; 
      }
      setMachines((m || []) as SimpleMachine[]);

      // Last 30d sales → group by machine
      const since = new Date(Date.now() - 30 * 864e5).toISOString();
      const { data: s, error: e2 } = await supabase
        .from("sales")
        .select("machine_id, qty, unit_price_cents, unit_cost_cents, occurred_at")
        .gte("occurred_at", since);
      if (e2) { 
        setErr(e2.message); 
        setLoading(false); 
        return; 
      }
      
      const by: Record<string, { gross: number; cost: number; fees: number; net: number }> = {};
      (s || []).forEach((r: SalesRow) => {
        const k = r.machine_id; 
        if (!k) return;
        const qty = num(r.qty);
        const gross = qty * cents(r.unit_price_cents);
        const cost = qty * cents(r.unit_cost_cents);
        const fees = 0; // Fee calculation not available in current schema
        if (!by[k]) by[k] = { gross: 0, cost: 0, fees: 0, net: 0 };
        by[k].gross += gross; 
        by[k].cost += cost; 
        by[k].fees += fees; 
        by[k].net += (gross - cost - fees);
      });
      setSales30(by);
      setLoading(false);
    })();
  }, []);

  function monthlyDepreciation() {
    // Placeholder calculation - finance fields not available in current schema
    // This would use machine_finance table data if available
    const estimatedMonthlyCost = 100; // Placeholder value
    return { monthlyCost: estimatedMonthlyCost, isLease: false, dep: estimatedMonthlyCost };
  }

  const rows = useMemo(() => {
    return machines.map((m) => {
      const finance = monthlyDepreciation();
      const s = sales30[m.id] || { gross: 0, cost: 0, fees: 0, net: 0 };
      const roiDen = finance.monthlyCost || 0.01;
      const roiPct = (s.net / roiDen) * 100;
      const acq = safeDate(m.created_at);
      const monthsInService = acq ? Math.max(1, Math.round(daysBetween(new Date(), acq) / 30)) : undefined;
      return {
        ...m,
        ...s,
        monthlyFinanceCost: finance.monthlyCost,
        isLease: finance.isLease,
        roiPct,
        monthsInService,
      };
    }).sort((a, b) => b.net - a.net);
  }, [machines, sales30]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <DollarSign className="h-5 w-5" /> Machine Finance — Overview
        </h1>
        <div className="flex gap-2">
          <Link to="/reports/machine-roi" className="rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted inline-flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Machine ROI Report
          </Link>
        </div>
      </div>

      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {err && <div className="text-sm text-red-400">Error: {err}</div>}

      {!loading && !err && (
        <>
          {rows.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
              No machines found. Once you add machines and finance fields (purchase/lease), this view will compute ROI.
            </div>
          ) : (
            <div className="overflow-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left">Machine</th>
                    <th className="px-3 py-2 text-left">Location</th>
                    <th className="px-3 py-2 text-right">30d Gross</th>
                    <th className="px-3 py-2 text-right">30d Cost</th>
                    <th className="px-3 py-2 text-right">30d Fees</th>
                    <th className="px-3 py-2 text-right">30d Net</th>
                    <th className="px-3 py-2 text-right">Finance (Monthly)</th>
                    <th className="px-3 py-2 text-right">ROI (30d ÷ Monthly)</th>
                    <th className="px-3 py-2 text-left">Finance Type</th>
                    <th className="px-3 py-2 text-left">In Service</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="odd:bg-card/50">
                      <td className="px-3 py-2">
                        <Link to={`/machines/${r.id}`} className="hover:underline">
                          {r.name || r.id}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {r.location_id ? (
                          <Link to={`/locations/${r.location_id}`} className="hover:underline">
                            {r.location_id}
                          </Link>
                        ) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right">{fmt(r.gross)}</td>
                      <td className="px-3 py-2 text-right">{fmt(r.cost)}</td>
                      <td className="px-3 py-2 text-right">{fmt(r.fees)}</td>
                      <td className="px-3 py-2 text-right font-medium">{fmt(r.net)}</td>
                      <td className="px-3 py-2 text-right">{fmt(r.monthlyFinanceCost || 0)}</td>
                      <td className="px-3 py-2 text-right">
                        {isFinite(r.roiPct) ? `${r.roiPct.toFixed(0)}%` : "—"}
                      </td>
                      <td className="px-3 py-2">purchase</td>
                      <td className="px-3 py-2 text-xs">
                        {r.monthsInService ? `${r.monthsInService} mo` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            ROI uses <b>last 30 days Net</b> / <b>Monthly finance cost</b> (lease payment or straight-line depreciation).
            <br />
            <em>Note: Finance calculations use placeholder values. Add machine_finance table for accurate data.</em>
          </p>
        </>
      )}
    </div>
  );
}