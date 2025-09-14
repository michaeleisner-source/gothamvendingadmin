import React, { useEffect, useMemo, useState } from "react";
import { Link, Route } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Percent, DollarSign, Settings2, PlayCircle, FileText, Upload, CheckCircle2, AlertTriangle, Download, BadgeDollarSign, CalendarDays
} from "lucide-react";

/** ============================== Utilities ============================== */
type AnyRow = Record<string, any>;
const num = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const cents = (n?: number | null) => (Number.isFinite(Number(n)) ? Number(n) / 100 : 0);
const toCents = (dollars: number) => Math.round(dollars * 100);
const fmt = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD" });
const startOfMonth = (isoYYYYMM: string) => new Date(isoYYYYMM + "-01T00:00:00");
const endOfMonthInclusive = (isoYYYYMM: string) => {
  const d = startOfMonth(isoYYYYMM); d.setMonth(d.getMonth() + 1); d.setDate(0); // last day of month
  d.setHours(23, 59, 59, 999);
  return d;
};
const yyyymm = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const title = (s: string) => s.slice(0, 1).toUpperCase() + s.slice(1);

/** Commission base and methods */
type CommissionBase = "gross" | "gross_less_fees" | "net";
type CommissionType = "percent" | "flat" | "tiered_percent";

/** Settings record, either from commission_settings table or from locations columns */
type CommissionSetting = {
  location_id: string;
  location_name?: string | null;
  commission_type?: CommissionType | null;
  commission_rate?: number | null;            // % (e.g., 12 => 12%)
  commission_flat_cents?: number | null;      // monthly flat commission (cents)
  commission_tiers_json?: any;                // e.g., [{threshold:0,rate:10},{threshold:500,rate:12},{threshold:1000,rate:15}]
  commission_base?: CommissionBase | null;    // "gross" | "gross_less_fees" | "net"
  commission_min_guarantee_cents?: number | null;
  effective_from?: string | null;             // YYYY-MM (optional)
  effective_to?: string | null;               // YYYY-MM (optional)
};

/** Sales aggregation structure (by location, for a month) */
type SalesAgg = {
  location_id: string;
  location_name?: string | null;
  gross: number;
  fees: number;
  cost: number;
  net: number; // gross - fees - cost
};

/** Commission result row (preview or saved statement) */
type CommissionRow = {
  month: string; // YYYY-MM
  location_id: string;
  location_name?: string | null;
  base: CommissionBase;
  base_amount: number;
  method: CommissionType;
  rate_pct?: number | null;
  flat_amount?: number | null;
  tiers?: any[] | null;
  min_guarantee?: number | null;
  commission: number;
  gross: number;
  fees: number;
  cost: number;
  net: number;
};

/** Tiered progressive commission calculator (marginal by bracket) */
function calcTiered(amount: number, tiers: Array<{ threshold: number; rate: number }>) {
  if (!Array.isArray(tiers) || tiers.length === 0) return 0;
  // Normalize, sort by threshold asc, rate is percent (e.g., 12)
  const t = [...tiers]
    .map((x) => ({ threshold: Number(x.threshold) || 0, rate: Number(x.rate) || 0 }))
    .sort((a, b) => a.threshold - b.threshold);

  let commission = 0;
  for (let i = 0; i < t.length; i++) {
    const cur = t[i];
    const next = t[i + 1];
    const upper = next ? next.threshold : Infinity;
    const span = Math.max(0, Math.min(amount, upper) - cur.threshold);
    if (span > 0) {
      commission += span * (cur.rate / 100);
    }
    if (amount < upper) break;
  }
  return commission;
}

/** ============================== Pages ============================== */

/** 1) COMMISSION SETTINGS — /finance/commissions
 * Pulls settings from `commission_settings` if exists; else tries columns on `locations`.
 * Allows inline edit & save (uses commission_settings if present, otherwise tries updating locations).
 */
