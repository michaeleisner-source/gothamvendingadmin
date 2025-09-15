import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Users, CheckCircle2, XCircle } from "lucide-react";
import { HelpTooltip, HelpTooltipProvider } from "@/components/ui/HelpTooltip";

type Prospect = {
  id: string;
  name?: string | null;
  company?: string | null;
  source?: string | null;
  stage?: string | null;
  status?: string | null;
  created_at?: string | null;
};

const toDate = (v?: string | null) => (v ? new Date(v) : undefined);
const daysBetween = (a?: Date, b?: Date) => (a && b ? Math.abs(a.getTime() - b.getTime()) / 86400000 : undefined);
const title = (s: string) => s.slice(0, 1).toUpperCase() + s.slice(1);

function pickStage(p: Prospect) {
  const s = (p.stage || p.status || "new").toLowerCase();
  const normalized: Record<string, string> = {
    new: "new", contacted: "contacted", qualifying: "qualified", qualified: "qualified",
    meeting: "qualified", proposal: "proposal", won: "won", closed_won: "won",
    lost: "lost", closed_lost: "lost",
  };
  return normalized[s] || "new";
}

function Tile({ title, value, icon, tooltip }: { title: string; value: React.ReactNode; icon?: React.ReactNode; tooltip?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground flex items-center gap-1">
          {title}
          {tooltip && <HelpTooltip content={tooltip} size="sm" />}
        </div>
        {icon}
      </div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-sm font-medium mb-2">{title}</div>
      {children}
    </div>
  );
}

function SimpleList({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  return (
    <div className="space-y-1">
      {entries.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{title(k)}</span>
          <span className="font-medium">{v.toLocaleString()}</span>
        </div>
      ))}
      {!entries.length && <div className="text-sm text-muted-foreground">No data.</div>}
    </div>
  );
}

export default function PipelineAnalytics() {
  const [rows, setRows] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true); 
      setErr(null);
      const { data, error } = await supabase.from("prospects").select("*").order("created_at", { ascending: false }).limit(2000);
      if (error) { 
        setErr(error.message); 
        setLoading(false); 
        return; 
      }
      setRows((data || []) as Prospect[]);
      setLoading(false);
    })();
  }, []);

  const stageCounts = useMemo(() => {
    const acc: Record<string, number> = {};
    rows.forEach((p) => { 
      const s = pickStage(p); 
      acc[s] = (acc[s] || 0) + 1; 
    });
    return acc;
  }, [rows]);

  const sources = useMemo(() => {
    const acc: Record<string, number> = {};
    rows.forEach((p) => { 
      const s = (p.source || "unknown").toLowerCase(); 
      acc[s] = (acc[s] || 0) + 1; 
    });
    return acc;
  }, [rows]);

  const convRate = rows.length ? (rows.filter((p) => pickStage(p) === "won").length / rows.length) * 100 : 0;

  const aging = useMemo(() => {
    const now = new Date();
    const buckets = { "0–7d": 0, "8–30d": 0, "31–90d": 0, "90d+": 0 };
    rows.forEach((p) => {
      const d = toDate(p.created_at) || now;
      const a = daysBetween(now, d) || 0;
      if (a <= 7) buckets["0–7d"]++; 
      else if (a <= 30) buckets["8–30d"]++; 
      else if (a <= 90) buckets["31–90d"]++; 
      else buckets["90d+"]++;
    });
    return buckets;
  }, [rows]);

  return (
    <HelpTooltipProvider>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" /> 
            Pipeline Analytics
            <HelpTooltip content="Analyze prospect pipeline performance including conversion rates, lead sources, and pipeline aging to optimize your sales process." />
          </h1>
          <Link to="/prospects" className="rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted">
            Back to Prospects
          </Link>
        </div>

      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {err && <div className="text-sm text-red-400">Error: {err}</div>}

      {!loading && !err && (
        <>
          <div className="grid gap-2 sm:grid-cols-3">
            <Tile 
              title="Total Leads" 
              value={rows.length.toLocaleString()} 
              icon={<Users className="h-4 w-4" />} 
              tooltip="Total number of prospects in your pipeline database"
            />
            <Tile 
              title="Conversion Rate" 
              value={`${convRate.toFixed(1)}%`} 
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              tooltip="Percentage of prospects that have been successfully converted to customers"
            />
            <Tile 
              title="Lost (%)" 
              value={`${((rows.filter((p) => pickStage(p) === "lost").length / (rows.length || 1)) * 100).toFixed(1)}%`} 
              icon={<XCircle className="h-4 w-4 text-rose-500" />}
              tooltip="Percentage of prospects that were lost or disqualified during the sales process"
            />
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <Card title="Stage Mix">
              <SimpleList data={stageCounts} />
            </Card>
            <Card title="Lead Sources">
              <SimpleList data={sources} />
            </Card>
          </div>

          <Card title="Lead Aging (by created date)">
            <SimpleList data={aging} />
            <div className="text-xs text-muted-foreground mt-2">
              Tip: use Next Follow-up and Overdue KPI to stay on top of aging leads.
            </div>
          </Card>
        </>
      )}
    </div>
    </HelpTooltipProvider>
  );
}