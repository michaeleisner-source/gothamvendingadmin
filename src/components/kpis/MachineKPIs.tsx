import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { KPIBar, KPI } from "@/components/machine-ops/KPI";
import { useFeeRuleCache, aggregateWithFees, money as fmtMoney } from "@/utils/fees";

type Any = Record<string, any>;
const money = (n:number)=> fmtMoney(Number.isFinite(n)?n:0);
function startISO(days=30){ const d=new Date(); d.setDate(d.getDate()-days); return d.toISOString(); }

export default function MachineKPIs({ machineId }: { machineId: string }) {
  const [sales, setSales] = useState<Any[]>([]);
  const [machine, setMachine] = useState<Any|null>(null);
  const [finance, setFinance] = useState<Any|null>(null);
  const [location, setLocation] = useState<Any|null>(null);
  const [err, setErr] = useState<string|null>(null);
  const [loading, setLoading] = useState(true);

  const { feeFor, loading: feeLoading } = useFeeRuleCache();
  const since = useMemo(()=>startISO(30),[]);

  useEffect(() => {
    (async () => {
      setLoading(true); setErr(null);
      try {
        const m = await supabase.from("machines").select("id,name,location_id").eq("id", machineId).single();
        if (m.error) throw m.error;
        setMachine(m.data);

        try {
          const s = await supabase
            .from("sales" as any)
            .select("qty,unit_price_cents,unit_cost_cents,occurred_at,machine_id")
            .eq("machine_id", machineId)
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

        try {
          const f = await supabase.from("machine_finance").select("monthly_payment,purchase_price").eq("machine_id", machineId).single();
          if (!f.error && f.data) {
            setFinance(f.data);
          }
        } catch {
          setFinance(null);
        }

        if (m.data?.location_id) {
          try {
            const l = await supabase.from("locations").select("id,commission_model,commission_pct_bps,commission_flat_cents,commission_min_cents").eq("id", m.data.location_id).single();
            if (!l.error && l.data) {
              setLocation(l.data);
            }
          } catch {
            setLocation(null);
          }
        }
      } catch (e:any) {
        setErr(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [machineId, since]);

  const kpi = useMemo(() => {
    const agg = aggregateWithFees(
      (sales||[]).map((r:any)=>({
        machine_id: machineId,
        qty: Number(r.qty)||0,
        unit_price_cents: Number(r.unit_price_cents)||0,
        unit_cost_cents: Number(r.unit_cost_cents)||0,
      })),
      feeFor
    );
    const gross30d = agg.gross;
    const net30d = agg.net;

    const paymentMonthly = Number(finance?.monthly_payment||0);

    // Commission allocation: percent applies directly to this machine's gross; flat is included if hybrid/flat (simple allocation)
    const model = (location?.commission_model ?? "none");
    const pct_bps = Number(location?.commission_pct_bps ?? 0);
    const flat_month = Number(location?.commission_flat_cents ?? 0)/100;
    const min_month  = Number(location?.commission_min_cents ?? 0)/100;

    const percentComp = (model==="percent_gross" || model==="hybrid") ? (gross30d * (pct_bps/10000)) : 0;
    const flatComp = (model==="flat_month" || model==="hybrid") ? flat_month : 0; // simple attribution
    const commissionMonthly = Math.max(percentComp + flatComp, (model!=="none" ? min_month : 0));

    const ownerNetMonthly = net30d - paymentMonthly - commissionMonthly;

    return { gross30d, net30d, paymentMonthly, commissionMonthly, ownerNetMonthly };
  }, [sales, finance, location, feeFor, machineId]);

  if (loading || feeLoading) return <KPIBar><KPI label="Loading machine KPIs…" value="—" /></KPIBar>;
  if (err) return <KPIBar><KPI label="Machine KPIs Error" value="!" hint={err} intent="bad"/></KPIBar>;

  return (
    <KPIBar>
      <KPI label="Gross (30d)" value={money(kpi.gross30d)} />
      <KPI label="Net (30d, after fees/COGS)" value={money(kpi.net30d)} intent={kpi.net30d>=0?"good":"bad"} />
      <KPI label="Payment / mo" value={money(kpi.paymentMonthly)} />
      <KPI label="Commission / mo" value={money(kpi.commissionMonthly)} />
      <KPI label="Owner Net / mo" value={money(kpi.ownerNetMonthly)} intent={kpi.ownerNetMonthly>=0?"good":"bad"} />
    </KPIBar>
  );
}