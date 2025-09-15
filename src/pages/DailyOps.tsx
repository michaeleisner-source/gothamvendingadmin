import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { KPIBar, KPI } from "@/components/ui/KPI";
import { useFeeRuleCache, aggregateWithFees, money as fmtMoney } from "@/utils/fees";
import { Wrench, AlertTriangle, Truck, FilePlus2, ChevronRight, Plus, RefreshCw } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

type Any = Record<string, any>;
const money = (n:number)=> fmtMoney(Number.isFinite(n)?n:0);

function sinceISO(days:number){ const d=new Date(); d.setDate(d.getDate()-days); return d.toISOString(); }
const last30 = sinceISO(30);
const last7  = sinceISO(7);

export default function DailyOps() {
  const navigate = useNavigate();
  const { feeFor, loading: feeLoading } = useFeeRuleCache();

  const [sales, setSales] = useState<Any[]>([]);
  const [machines, setMachines] = useState<Any[]>([]);
  const [silent, setSilent] = useState<{id:string; name:string; days:number}[]>([]);
  const [prospects, setProspects] = useState<Any[]>([]);
  const [lowStock, setLowStock] = useState<{machine:string; slot?:string; product?:string; need?:number}[]>([]);
  const [ticketsOpen, setTicketsOpen] = useState<number>(0);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string|null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true); setErr(null);
      try {
        // Machines
        const m = await supabase.from("machines").select("id,name").limit(10000);
        if (m.error) throw m.error;
        setMachines(m.data || []);

        // Sales (30d)
        const s = await supabase
          .from("sales")
          .select("machine_id, qty, unit_price_cents, unit_cost_cents, occurred_at")
          .gte("occurred_at", last30)
          .limit(200000);
        if (s.error) throw s.error;
        setSales(s.data || []);

        // Silent machines (no sales 7d)
        const lastSaleByM = new Map<string, Date>();
        for (const r of s.data || []) {
          const mid = String(r.machine_id);
          const t = new Date(r.occurred_at);
          if (!lastSaleByM.has(mid) || lastSaleByM.get(mid)!.getTime() < t.getTime()) {
            lastSaleByM.set(mid, t);
          }
        }
        const cut = new Date(last7).getTime();
        const silentList: {id:string; name:string; days:number}[] = [];
        for (const mrow of m.data || []) {
          const last = lastSaleByM.get(mrow.id);
          const days = last ? Math.floor((Date.now()-last.getTime())/86_400_000) : 9999;
          if (!last || last.getTime() < cut) {
            silentList.push({ id: mrow.id, name: mrow.name || mrow.id, days });
          }
        }
        silentList.sort((a,b)=> b.days - a.days);
        setSilent(silentList.slice(0,5));

        // Prospects (stuck > 14d and not Won/Lost)
        const p = await supabase.from("prospects").select("*").limit(5000);
        if (!p.error) {
          const now = new Date();
          const stuck = (p.data||[]).filter((r:any)=>{
            const stage = String(r.stage??r.status??"").toLowerCase();
            if (/won|lost|closed/.test(stage)) return false;
            const created = r.created_at ? new Date(r.created_at) : null;
            if (!created) return false;
            const days = Math.max(0, (now.getTime()-created.getTime())/86_400_000);
            return days >= 14;
          }).slice(0,5);
          setProspects(stuck);
        }

        // Tickets open
        const t = await supabase.from("tickets").select("id,status").limit(10000);
        if (!t.error) {
          const open = (t.data||[]).filter((x:any)=>!x.status || !/closed|resolved/i.test(String(x.status))).length;
          setTicketsOpen(open);
        }

        // Low stock placeholder (shows once inventory system is implemented)
        setLowStock([]);
      } catch (e:any) {
        setErr(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Aggregate money KPIs
  const k = useMemo(() => {
    const agg = aggregateWithFees(
      sales.map(r=>({
        machine_id: r.machine_id,
        qty: Number(r.qty)||0,
        unit_price_cents: Number(r.unit_price_cents)||0,
        unit_cost_cents: Number(r.unit_cost_cents)||0,
      })),
      feeFor
    );
    return {
      gross30d: agg.gross,
      net30d: agg.net,
      machines: machines.length,
      silentOver7d: silent.length,
      ticketsOpen,
    };
  }, [sales, feeFor, machines.length, silent.length, ticketsOpen]);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Daily Ops</h1>
        <button onClick={()=>window.location.reload()}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted">
          <RefreshCw className="h-4 w-4"/> Refresh
        </button>
      </div>

      {err ? <div className="text-sm text-rose-400">{err}</div> : null}

      {/* KPIs */}
      <KPIBar>
        <KPI label="Gross (30d)" value={money(k.gross30d)} />
        <KPI label="Net (30d, after fees/COGS)" value={money(k.net30d)} intent={k.net30d>=0?"good":"bad"} />
        <KPI label="Machines Active" value={k.machines} />
        <KPI label="Silent > 7d" value={k.silentOver7d} intent={k.silentOver7d>0?"warn":"good"} />
        <KPI label="Open Tickets" value={k.ticketsOpen} intent={k.ticketsOpen>0?"warn":"good"} />
      </KPIBar>

      {/* Actions */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Silent Machines */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium flex items-center gap-2"><AlertTriangle className="h-4 w-4"/> Silent Machines</div>
            <Link to="/reports/silent-machines" className="text-xs text-muted-foreground hover:underline">View all</Link>
          </div>
          <div className="mt-2 divide-y divide-border">
            {silent.length ? silent.map(s=>(
              <div key={s.id} className="py-2 flex items-center justify-between">
                <div className="text-sm">{s.name}</div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground">{s.days}d</div>
                  <button
                    onClick={()=>navigate(`/tickets/new?machine=${s.id}`)}
                    className="inline-flex items-center gap-1 text-xs rounded-md border border-border px-2 py-1 hover:bg-muted">
                    <Plus className="h-3 w-3"/> Ticket
                  </button>
                  <Link to={`/machines/${s.id}`} className="text-xs inline-flex items-center gap-1 hover:underline">
                    Details <ChevronRight className="h-3 w-3"/>
                  </Link>
                </div>
              </div>
            )) : (
              <div className="py-6 text-xs text-muted-foreground">No silent machines in the last 7 days.</div>
            )}
          </div>
        </div>

        {/* Low Stock (placeholder until Inventory Health is added) */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium flex items-center gap-2"><Truck className="h-4 w-4"/> Low Stock</div>
            <Link to="/picklists" className="text-xs text-muted-foreground hover:underline">Picklists</Link>
          </div>
          <div className="mt-2 divide-y divide-border">
            {lowStock.length ? lowStock.map((r,i)=>(
              <div key={i} className="py-2 text-sm">
                {r.machine}
              </div>
            )) : (
              <div className="py-6 text-xs text-muted-foreground">
                Add inventory ledger + PARs to see live deficits here.
              </div>
            )}
          </div>
        </div>

        {/* Stuck Prospects */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium flex items-center gap-2"><FilePlus2 className="h-4 w-4"/> Stuck Leads (14d+)</div>
            <Link to="/prospects" className="text-xs text-muted-foreground hover:underline">Pipeline</Link>
          </div>
          <div className="mt-2 divide-y divide-border">
            {prospects.length ? prospects.map((p)=>(
              <div key={p.id} className="py-2 flex items-center justify-between">
                <div className="text-sm">{p.business_name || p.name || "(unnamed)"}</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={()=>navigate(`/prospects/convert?prospect=${p.id}`)}
                    className="inline-flex items-center gap-1 text-xs rounded-md border border-border px-2 py-1 hover:bg-muted">
                    Convert
                  </button>
                  <Link to={`/locations?pre=${p.id}`} className="text-xs hover:underline">View <ChevronRight className="h-3 w-3"/></Link>
                </div>
              </div>
            )) : (
              <div className="py-6 text-xs text-muted-foreground">No stuck leads. Good job.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}