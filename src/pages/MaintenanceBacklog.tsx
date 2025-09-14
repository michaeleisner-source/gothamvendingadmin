import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3 } from "lucide-react";
import { Card } from "@/components/machine-ops/Card";
import { List } from "@/components/machine-ops/List";
import { 
  Ticket, 
  fmt, 
  cents, 
  daysBetween, 
  safeDate 
} from "@/lib/machine-ops-utils";

export default function MaintenanceBacklog() {
  const [rows, setRows] = useState<Ticket[]>([]);
  const [table, setTable] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true); 
      setErr(null);
      
      const candidates = ["tickets", "maintenance", "machine_maintenance"];
      let picked: string | null = null, data: any = [], lastErr: string | null = null;
      
      for (const t of candidates) {
        try {
          const res = await supabase.from(t as any).select("*").order("created_at", { ascending: false }).limit(1000);
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
  
  const buckets = useMemo(() => {
    const now = new Date();
    const b = { "0–2d": 0, "3–7d": 0, "8–14d": 0, "15–30d": 0, "30d+": 0 };
    open.forEach(r => {
      const c = safeDate(r.created_at) || now;
      const d = daysBetween(now, c);
      if (d <= 2) b["0–2d"]++; 
      else if (d <= 7) b["3–7d"]++; 
      else if (d <= 14) b["8–14d"]++; 
      else if (d <= 30) b["15–30d"]++; 
      else b["30d+"]++;
    });
    return b;
  }, [open]);

  const byPriority: Record<string, number> = {};
  open.forEach(r => {
    const k = (r.priority || "medium").toLowerCase();
    byPriority[k] = (byPriority[k] || 0) + 1;
  });

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold flex items-center gap-2">
        <BarChart3 className="h-5 w-5" /> Maintenance Backlog
      </h1>
      <div className="text-xs text-muted-foreground">
        Source table: <code>{table || "—"}</code>
      </div>

      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {err && <div className="text-sm text-red-400">Error: {err}</div>}

      {!loading && !err && (
        <>
          <div className="grid gap-3 lg:grid-cols-2">
            <Card title="Aging Buckets (Open)">
              <List data={buckets} />
            </Card>
            <Card title="By Priority (Open)">
              <List data={byPriority} />
            </Card>
          </div>

          <Card title="Open Tickets">
            <div className="overflow-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left">Ticket</th>
                    <th className="px-3 py-2 text-left">Machine</th>
                    <th className="px-3 py-2 text-left">Created</th>
                    <th className="px-3 py-2 text-right">Labor</th>
                    <th className="px-3 py-2 text-right">Parts</th>
                  </tr>
                </thead>
                <tbody>
                  {open.map(t => (
                    <tr key={t.id} className="odd:bg-card/50">
                      <td className="px-3 py-2">{t.title || t.issue || t.id}</td>
                      <td className="px-3 py-2 text-xs">
                        {t.machine_id ? (
                          <Link to={`/machines/${t.machine_id}`} className="hover:underline">
                            {t.machine_id}
                          </Link>
                        ) : "—"}
                      </td>
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
          </Card>
        </>
      )}
    </div>
  );
}