import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { KPIBar, KPI } from "@/components/machine-ops/KPI";
import { useFeeRuleCache, aggregateWithFees, money as fmtMoney } from "@/utils/fees";

type Any = Record<string, any>;
const money = (n: number) => fmtMoney(Number.isFinite(n) ? n : 0);

function startISO(days=30){ const d=new Date(); d.setDate(d.getDate()-days); return d.toISOString(); }

export default function LocationKPIs({ locationId }: { locationId: string }) {
  const [machines, setMachines] = useState<Any[]>([]);
  const [sales, setSales] = useState<Any[]>([]);
  const [loc, setLoc] = useState<Any|null>(null);
  const [tickets, setTickets] = useState<number>(0);
  const [err, setErr] = useState<string|null>(null);
  const [loading, setLoading] = useState(true);

  const { feeFor, loading: feeLoading } = useFeeRuleCache();
  const since = useMemo(()=>startISO(30),[]);

  useEffect(() => {
    (async () => {
      setLoading(true); setErr(null);
      try {
        const m = await supabase.from("machines").select("id,name").eq("location_id", locationId).limit(10000);
        if (m.error) throw m.error;
        setMachines(m.data || []);

        const ids = (m.data||[]).map((r:any)=>r.id);
        if (ids.length) {
          try {
            const s = await supabase
              .from("sales" as any)
              .select("machine_id, qty, unit_price_cents, unit_cost_cents, occurred_at")
              .in("machine_id", ids)
              .gte("occurred_at", since)
              .limit(200000);
            if (!s.error && s.data) {
              setSales(s.data);
            } else {
              setSales([]);
            }
          } catch {
            setSales([]);
          }
        } else {
          setSales([]);
        }

        const l = await supabase.from("locations").select("id,name,commission_model,commission_pct_bps,commission_flat_cents,commission_min_cents").eq("id", locationId).single();
        if (l.error) throw l.error;
        setLoc(l.data);

        // tickets (best-effort) - handle if table doesn't exist
        try {
          const t = await supabase.from("tickets" as any).select("id,status").eq("location_id", locationId).limit(10000);
          if (!t.error && t.data) {
            const open = t.data.filter((x:any)=>!x.status || !/closed|resolved/i.test(String(x.status))).length;
            setTickets(open);
          } else {
            setTickets(0);
          }
        } catch {
          setTickets(0);
        }
      } catch (e:any) {
        setErr(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [locationId, since]);

  const kpi = useMemo(() => {
    // Aggregate sales with estimated fees
    const agg = aggregateWithFees(
      (sales||[]).map((r:any)=>({
        machine_id: r.machine_id,
        qty: Number(r.qty)||0,
        unit_price_cents: Number(r.unit_price_cents)||0,
        unit_cost_cents: Number(r.unit_cost_cents)||0,
      })),
      feeFor
    );
    const gross30d = agg.gross;
    const net30d = agg.net;

    // Commission (monthly, last 30d ≈ month)
    const model = (loc?.commission_model ?? "none");
    const pct_bps = Number(loc?.commission_pct_bps ?? 0);
    const flat_month = Number(loc?.commission_flat_cents ?? 0) / 100;
    const min_month  = Number(loc?.commission_min_cents ?? 0) / 100;

    const percentComp = (model === "percent_gross" || model === "hybrid") ? (gross30d * (pct_bps/10000)) : 0;
    const flatComp = (model === "flat_month" || model === "hybrid") ? flat_month : 0;
    const commissionMonthly = Math.max(percentComp + flatComp, min_month);

    return {
      machines: machines.length,
      gross30d, net30d,
      commissionMonthly,
      openTickets: tickets
    };
  }, [sales, feeFor, loc, machines.length, tickets]);

  if (loading || feeLoading) return <KPIBar><KPI label="Loading location KPIs…" value="—" /></KPIBar>;
  if (err) return <KPIBar><KPI label="Location KPIs Error" value="!" hint={err} intent="bad"/></KPIBar>;

  return (
    <KPIBar>
      <KPI label="Machines on Site" value={kpi.machines} />
      <KPI label="Gross (30d)" value={money(kpi.gross30d)} />
      <KPI label="Net (30d, after fees/COGS)" value={money(kpi.net30d)} intent={kpi.net30d>=0?"good":"bad"} />
      <KPI label="Commission / mo" value={money(kpi.commissionMonthly)} />
      <KPI label="Open Tickets" value={kpi.openTickets} intent={kpi.openTickets>0?"warn":"good"} />
    </KPIBar>
  );
}