export function CommissionSettingsPage() {
  const [useTable, setUseTable] = useState<boolean | null>(null);
  const [locations, setLocations] = useState<CommissionSetting[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setStatus(null); setErr(null);

      // Probe for commission_settings table
      const probe = await supabase.from("commission_settings").select("location_id").limit(1);
      const hasSettingsTable = !probe.error;
      setUseTable(hasSettingsTable);

      // Load locations
      const { data: locs, error: eLoc } = await supabase.from("locations").select("id, name");
      if (eLoc) { setErr(eLoc.message); return; }
      const locRows = (locs || []) as Array<{ id: string; name?: string | null }>;

      if (hasSettingsTable) {
        // Load settings from commission_settings (latest per location preferred)
        const { data: settings, error: eSet } = await supabase
          .from("commission_settings")
          .select("location_id, commission_type, commission_rate, commission_flat_cents, commission_tiers_json, commission_base, commission_min_guarantee_cents, effective_from, effective_to");
        if (eSet) { setErr(eSet.message); return; }
        const map = new Map<string, CommissionSetting>();
        (settings || []).forEach((s: AnyRow) => { map.set(s.location_id, s as CommissionSetting); });

        setLocations(
          locRows.map((l) => ({
            location_id: l.id,
            location_name: l.name || null,
            ...map.get(l.id),
          }))
        );
      } else {
        // Fallback: try columns on locations
        const { data: locCols, error: eCols } = await supabase
          .from("locations")
          .select("id, name, commission_type, commission_rate, commission_flat_cents, commission_tiers_json, commission_base, commission_min_guarantee_cents");
        if (eCols) {
          // If even that fails, at least show locations
          setLocations(locRows.map((l) => ({ location_id: l.id, location_name: l.name || null })));
        } else {
          setLocations(
            (locCols || []).map((l: AnyRow) => ({
              location_id: l.id,
              location_name: l.name || null,
              commission_type: (l.commission_type || null) as CommissionType | null,
              commission_rate: l.commission_rate ?? null,
              commission_flat_cents: l.commission_flat_cents ?? null,
              commission_tiers_json: l.commission_tiers_json ?? null,
              commission_base: (l.commission_base || null) as CommissionBase | null,
              commission_min_guarantee_cents: l.commission_min_guarantee_cents ?? null,
            }))
          );
        }
      }
    })();
  }, []);

  function updateField(idx: number, key: keyof CommissionSetting, val: any) {
    setLocations((rows) => {
      const copy = [...rows]; (copy[idx] as any)[key] = val; return copy;
    });
  }

  async function saveRow(row: CommissionSetting) {
    setStatus(null); setErr(null);
    // normalize numbers
    const payload = {
      location_id: row.location_id,
      commission_type: (row.commission_type || "percent") as CommissionType,
      commission_rate: row.commission_rate ? Number(row.commission_rate) : null,
      commission_flat_cents: row.commission_flat_cents ? Number(row.commission_flat_cents) : null,
      commission_tiers_json: row.commission_tiers_json ?? null,
      commission_base: (row.commission_base || "gross_less_fees") as CommissionBase,
      commission_min_guarantee_cents: row.commission_min_guarantee_cents ? Number(row.commission_min_guarantee_cents) : null,
    };

    if (useTable) {
      // upsert into commission_settings
      const { error } = await supabase.from("commission_settings").upsert(payload, { onConflict: "location_id" });
      if (error) { setErr(error.message); return; }
      setStatus(`Saved settings for ${row.location_name || row.location_id}.`);
    } else {
      // Fallback not available since locations table doesn't have commission columns
      setErr("Commission settings table not available. Please contact administrator.");
      return;
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2"><Settings2 className="h-5 w-5" /> Commission Settings</h1>
        <div className="flex gap-2">
          <Link to="/finance/commissions/run" className="rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted inline-flex items-center gap-2">
            <PlayCircle className="h-4 w-4" /> Run Commissions
          </Link>
          <Link to="/finance/commissions/statements" className="rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted inline-flex items-center gap-2">
            <FileText className="h-4 w-4" /> Statements
          </Link>
        </div>
      </div>

      {useTable === false && (
        <MissingTableNotice />
      )}

      {err && <div className="text-sm text-rose-400">{err}</div>}
      {status && <div className="text-sm text-emerald-500 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> {status}</div>}

      <div className="rounded-xl border border-border overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-3 py-2 text-left">Location</th>
              <th className="px-3 py-2 text-left">Base</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">% Rate</th>
              <th className="px-3 py-2 text-left">Flat ($)</th>
              <th className="px-3 py-2 text-left">Tiers JSON</th>
              <th className="px-3 py-2 text-left">Min. Guarantee ($)</th>
              <th className="px-3 py-2 text-right">Save</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((r, i) => (
              <tr key={r.location_id} className="odd:bg-card/50 align-top">
                <td className="px-3 py-2">
                  <div className="font-medium">{r.location_name || r.location_id}</div>
                  <div className="text-xs text-muted-foreground">{r.location_id}</div>
                </td>
                <td className="px-3 py-2">
                  <select
                    value={r.commission_base || "gross_less_fees"}
                    onChange={(e) => updateField(i, "commission_base", e.target.value as CommissionBase)}
                    className="rounded-md bg-background border border-border px-2 py-1 text-sm"
                  >
                    <option value="gross">Gross</option>
                    <option value="gross_less_fees">Gross minus fees</option>
                    <option value="net">Net (gross - cost - fees)</option>
                  </select>
                </td>
                <td className="px-3 py-2">
                  <select
                    value={r.commission_type || "percent"}
                    onChange={(e) => updateField(i, "commission_type", e.target.value as CommissionType)}
                    className="rounded-md bg-background border border-border px-2 py-1 text-sm"
                  >
                    <option value="percent">Percent</option>
                    <option value="flat">Flat</option>
                    <option value="tiered_percent">Tiered %</option>
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number" step="0.1" min="0"
                    value={r.commission_rate ?? ""}
                    onChange={(e) => updateField(i, "commission_rate", e.target.value === "" ? null : Number(e.target.value))}
                    placeholder="e.g. 12"
                    className="w-28 rounded-md bg-background border border-border px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number" step="0.01" min="0"
                    value={r.commission_flat_cents != null ? (r.commission_flat_cents / 100).toFixed(2) : ""}
                    onChange={(e) => updateField(i, "commission_flat_cents", e.target.value === "" ? null : toCents(Number(e.target.value)))}
                    placeholder="0.00"
                    className="w-28 rounded-md bg-background border border-border px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-3 py-2">
                  <textarea
                    rows={2}
                    value={typeof r.commission_tiers_json === "string" ? r.commission_tiers_json : (r.commission_tiers_json ? JSON.stringify(r.commission_tiers_json) : "")}
                    onChange={(e) => updateField(i, "commission_tiers_json", e.target.value)}
                    placeholder='[{"threshold":0,"rate":10},{"threshold":500,"rate":12}]'
                    className="w-56 rounded-md bg-background border border-border px-2 py-1 text-xs"
                  />
                  <div className="text-[11px] text-muted-foreground mt-1">Progressive tiers; amounts in dollars, rates in %.</div>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number" step="0.01" min="0"
                    value={r.commission_min_guarantee_cents != null ? (r.commission_min_guarantee_cents / 100).toFixed(2) : ""}
                    onChange={(e) => updateField(i, "commission_min_guarantee_cents", e.target.value === "" ? null : toCents(Number(e.target.value)))}
                    placeholder="0.00"
                    className="w-28 rounded-md bg-background border border-border px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => saveRow(r)}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Save
                  </button>
                </td>
              </tr>
            ))}
            {!locations.length && (
              <tr><td colSpan={8} className="px-3 py-6 text-center text-sm text-muted-foreground">No locations found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MissingTableNotice() {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-sm font-medium flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> Tables already exist!</div>
      <div className="mt-2 text-xs text-muted-foreground">The commission tables have been created successfully. You can now configure commission settings per location.</div>
    </div>
  );
}

/** 2) RUN COMMISSIONS — /finance/commissions/run
 * Select a month → compute per-location using sales + settings → preview → save & export CSV.
 */
export function CommissionRunPage() {
  const [month, setMonth] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1); return yyyymm(d); // default to last month
  });
  const [rows, setRows] = useState<CommissionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [hasStatements, setHasStatements] = useState<boolean | null>(null);
  const [useTable, setUseTable] = useState<boolean | null>(null);

  async function compute() {
    setLoading(true); setErr(null); setStatus(null);
    try {
      // Probe for commission_settings
      const probe = await supabase.from("commission_settings").select("location_id").limit(1);
      const hasSettings = !probe.error;
      setUseTable(hasSettings);

      // Load machines map (machine_id -> location_id, name)
      const { data: machines, error: eM } = await supabase.from("machines").select("id, location_id, name");
      if (eM) throw eM;
      const m2l = new Map<string, { loc: string | null; mname?: string | null }>();
      (machines || []).forEach((m: AnyRow) => m2l.set(m.id, { loc: m.location_id || null, mname: m.name || null }));

      // Load locations (for names)
      const { data: locs, error: eL } = await supabase.from("locations").select("id, name");
      if (eL) throw eL;
      const locName = new Map<string, string | null>();
      (locs || []).forEach((l: AnyRow) => locName.set(l.id, l.name || null));

      // Load settings
      let settings: CommissionSetting[] = [];
      if (hasSettings) {
        const { data: setData, error: eS } = await supabase
          .from("commission_settings")
          .select("location_id, commission_type, commission_rate, commission_flat_cents, commission_tiers_json, commission_base, commission_min_guarantee_cents, effective_from, effective_to");
        if (eS) throw eS;
        settings = (setData || []) as CommissionSetting[];
      } else {
        const { data: fall, error: eF } = await supabase
          .from("locations")
          .select("id, name, commission_type, commission_rate, commission_flat_cents, commission_tiers_json, commission_base, commission_min_guarantee_cents");
        if (eF) throw eF;
        settings = (fall || []).map((l: AnyRow) => ({
          location_id: l.id, location_name: l.name || null,
          commission_type: l.commission_type || "percent",
          commission_rate: l.commission_rate ?? null,
          commission_flat_cents: l.commission_flat_cents ?? null,
          commission_tiers_json: l.commission_tiers_json ?? null,
          commission_base: l.commission_base || "gross_less_fees",
          commission_min_guarantee_cents: l.commission_min_guarantee_cents ?? null,
        })) as CommissionSetting[];
      }

      // Load sales for the target month
      const since = startOfMonth(month).toISOString();
      const until = endOfMonthInclusive(month).toISOString();
      const { data: sales, error: eS2 } = await supabase
        .from("sales")
        .select("machine_id, qty, unit_price_cents, unit_cost_cents, occurred_at")
        .gte("occurred_at", since)
        .lte("occurred_at", until);
      if (eS2) throw eS2;

      // Aggregate sales by location
      const aggMap = new Map<string, SalesAgg>();
      (sales || []).forEach((r: AnyRow) => {
        const m = m2l.get(r.machine_id || "") || { loc: null };
        const loc = m.loc;
        if (!loc) return;
        const key = loc;
        const qty = num(r.qty);
        const gross = qty * cents(r.unit_price_cents);
        const cost = qty * cents(r.unit_cost_cents);
        const fees = 0; // No fee columns in sales table, defaulting to 0
        const o = aggMap.get(key) || { location_id: key, location_name: locName.get(key) || null, gross: 0, fees: 0, cost: 0, net: 0 };
        o.gross += gross; o.fees += fees; o.cost += cost; o.net = o.gross - o.fees - o.cost;
        aggMap.set(key, o);
      });

      // Compute commissions
      const results: CommissionRow[] = [];
      for (const [locId, a] of aggMap.entries()) {
        const s = (settings.find((x) => x.location_id === locId) || {}) as CommissionSetting;
        const method = (s.commission_type || "percent") as CommissionType;
        const base = (s.commission_base || "gross_less_fees") as CommissionBase;
        const baseAmount = base === "gross" ? a.gross : base === "gross_less_fees" ? (a.gross - a.fees) : a.net;

        let commission = 0;
        if (method === "percent") {
          const ratePct = Number(s.commission_rate || 0);
          commission = baseAmount * (ratePct / 100);
        } else if (method === "flat") {
          commission = cents(s.commission_flat_cents || 0);
        } else if (method === "tiered_percent") {
          let tiers = s.commission_tiers_json;
          if (typeof tiers === "string") {
            try { tiers = JSON.parse(tiers); } catch { tiers = []; }
          }
          commission = calcTiered(baseAmount, Array.isArray(tiers) ? tiers : []);
        }

        const minG = cents(s.commission_min_guarantee_cents || 0);
        if (minG > 0 && commission < minG) commission = minG;

        results.push({
          month, location_id: locId, location_name: a.location_name || null,
          base, base_amount: Math.max(0, baseAmount), method,
          rate_pct: s.commission_rate ?? null,
          flat_amount: s.commission_flat_cents != null ? cents(s.commission_flat_cents) : null,
          tiers: s.commission_tiers_json ?? null,
          min_guarantee: minG || null,
          commission: Math.max(0, commission),
          gross: a.gross, fees: a.fees, cost: a.cost, net: a.net,
        });
      }

      // See if statements already exist for this month (to warn about duplicates)
      const { data: st, error: eSt } = await supabase
        .from("commission_statements")
        .select("id")
        .eq("month", month)
        .limit(1);
      setHasStatements(!eSt && (st || []).length > 0);

      setRows(results.sort((a, b) => b.commission - a.commission));
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  function downloadCSV() {
    const lines = [
      ["month", "location_id", "location_name", "base", "base_amount", "method", "rate_pct", "flat_amount", "commission", "gross", "fees", "cost", "net"].join(","),
      ...rows.map(r => [
        r.month, r.location_id, quote(r.location_name || ""), r.base, r.base_amount.toFixed(2), r.method,
        r.rate_pct ?? "", r.flat_amount != null ? r.flat_amount.toFixed(2) : "",
        r.commission.toFixed(2), r.gross.toFixed(2), r.fees.toFixed(2), r.cost.toFixed(2), r.net.toFixed(2)
      ].join(","))
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `commissions_${month}.csv`; a.click();
    URL.revokeObjectURL(url);
  }
  const quote = (s: string) => `"${s.replace(/"/g, '""')}"`;

  async function saveStatements() {
    setStatus(null); setErr(null);
    // Ensure table exists
    const probe = await supabase.from("commission_statements").select("id").limit(1);
    if (probe.error) {
      setErr("Table commission_statements missing. See SQL on the Settings page.");
      return;
    }
    if (!rows.length) { setErr("Nothing to save. Compute first."); return; }

    const payload = rows.map(r => ({
      month: r.month,
      location_id: r.location_id,
      base: r.base,
      base_amount_cents: toCents(r.base_amount),
      method: r.method,
      rate_pct: r.rate_pct ?? null,
      flat_cents: r.flat_amount != null ? toCents(r.flat_amount) : null,
      tiers_json: r.tiers ?? null,
      min_guarantee_cents: r.min_guarantee != null ? toCents(r.min_guarantee) : null,
      commission_cents: toCents(r.commission),
      gross_cents: toCents(r.gross),
      fees_cents: toCents(r.fees),
      cost_cents: toCents(r.cost),
      net_cents: toCents(r.net),
      status: "draft",
    }));

    // naive approach: delete existing month rows then insert (simpler than upsert on composite)
    await supabase.from("commission_statements").delete().eq("month", month);
    const CHUNK = 300;
    for (let i = 0; i < payload.length; i += CHUNK) {
      const slice = payload.slice(i, i + CHUNK);
      const { error } = await supabase.from("commission_statements").insert(slice);
      if (error) { setErr(`Insert failed: ${error.message}`); return; }
    }
    setStatus(`Saved ${payload.length} statements for ${month}.`);
    setHasStatements(true);
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2"><PlayCircle className="h-5 w-5" /> Run Commissions</h1>
        <div className="flex gap-2">
          <Link to="/finance/commissions" className="rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted inline-flex items-center gap-2">
            <Settings2 className="h-4 w-4" /> Settings
          </Link>
          <Link to="/finance/commissions/statements" className="rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted inline-flex items-center gap-2">
            <FileText className="h-4 w-4" /> Statements
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-3 flex flex-wrap items-center gap-3">
        <label className="text-sm inline-flex items-center gap-2">
          <span className="text-muted-foreground inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" /> Month</span>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-md bg-background border border-border px-2 py-1 text-sm" />
        </label>
        <button onClick={compute} className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted">
          <Percent className="h-4 w-4" /> Compute
        </button>
        {rows.length > 0 && (
          <>
            <button onClick={downloadCSV} className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted">
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <button onClick={saveStatements} className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted">
              <BadgeDollarSign className="h-4 w-4" /> Save Statements
            </button>
          </>
        )}
        {hasStatements && <div className="text-xs text-amber-500">Existing statements found for {month}. Saving will replace them.</div>}
      </div>

      {useTable === false && (
        <div className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
          Tip: Create <code>commission_settings</code> / <code>commission_statements</code> tables for the best experience (see Settings page).
        </div>
      )}

      {loading && <div className="text-sm text-muted-foreground">Calculating…</div>}
      {err && <div className="text-sm text-rose-400"><AlertTriangle className="inline h-4 w-4 mr-1" /> {err}</div>}
      {rows.length > 0 && (
        <div className="overflow-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left">Location</th>
                <th className="px-3 py-2 text-left">Base</th>
                <th className="px-3 py-2 text-right">Base Amount</th>
                <th className="px-3 py-2 text-left">Method</th>
                <th className="px-3 py-2 text-right">% / Flat</th>
                <th className="px-3 py-2 text-right">Commission</th>
                <th className="px-3 py-2 text-right">Gross</th>
                <th className="px-3 py-2 text-right">Fees</th>
                <th className="px-3 py-2 text-right">Cost</th>
                <th className="px-3 py-2 text-right">Net</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.location_id} className="odd:bg-card/50">
                  <td className="px-3 py-2">{r.location_name || r.location_id}</td>
                  <td className="px-3 py-2">{title(r.base)}</td>
                  <td className="px-3 py-2 text-right">{fmt(r.base_amount)}</td>
                  <td className="px-3 py-2">{title(r.method.replace("_", " "))}</td>
                  <td className="px-3 py-2 text-right">
                    {r.method === "percent" && (r.rate_pct ?? 0).toFixed(2) + "%"}
                    {r.method === "flat" && (r.flat_amount != null ? fmt(r.flat_amount) : "—")}
                    {r.method === "tiered_percent" && "tiers"}
                  </td>
                  <td className="px-3 py-2 text-right font-medium">{fmt(r.commission)}</td>
                  <td className="px-3 py-2 text-right">{fmt(r.gross)}</td>
                  <td className="px-3 py-2 text-right">{fmt(r.fees)}</td>
                  <td className="px-3 py-2 text-right">{fmt(r.cost)}</td>
                  <td className="px-3 py-2 text-right">{fmt(r.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {rows.length === 0 && !loading && !err && (
        <div className="text-sm text-muted-foreground">Choose a month and click Compute.</div>
      )}
    </div>
  );
}

/** 3) COMMISSION STATEMENTS — /finance/commissions/statements
 * View saved statements (from commission_statements), filter by month, mark as paid.
 */
export function CommissionStatementsPage() {
  const [month, setMonth] = useState<string>("");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function load() {
    setLoading(true); setErr(null); setStatus(null);
    try {
      let q = supabase.from("commission_statements")
        .select("id, month, location_id, base, base_amount_cents, method, rate_pct, flat_cents, commission_cents, gross_cents, fees_cents, cost_cents, net_cents, status, created_at, locations(name)")
        .order("month", { ascending: false })
        .order("created_at", { ascending: false });

      if (month) q = q.eq("month", month);
      const { data, error } = await q;
      if (error) throw error;
      setRows(data || []);
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []); // initial

  async function markPaid(id: string) {
    setStatus(null); setErr(null);
    const { error } = await supabase.from("commission_statements").update({ status: "paid" }).eq("id", id);
    if (error) { setErr(error.message); return; }
    setStatus("Marked as paid.");
    load();
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2"><FileText className="h-5 w-5" /> Commission Statements</h1>
        <div className="flex gap-2">
          <Link to="/finance/commissions/run" className="rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted inline-flex items-center gap-2">
            <PlayCircle className="h-4 w-4" /> Run
          </Link>
          <Link to="/finance/commissions" className="rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted inline-flex items-center gap-2">
            <Settings2 className="h-4 w-4" /> Settings
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-3 flex flex-wrap items-center gap-3">
        <label className="text-sm inline-flex items-center gap-2">
          <span className="text-muted-foreground inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" /> Month</span>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-md bg-background border border-border px-2 py-1 text-sm" />
        </label>
        <button onClick={load} className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted">
          <Upload className="h-4 w-4" /> Load
        </button>
      </div>

      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {err && <div className="text-sm text-rose-400"><AlertTriangle className="inline h-4 w-4 mr-1" /> {err}</div>}
      {status && <div className="text-sm text-emerald-500 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> {status}</div>}

      <div className="overflow-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-3 py-2 text-left">Month</th>
              <th className="px-3 py-2 text-left">Location</th>
              <th className="px-3 py-2 text-left">Base</th>
              <th className="px-3 py-2 text-right">Base Amount</th>
              <th className="px-3 py-2 text-left">Method</th>
              <th className="px-3 py-2 text-right">Rate / Flat</th>
              <th className="px-3 py-2 text-right">Commission</th>
              <th className="px-3 py-2 text-right">Gross</th>
              <th className="px-3 py-2 text-right">Fees</th>
              <th className="px-3 py-2 text-right">Cost</th>
              <th className="px-3 py-2 text-right">Net</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="odd:bg-card/50">
                <td className="px-3 py-2">{r.month}</td>
                <td className="px-3 py-2">{r.locations?.name || r.location_id}</td>
                <td className="px-3 py-2">{title(String(r.base || ""))}</td>
                <td className="px-3 py-2 text-right">{fmt((r.base_amount_cents || 0) / 100)}</td>
                <td className="px-3 py-2">{title(String(r.method || ""))}</td>
                <td className="px-3 py-2 text-right">
                  {r.method === "percent" ? `${Number(r.rate_pct || 0).toFixed(2)}%` :
                   r.method === "flat" ? fmt((r.flat_cents || 0) / 100) : "tiers"}
                </td>
                <td className="px-3 py-2 text-right font-medium">{fmt((r.commission_cents || 0) / 100)}</td>
                <td className="px-3 py-2 text-right">{fmt((r.gross_cents || 0) / 100)}</td>
                <td className="px-3 py-2 text-right">{fmt((r.fees_cents || 0) / 100)}</td>
                <td className="px-3 py-2 text-right">{fmt((r.cost_cents || 0) / 100)}</td>
                <td className="px-3 py-2 text-right">{fmt((r.net_cents || 0) / 100)}</td>
                <td className="px-3 py-2">{String(r.status || "draft").toUpperCase()}</td>
                <td className="px-3 py-2 text-right">
                  {String(r.status || "") !== "paid" && (
                    <button onClick={() => markPaid(r.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs hover:bg-muted">
                      Mark Paid
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!rows.length && !loading && (
              <tr><td colSpan={13} className="px-3 py-6 text-center text-sm text-muted-foreground">No statements found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** ============================== Route Mounter ============================== */
/** Usage:
 * import { CommissionsRoutes } from "@/feature-pack/CommissionsPack";
 * <CommissionsRoutes ProtectedRoute={ProtectedRoute}/>
 */
export function CommissionsRoutes({ ProtectedRoute }: { ProtectedRoute?: React.ComponentType<{ children: React.ReactNode }> }) {
  return (
    <React.Fragment>
      <Route path="/finance/commissions" element={<CommissionSettingsPage />} />
      <Route path="/finance/commissions/run" element={<CommissionRunPage />} />
      <Route path="/finance/commissions/statements" element={<CommissionStatementsPage />} />
    </React.Fragment>
  );
}

/** ============================== Sidebar Block ============================== */
/** Usage in your Sales & Finance group:
 * import { CommissionsSidebarItems } from "@/feature-pack/CommissionsPack";
 * <CommissionsSidebarItems/>
 */
export function CommissionsSidebarItems({ collapsed, onExpandSidebar }: { collapsed: boolean; onExpandSidebar: () => void }) {
  const NavItem = ({ to, icon: Icon, children }: { to: string; icon: React.ComponentType<any>; children: React.ReactNode }) => {
    if (collapsed) {
      return (
        <button
          onClick={onExpandSidebar}
          className="w-full flex justify-center px-2 py-2 rounded-lg hover:bg-muted/50"
          title={`${children} - Click to expand`}
        >
          <Icon className="size-4" />
        </button>
      );
    }

    return (
      <Link to={to} className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm hover:bg-muted">
        <Icon className="size-4" />
        <span>{children}</span>
      </Link>
    );
  };

  return (
    <>
      <NavItem to="/finance/commissions" icon={Settings2}>
        Commissions
      </NavItem>
      <NavItem to="/finance/commissions/run" icon={PlayCircle}>
        Run Commissions
      </NavItem>
      <NavItem to="/finance/commissions/statements" icon={FileText}>
        Statements
      </NavItem>
    </>
  );
}