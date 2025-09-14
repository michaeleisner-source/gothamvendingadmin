import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  Wrench, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  ClipboardList 
} from "lucide-react";
import { KPI } from "@/components/machine-ops/KPI";
import { TicketCard } from "@/components/machine-ops/TicketCard";
import { 
  Ticket, 
  cents, 
  fmt, 
  daysBetween, 
  safeDate 
} from "@/lib/machine-ops-utils";

export default function MachineMaintenance() {
  const [table, setTable] = useState<string | null>(null);
  const [rows, setRows] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true); 
      setErr(null);
      
      const candidates = ["maintenance_work_orders", "tickets", "maintenance"];
      let picked: string | null = null, data: any = [], lastErr: string | null = null;
      
      for (const t of candidates) {
        try {
          const res = await supabase.from(t as any).select("*").order("created_at", { ascending: false }).limit(500);
          if (!res.error) { 
            picked = t; 
            data = res.data || []; 
            break; 
          }
          lastErr = res.error.message;
        } catch (e) {
          lastErr = `Table ${t} not found`;
          continue;
        }
      }
      
      if (!picked) { 
        setErr(`No maintenance table found. Tried: ${candidates.join(", ")}. Last error: ${lastErr}`); 
        setLoading(false); 
        return; 
      }
      
      setTable(picked);
      setRows(data as Ticket[]);
      setLoading(false);
    })();
  }, []);

  const open = rows.filter(r => (r.status || "open").toLowerCase() !== "closed");
  const closed = rows.filter(r => (r.status || "").toLowerCase() === "closed");

  // KPIs
  const overdue = open.filter(r => {
    const created = safeDate(r.created_at);
    return created ? daysBetween(new Date(), created) > 7 : false;
  });
  
  const mttr = (() => {
    const durations = closed
      .map(r => {
        const a = safeDate(r.created_at), b = safeDate(r.resolved_at) || safeDate(r.updated_at);
        return a && b ? daysBetween(a, b) : undefined;
      })
      .filter(Boolean) as number[];
    if (!durations.length) return undefined;
    return durations.reduce((a, b) => a + b, 0) / durations.length;
  })();

  const backlogCost = open.reduce((sum, r) => sum + cents(r.labor_cost_cents) + cents(r.parts_cost_cents), 0);
  
  const openByPriority: Record<string, Ticket[]> = {};
  open.forEach(r => {
    const k = (r.priority || "medium").toLowerCase();
    (openByPriority[k] ||= []).push(r);
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Wrench className="h-5 w-5" /> Maintenance
        </h1>
        <div className="text-xs text-muted-foreground">
          Source table: <code>{table || "—"}</code>
        </div>
      </div>

      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {err && <div className="text-sm text-red-400">Error: {err}</div>}

      {!loading && !err && (
        <>
          <div className="grid gap-2 sm:grid-cols-4">
            <KPI 
              label="Open Tickets" 
              value={open.length.toLocaleString()} 
              icon={<AlertTriangle className="h-4 w-4 text-amber-500" />} 
            />
            <KPI 
              label="Overdue (>7d)" 
              value={overdue.length.toLocaleString()} 
              icon={<Clock className="h-4 w-4" />} 
            />
            <KPI 
              label="Backlog Cost" 
              value={fmt(backlogCost)} 
              icon={<DollarSign className="h-4 w-4" />} 
            />
            <KPI 
              label="MTTR (days)" 
              value={mttr ? mttr.toFixed(1) : "—"} 
              icon={<TrendingUp className="h-4 w-4" />} 
            />
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            {["urgent", "high", "medium"].map((p) => (
              <div key={p} className="rounded-xl border border-border bg-card">
                <div className="px-3 py-2 border-b border-border text-sm font-medium flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" /> {p.toUpperCase()} 
                  <span className="text-xs text-muted-foreground">
                    ({(openByPriority[p] || []).length})
                  </span>
                </div>
                <div className="p-2 space-y-2">
                  {(openByPriority[p] || []).map((t) => <TicketCard key={t.id} t={t} />)}
                  {!(openByPriority[p] || []).length && (
                    <div className="text-xs text-muted-foreground px-2 py-3">No tickets.</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left">Ticket</th>
                  <th className="px-3 py-2 text-left">Machine</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Priority</th>
                  <th className="px-3 py-2 text-left">Created</th>
                  <th className="px-3 py-2 text-right">Labor</th>
                  <th className="px-3 py-2 text-right">Parts</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id} className="odd:bg-card/50">
                    <td className="px-3 py-2">{t.title || t.issue || t.id}</td>
                    <td className="px-3 py-2 text-xs">
                      {t.machine_id ? (
                        <Link className="hover:underline" to={`/machines/${t.machine_id}`}>
                          {t.machine_id}
                        </Link>
                      ) : "—"}
                    </td>
                    <td className="px-3 py-2">{(t.status || "open").toUpperCase()}</td>
                    <td className="px-3 py-2">{(t.priority || "medium").toUpperCase()}</td>
                    <td className="px-3 py-2 text-xs">
                      {t.created_at ? new Date(t.created_at).toLocaleString() : "—"}
                    </td>
                    <td className="px-3 py-2 text-right">{fmt(cents(t.labor_cost_cents))}</td>
                    <td className="px-3 py-2 text-right">{fmt(cents(t.parts_cost_cents))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Tip: Add <code>labor_minutes</code>, <code>labor_cost_cents</code>, <code>parts_cost_cents</code> to improve cost rollups.
          </p>
        </>
      )}
    </div>
  );
}