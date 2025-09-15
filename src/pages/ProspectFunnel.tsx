import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, BarChart3, Info, HelpCircle } from "lucide-react";
import { HelpTooltip, HelpTooltipProvider } from "@/components/ui/HelpTooltip";

/**
 * Prospect Funnel — schema-aware
 * - Selects * from prospects and auto-detects key columns:
 *   stage/status, created_at, converted_at, lost_at
 * - Computes win rate, average days to win, average days open (active)
 * - Shows counts by stage and highlights stalled leads
 */

type AnyRow = Record<string, any>;

const fmtPct = (n: number) => `${Number.isFinite(n) ? n.toFixed(1) : "0.0"}%`;
const fmtDays = (n: number | null) => (n == null || !Number.isFinite(n) ? "—" : `${n.toFixed(1)}d`);
const fmtDate = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
};
const now = () => new Date();

const STAGE_KEYS = ["stage", "status", "pipeline_stage", "state"];
const CREATED_KEYS = ["created_at", "createdAt", "inserted_at", "created"];
const WON_KEYS = ["converted_at", "won_at", "signed_at", "installed_at"];
const LOST_KEYS = ["lost_at", "closed_lost_at", "disqualified_at"];

function daysBetween(a?: string | null, b?: string | null): number | null {
  if (!a || !b) return null;
  const da = new Date(a), db = new Date(b);
  if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return null;
  const ms = db.getTime() - da.getTime();
  return ms / (1000 * 60 * 60 * 24);
}

function pickKey(obj: AnyRow | undefined, keys: string[]): string | null {
  if (!obj) return null;
  for (const k of keys) if (k in obj) return k;
  return null;
}

