import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { KPIBar, KPI } from "@/components/machine-ops/KPI";

type Any = Record<string, any>;
const avg = (ns: number[]) => (ns.length ? ns.reduce((a,b)=>a+b,0)/ns.length : 0);
const daysBetween = (a: Date, b: Date) => Math.max(0, (b.getTime() - a.getTime()) / 86_400_000);

export default function ProspectsKPIs() {
  const [rows, setRows] = useState<Any[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true); setErr(null);
      try {
        const r = await supabase.from("prospects").select("*").limit(5000);
        if (r.error) throw r.error;
        setRows(r.data || []);
      } catch (e: any) {
        setErr(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    let total = rows.length;
    let won = 0;
    let lost = 0;
    let openAges: number[] = [];
    let wonCycle: number[] = [];

    const get = (r: Any, ...keys: string[]) => {
      for (const k of keys) if (r[k] != null) return r[k];
      return null;
    };

    for (const r of rows) {
      const stage = (get(r, "stage", "status") || "").toString().toLowerCase();
      const createdAt = (get(r, "created_at", "createdAt") || null) ? new Date(get(r,"created_at","createdAt")) : null;
      const wonAt = (get(r, "converted_at", "won_at", "installed_at") || null) ? new Date(get(r,"converted_at","won_at","installed_at")) : null;

      if (/won/.test(stage)) won++;
      else if (/lost|closed\-lost|no deal/.test(stage)) lost++;
      else if (createdAt) openAges.push(daysBetween(createdAt, now));

      if (wonAt && createdAt) wonCycle.push(daysBetween(createdAt, wonAt));
    }

    const winRate = total ? (won / total) * 100 : 0;
    const avgOpenDays = avg(openAges);
    const avgDaysToWin = avg(wonCycle);

    return { total, won, lost, winRate, avgOpenDays, avgDaysToWin };
  }, [rows]);

  if (loading) return <KPIBar><KPI label="Loading prospects…" value="—" /></KPIBar>;
  if (err) return <KPIBar><KPI label="Prospects Error" value="!" hint={err} intent="bad"/></KPIBar>;

  return (
    <KPIBar>
      <KPI label="Prospects" value={stats.total} />
      <KPI label="Won" value={stats.won} intent="good" hint={`${(stats.winRate||0).toFixed(1)}% win rate`} />
      <KPI label="Lost" value={stats.lost} intent={stats.lost>0?"warn":"neutral"} />
      <KPI label="Avg Days Open (Active)" value={Number.isFinite(stats.avgOpenDays)?stats.avgOpenDays.toFixed(1):"—"} hint="Lower is better" />
      <KPI label="Avg Days to Win" value={Number.isFinite(stats.avgDaysToWin)?stats.avgDaysToWin.toFixed(1):"—"} hint="Cycle time" />
    </KPIBar>
  );
}