import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useScope } from "@/context/Scope";
import { useFeeRuleCache, aggregateWithFees, money as fmtMoney } from "@/utils/fees";
import { BarChart3, Download, Info, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

type Any = Record<string, any>;
const money = (n:number)=> fmtMoney(Number.isFinite(n)?n:0);

function csv(s: string) {
  const v = String(s ?? "");
  if (v.includes(",") || v.includes('"') || v.includes("\n")) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export default function MachineROI() {
  const scope = useScope();
  const { feeFor, loading: feeLoading } = useFeeRuleCache();

  const [machines, setMachines] = useState<Any[]>([]);
  const [sales, setSales] = useState<Any[]>([]);
  const [finance, setFinance] = useState<Any[]>([]);
  const [locations, setLocations] = useState<Any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string|null>(null);

  const monthsFactor = useMemo(() => {
    const start = new Date(scope.startISO).getTime();
    const end = new Date(scope.endISO).getTime();
    const days = Math.max(1, Math.round((end - start) / 86_400_000) + 1);
    return days / 30;
  }, [scope.startISO, scope.endISO]);

  useEffect(() => {
    (async () => {
      setLoading(true); setErr(null);
      try {
        // Machines (respect location scope if set)
        const mq = supabase.from("machines").select("id,name,location_id").limit(100000);
        if (scope.locationId) mq.eq("location_id", scope.locationId);
        const m = await mq;
        if (m.error) throw m.error;
        const mRows = m.data || [];
        setMachines(mRows);
        const ids = mRows.map((r:any)=>r.id);

        // Sales in scoped period
        let sRes:any = { data: [] };
        if (ids.length) {
          sRes = await supabase
            .from("sales")
            .select("machine_id, qty, unit_price_cents, unit_cost_cents, occurred_at")
            .in("machine_id", ids)
            .gte("occurred_at", scope.startISO)
            .lte("occurred_at", scope.endISO)
            .limit(500000);
          if (sRes.error) throw sRes.error;
        }
        setSales(sRes.data || []);

        // Finance rows for these machines
        let fRes:any = { data: [] };
        if (ids.length) {
          fRes = await supabase
            .from("machine_finance")
            .select("machine_id, monthly_payment_cents, purchase_price_cents, apr_bps")
            .in("machine_id", ids)
            .limit(100000);
          if (fRes.error) throw fRes.error;
        }
        setFinance(fRes.data || []);

        // Locations (commission settings)
        const loc = await supabase
          .from("locations")
          .select("id, name, commission_model, commission_pct_bps, commission_flat_cents, commission_min_cents")
          .limit(100000);
        if (loc.error) throw loc.error;
        setLocations(loc.data || []);
      } catch (e:any) {
        setErr(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [scope.startISO, scope.endISO, scope.locationId]);

  const rows = useMemo(() => {
    const byMachineSales = new Map<string, Any[]>();
    for (const s of sales) {
      const mid = String(s.machine_id);
      if (!byMachineSales.has(mid)) byMachineSales.set(mid, []);
      byMachineSales.get(mid)!.push(s);
    }
    const financeByMachine = new Map<string, Any>();
    for (const f of finance) financeByMachine.set(String(f.machine_id), f);
    const locById = new Map<string, Any>();
    for (const l of locations) locById.set(String(l.id), l);

    const out: Array<{
      machine_id: string;
      machine_name: string;
      location_name: string;
      gross: number;
      fees: number;
      cogs: number;
      net: number;
      paymentMonthly: number;
      commissionPeriod: number;
      ownerNetPeriod: number;
    }> = [];

    for (const m of machines) {
      const mid = String(m.id);
      const name = m.name || mid;
      const loc = locById.get(String(m.location_id));
      const machineSales = (byMachineSales.get(mid) || []).map((r:any)=>({
        machine_id: mid,
        qty: Number(r.qty)||0,
        unit_price_cents: Number(r.unit_price_cents)||0,
        unit_cost_cents: Number(r.unit_cost_cents)||0,
      }));

      const agg = aggregateWithFees(machineSales, feeFor); // { gross, fees, cogs, net } in dollars
      const payMonthly = (Number(financeByMachine.get(mid)?.monthly_payment_cents || 0))/100;

      // Commission model
      const model = (loc?.commission_model ?? "none") as "none"|"percent_gross"|"flat_month"|"hybrid";
      const pct_bps = Number(loc?.commission_pct_bps ?? 0);
      const flat_month = (Number(loc?.commission_flat_cents ?? 0))/100;
      const min_month = (Number(loc?.commission_min_cents ?? 0))/100;

      const percentComp = (model==="percent_gross" || model==="hybrid") ? (agg.gross * (pct_bps/10000)) : 0;
      const flatComp = (model==="flat_month" || model==="hybrid") ? flat_month * monthsFactor : 0;
      const commission = Math.max(percentComp + flatComp, (min_month * monthsFactor));

      const ownerNet = agg.net - (payMonthly * monthsFactor) - commission;

      out.push({
        machine_id: mid,
        machine_name: name,
        location_name: loc?.name || "",
        gross: agg.gross,
        fees: agg.fees,
        cogs: agg.cogs,
        net: agg.net,
        paymentMonthly: payMonthly,
        commissionPeriod: commission,
        ownerNetPeriod: ownerNet,
      });
    }

    // sort worst performers first (owner net)
    out.sort((a, b) => a.ownerNetPeriod - b.ownerNetPeriod);
    return out;
  }, [machines, sales, finance, locations, feeFor, monthsFactor]);

  function exportCSV() {
    const headers = ["Machine","Location","Gross","Fees","COGS","Net (period)","Payment / mo","Commission (period)","Owner Net (period)","Scope"];
    const lines = [headers.join(",")];
    for (const r of rows) {
      lines.push([
        csv(r.machine_name),
        csv(r.location_name),
        r.gross.toFixed(2),
        r.fees.toFixed(2),
        r.cogs.toFixed(2),
        r.net.toFixed(2),
        r.paymentMonthly.toFixed(2),
        r.commissionPeriod.toFixed(2),
        r.ownerNetPeriod.toFixed(2),
        csv(scope.label),
      ].join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `machine_roi_${scope.label.replace(/\s+/g,"_").toLowerCase()}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  if (loading || feeLoading) return <div className="p-6 text-sm text-muted-foreground">Computing ROI…</div>;
  if (err) return <div className="p-6 text-sm text-rose-400">Error: {err}</div>;

  const totals = rows.reduce((acc, r) => ({
    gross: acc.gross + r.gross,
    fees: acc.fees + r.fees,
    cogs: acc.cogs + r.cogs,
    net: acc.net + r.net,
    commission: acc.commission + r.commissionPeriod,
    owner: acc.owner + r.ownerNetPeriod,
  }), { gross:0, fees:0, cogs:0, net:0, commission:0, owner:0 });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Machine ROI — <span className="text-base text-muted-foreground">{scope.label}</span>
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={()=>window.location.reload()} className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button onClick={exportCSV} className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted">
            <Download className="h-4 w-4" /> CSV
          </button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground flex items-start gap-2">
        <Info className="h-4 w-4 mt-0.5" />
        <span>
          ROI is calculated for the selected period using sales (gross, COGS, processor fees), and subtracting prorated monthly costs (finance payments, location commissions).
          {scope.locationId ? " Only machines at the selected location are included." : ""}
        </span>
      </div>

      <div className="rounded-xl border border-border overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <Th>Machine</Th>
              <Th>Location</Th>
              <Th className="text-right">Gross</Th>
              <Th className="text-right">Fees</Th>
              <Th className="text-right">COGS</Th>
              <Th className="text-right">Net (period)</Th>
              <Th className="text-right">Payment / mo</Th>
              <Th className="text-right">Commission (period)</Th>
              <Th className="text-right">Owner Net (period)</Th>
              <Th> </Th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map(r => (
              <tr key={r.machine_id} className="odd:bg-card/50">
                <Td>
                  <Link to={`/machines/${r.machine_id}`} className="hover:underline">{r.machine_name}</Link>
                </Td>
                <Td>{r.location_name || "—"}</Td>
                <Td className="text-right">{money(r.gross)}</Td>
                <Td className="text-right">{money(r.fees)}</Td>
                <Td className="text-right">{money(r.cogs)}</Td>
                <Td className="text-right font-medium">{money(r.net)}</Td>
                <Td className="text-right">{money(r.paymentMonthly)}</Td>
                <Td className="text-right">{money(r.commissionPeriod)}</Td>
                <Td className={`text-right font-semibold ${r.ownerNetPeriod>=0 ? "text-emerald-400" : "text-rose-400"}`}>{money(r.ownerNetPeriod)}</Td>
                <Td className="text-right">
                  <Link to={`/tickets/new?machine=${r.machine_id}`} className="text-xs rounded-md border border-border px-2 py-1 hover:bg-muted">New Ticket</Link>
                </Td>
              </tr>
            )) : (
              <tr><Td colSpan={10}><div className="py-6 text-center text-muted-foreground">No machines with sales in this scope.</div></Td></tr>
            )}
          </tbody>
          <tfoot>
            <tr className="bg-muted/50">
              <Td className="font-medium">Totals</Td>
              <Td> </Td>
              <Td className="text-right font-medium">{money(totals.gross)}</Td>
              <Td className="text-right font-medium">{money(totals.fees)}</Td>
              <Td className="text-right font-medium">{money(totals.cogs)}</Td>
              <Td className="text-right font-semibold">{money(totals.net)}</Td>
              <Td> </Td>
              <Td className="text-right font-medium">{money(totals.commission)}</Td>
              <Td className="text-right font-semibold">{money(totals.owner)}</Td>
              <Td> </Td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2 text-left ${className}`}>{children}</th>;
}
function Td({ children, className = "", colSpan }: { children: React.ReactNode; className?: string; colSpan?: number }) {
  return <td className={`px-3 py-2 ${className}`} colSpan={colSpan}>{children}</td>;
}