function normalizeStage(v: any, hasWonFlag: boolean, hasLostFlag: boolean): string {
  if (hasWonFlag) return "Won";
  if (hasLostFlag) return "Lost";
  const s = String(v ?? "").toLowerCase().trim();
  if (!s) return "New";
  if (["won","customer","signed","installed","active"].includes(s)) return "Won";
  if (["lost","closed_lost","dead","disqualified","no_fit"].includes(s)) return "Lost";
  if (["new","uncontacted","created"].includes(s)) return "New";
  if (["contacted","attempted","responded"].includes(s)) return "Contacted";
  if (["qualified","meeting","demo","visit"].includes(s)) return "Qualified";
  if (["proposal","quote","negotiation","contract"].includes(s)) return "Proposal";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function ProspectFunnel() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AnyRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true); setErr(null);
      try {
        const r = await supabase.from("prospects").select("*").limit(20000);
        if (r.error) throw r.error;
        setRows(r.data || []);
      } catch (e: any) {
        setErr(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const analysis = useMemo(() => {
    if (!rows.length) return null;

    // detect keys from first non-empty row
    const sample = rows.find(Boolean);
    const stageKey = pickKey(sample, STAGE_KEYS);
    const createdKey = pickKey(sample, CREATED_KEYS);
    const wonKey = pickKey(sample, WON_KEYS);
    const lostKey = pickKey(sample, LOST_KEYS);

    const nowISO = now().toISOString();

    type AggRow = {
      id: string;
      name: string;
      stageNorm: string;
      createdAt?: string | null;
      wonAt?: string | null;
      lostAt?: string | null;
      ageDaysActive?: number | null;
      timeToWin?: number | null;
      raw: AnyRow;
    };

    const enriched: AggRow[] = rows.map((r) => {
      const id = String(r.id ?? "");
      const nameGuess = r.business_name ?? r.name ?? r.company ?? r.contact_name ?? (id || "(prospect)");
      const stageVal = stageKey ? r[stageKey] : null;
      const hasWonFlag = Boolean(wonKey && r[wonKey]);
      const hasLostFlag = Boolean(lostKey && r[lostKey]);

      const stageNorm = normalizeStage(stageVal, hasWonFlag, hasLostFlag);
      const createdAt = createdKey ? r[createdKey] : null;
      const wonAt = wonKey ? r[wonKey] : null;
      const lostAt = lostKey ? r[lostKey] : null;

      const timeToWin = daysBetween(createdAt, wonAt);
      // age while active: created → now if not won/lost
      const ageDaysActive = (stageNorm !== "Won" && stageNorm !== "Lost")
        ? daysBetween(createdAt, nowISO)
        : null;

      return {
        id,
        name: String(nameGuess),
        stageNorm,
        createdAt,
        wonAt,
        lostAt,
        ageDaysActive,
        timeToWin,
        raw: r,
      };
    });

    // funnel counts
    const counts = new Map<string, number>();
    for (const e of enriched) {
      counts.set(e.stageNorm, (counts.get(e.stageNorm) || 0) + 1);
    }

    const total = enriched.length;
    const won = counts.get("Won") || 0;
    const lost = counts.get("Lost") || 0;
    const decided = won + lost;
    const winRate = decided > 0 ? (won / decided) * 100 : 0;

    // avg days to win (won only)
    const ttwVals = enriched.map((e) => e.timeToWin).filter((n): n is number => Number.isFinite(n as number));
    const avgTtw = ttwVals.length ? (ttwVals.reduce((a, b) => a + b, 0) / ttwVals.length) : null;

    // avg open age (active only)
    const openVals = enriched
      .filter((e) => e.stageNorm !== "Won" && e.stageNorm !== "Lost")
      .map((e) => e.ageDaysActive)
      .filter((n): n is number => Number.isFinite(n as number));
    const avgOpenAge = openVals.length ? (openVals.reduce((a, b) => a + b, 0) / openVals.length) : null;

    // by-stage rows (sorted roughly by a common pipeline order)
    const desiredOrder = ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"];
    const stageRows = Array.from(counts.entries()).map(([stage, count]) => ({
      stage, count, pct: total > 0 ? (count / total) * 100 : 0,
    }));
    stageRows.sort((a, b) => {
      const ai = desiredOrder.indexOf(a.stage);
      const bi = desiredOrder.indexOf(b.stage);
      if (ai === -1 && bi === -1) return a.stage.localeCompare(b.stage);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });

    // stalled: active with age > 14d, top 10 oldest
    const stalled = enriched
      .filter((e) => e.stageNorm !== "Won" && e.stageNorm !== "Lost" && (e.ageDaysActive || 0) > 14)
      .sort((a, b) => (b.ageDaysActive || 0) - (a.ageDaysActive || 0))
      .slice(0, 10);

    return {
      stageKey,
      createdKey,
      wonKey,
      lostKey,
      total,
      won,
      lost,
      winRate,
      avgTtw,
      avgOpenAge,
      stageRows,
      stalled,
    };
  }, [rows]);

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading prospects…</div>;
  }
  if (err) {
    return <div className="p-6 text-sm text-destructive">Error: {err}</div>;
  }
  if (!analysis) {
    return <div className="p-6 text-sm text-muted-foreground">No prospects found.</div>;
  }

  const a = analysis;

  return (
    <HelpTooltipProvider>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Prospect Funnel Analysis
            <HelpTooltip content="Tracks prospect conversion rates, sales cycle times, and identifies stalled leads. Auto-detects stage/status fields in your prospects table." />
          </h1>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted transition-colors"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>

        <div className="text-xs text-muted-foreground flex items-start gap-2">
          <Info className="h-4 w-4 mt-0.5" />
          <span>
            Auto-detected keys — stage: <b>{a.stageKey ?? "—"}</b>, created: <b>{a.createdKey ?? "—"}</b>, won: <b>{a.wonKey ?? "—"}</b>, lost: <b>{a.lostKey ?? "—"}</b>.
            Update your schema to include these for best accuracy.
          </span>
        </div>

        {/* KPI cards */}
        <div className="grid gap-3 sm:grid-cols-4">
          <KPI 
            label="Total Leads" 
            value={String(a.total)} 
            tooltip="Total number of prospects in your database"
          />
          <KPI 
            label="Won" 
            value={String(a.won)} 
            tooltip="Number of prospects successfully converted to customers"
          />
          <KPI 
            label="Win Rate" 
            value={fmtPct(a.winRate)} 
            tooltip="Percentage of decided prospects that were won (Won / (Won + Lost))"
          />
          <KPI 
            label="Avg Days to Win" 
            value={fmtDays(a.avgTtw)} 
            tooltip="Average number of days from prospect creation to conversion"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <KPI 
            label="Lost" 
            value={String(a.lost)} 
            tooltip="Number of prospects that were lost or disqualified"
          />
          <KPI 
            label="Active Leads" 
            value={String(a.total - a.won - a.lost)} 
            tooltip="Number of prospects still in the sales pipeline (not won or lost)"
          />
          <KPI 
            label="Avg Days Open" 
            value={fmtDays(a.avgOpenAge)} 
            tooltip="Average age in days of currently active prospects"
          />
        </div>

        {/* Stage table */}
        <div className="rounded-xl border border-border overflow-auto">
          <div className="px-3 py-2 text-sm font-medium bg-muted flex items-center gap-2">
            Funnel Breakdown by Stage
            <HelpTooltip content="Shows the distribution of prospects across different pipeline stages" size="sm" />
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <Th>Stage</Th>
                <Th className="text-right">Count</Th>
                <Th className="text-right">% of Total</Th>
              </tr>
            </thead>
            <tbody>
              {a.stageRows.map((r) => (
                <tr key={r.stage} className="odd:bg-card/50 hover:bg-muted/30 transition-colors">
                  <Td>{r.stage}</Td>
                  <Td className="text-right">{r.count}</Td>
                  <Td className="text-right">{fmtPct(r.pct)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Stalled leads */}
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="px-3 py-2 text-sm font-medium bg-muted flex items-center gap-2">
            Stalled Leads (&gt;14 days open)
            <HelpTooltip content="Active prospects that have been in the pipeline for more than 14 days without being won or lost" size="sm" />
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <Th>Prospect</Th>
                <Th>Stage</Th>
                <Th>Created</Th>
                <Th className="text-right">Age (days)</Th>
              </tr>
            </thead>
            <tbody>
              {a.stalled.length ? a.stalled.map((s) => (
                <tr key={s.id} className="odd:bg-card/50 hover:bg-muted/30 transition-colors">
                  <Td>{s.name}</Td>
                  <Td>{s.stageNorm}</Td>
                  <Td>{fmtDate(s.createdAt)}</Td>
                  <Td className="text-right">{fmtDays(s.ageDaysActive ?? null)}</Td>
                </tr>
              )) : (
                <tr>
                  <Td colSpan={4}>
                    <div className="py-6 text-center text-muted-foreground">
                      No stalled active leads over 14 days.
                    </div>
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </HelpTooltipProvider>
  );
}

function KPI({ label, value, tooltip }: { label: string; value: string; tooltip?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {label}
        {tooltip && <HelpTooltip content={tooltip} size="sm" />}
      </div>
      <div className="text-lg font-semibold mt-1">{value}</div>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2 text-left ${className}`}>{children}</th>;
}
function Td({ children, className = "", colSpan }: { children: React.ReactNode; className?: string; colSpan?: number }) {
  return <td className={`px-3 py-2 ${className}`} colSpan={colSpan}>{children}</td>;
}