import React, { useEffect, useMemo, useState } from "react";
import { Link, Route } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Table as TableIcon, CheckCircle2, AlertTriangle, Trash2, FileText, ArrowRight, Database } from "lucide-react";

/** Utils */
const toCents = (v: any): number => {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") {
    // if looks like dollars with decimals, convert; if looks like cents (int), keep
    return Math.abs(v) < 100 && String(v).includes(".") ? Math.round(v * 100) : Math.round(v);
  }
  const s = String(v).trim().replace(/[$,]/g, "");
  if (!s) return 0;
  const n = Number(s);
  if (!isFinite(n)) return 0;
  // heuristic: if contains ".", treat as dollars
  return s.includes(".") ? Math.round(n * 100) : Math.round(n);
};

const parseDate = (s: string): string | null => {
  if (!s) return null;
  const t = Date.parse(s);
  if (!isNaN(t)) return new Date(t).toISOString().slice(0, 10);
  // try MM/DD/YYYY
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    const mm = String(m[1]).padStart(2, "0");
    const dd = String(m[2]).padStart(2, "0");
    const yyyy = m[3].length === 2 ? "20" + m[3] : m[3];
    return `${yyyy}-${mm}-${dd}`;
  }
  return null;
};

const fmt = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD" });

/** Simple CSV parser (handles quotes, commas, newlines) */
function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const rows: string[][] = [];
  let cur: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"'; i++; // escaped quote
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        cur.push(cell); cell = "";
      } else if (ch === "\n") {
        cur.push(cell); cell = "";
        if (cur.length > 1 || cur[0] !== "") rows.push(cur);
        cur = [];
      } else if (ch === "\r") {
        // ignore
      } else {
        cell += ch;
      }
    }
  }
  // last cell
  cur.push(cell);
  if (cur.length > 1 || cur[0] !== "") rows.push(cur);

  const headers = (rows.shift() || []).map((h) => h.trim());
  return { headers, rows };
}

/** Expected fields */
const REQUIRED = ["occurred_on", "gross_cents"];
const OPTIONAL = ["processor", "fee_cents", "net_cents", "txn_count", "deposit_ref"];

type MapKey = "occurred_on" | "processor" | "gross_cents" | "fee_cents" | "net_cents" | "txn_count" | "deposit_ref";

/** Suggest mapping by header text */
function guessMap(headers: string[]): Record<MapKey, string | null> {
  const hay = headers.map((h) => h.toLowerCase());
  const find = (...alts: string[]) => {
    for (const a of alts) {
      const idx = hay.findIndex((h) => h === a || h.includes(a));
      if (idx >= 0) return headers[idx];
    }
    return null;
  };
  return {
    occurred_on: find("date", "deposit date", "payout date", "settlement date") || null,
    processor: find("processor", "provider", "gateway") || null,
    gross_cents: find("gross", "amount", "sales") || null,
    fee_cents: find("fee", "fees") || null,
    net_cents: find("net", "payout", "deposit") || null,
    txn_count: find("count", "transactions", "txn") || null,
    deposit_ref: find("reference", "ref", "batch", "deposit id", "payout id") || null,
  };
}

/** =========================================================
 *  PAGE: Import Processor Statements
 *  Route: /finance/processors/import
 * ========================================================*/
export function ProcessorImport() {
  const [csv, setCsv] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [map, setMap] = useState<Record<MapKey, string | null>>({ occurred_on: null, processor: null, gross_cents: null, fee_cents: null, net_cents: null, txn_count: null, deposit_ref: null });
  const [name, setName] = useState("");
  const [preview, setPreview] = useState<any[]>([]);
  const [status, setStatus] = useState<{ ok?: string; err?: string } | null>(null);
  const [tableOk, setTableOk] = useState<boolean | null>(null);

  useEffect(() => {
    // probe table
    (async () => {
      const probe = await supabase.from("processor_settlements").select("occurred_on").limit(1);
      setTableOk(!probe.error);
    })();
  }, []);

  function onFile(file: File) {
    setStatus(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const parsed = parseCSV(text);
      setCsv(parsed);
      const g = guessMap(parsed.headers);
      setMap(g);
      // try to infer processor name from file name if not present
      if (!g.processor) {
        const base = file.name.toLowerCase();
        const guess = ["nectar", "nayax", "cantaloupe", "square", "stripe", "worldpay", "elan", "firstdata", "tsys"].find((p) => base.includes(p));
        if (guess) setName(guess);
      }
    };
    reader.readAsText(file);
  }

  const headers = csv?.headers || [];
  const rows = csv?.rows || [];

  function applyMapping(): any[] {
    if (!csv) return [];
    const toIdx = (h: string | null) => (h ? headers.indexOf(h) : -1);
    const idx: Record<MapKey, number> = {
      occurred_on: toIdx(map.occurred_on),
      processor: toIdx(map.processor),
      gross_cents: toIdx(map.gross_cents),
      fee_cents: toIdx(map.fee_cents),
      net_cents: toIdx(map.net_cents),
      txn_count: toIdx(map.txn_count),
      deposit_ref: toIdx(map.deposit_ref),
    };
    const out = rows.map((r) => {
      const occurred_on = idx.occurred_on >= 0 ? parseDate(r[idx.occurred_on]) : null;
      const processor = idx.processor >= 0 ? r[idx.processor] : (name || null);
      const gross_cents = idx.gross_cents >= 0 ? toCents(r[idx.gross_cents]) : 0;
      const fee_cents = idx.fee_cents >= 0 ? toCents(r[idx.fee_cents]) : 0;
      const net_cents = idx.net_cents >= 0 ? toCents(r[idx.net_cents]) : (gross_cents - fee_cents);
      const txn_count = idx.txn_count >= 0 ? Number(String(r[idx.txn_count]).replace(/[^0-9\-]/g, "")) : null;
      const deposit_ref = idx.deposit_ref >= 0 ? r[idx.deposit_ref] : null;
      return { occurred_on, processor, gross_cents, fee_cents, net_cents, txn_count, deposit_ref };
    });
    return out.filter((x) => x.occurred_on && typeof x.gross_cents === "number");
  }

  function buildPreview() {
    setStatus(null);
    const out = applyMapping();
    setPreview(out.slice(0, 300)); // keep preview snappy
  }

  async function save() {
    setStatus(null);
    if (!csv) return;
    const all = applyMapping();
    if (!all.length) { setStatus({ err: "Nothing to insert. Check your mapping." }); return; }

    // chunk inserts to avoid payload limits
    const CHUNK = 500;
    for (let i = 0; i < all.length; i += CHUNK) {
      const slice = all.slice(i, i + CHUNK);
      const { error } = await supabase.from("processor_settlements").insert(slice);
      if (error) { setStatus({ err: `Insert failed at rows ${i + 1}-${i + slice.length}: ${error.message}` }); return; }
    }
    setStatus({ ok: `Inserted ${all.length} rows into processor_settlements.` });
  }

  const missingRequired = REQUIRED.filter((k) => !(map as any)[k]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2"><Upload className="h-5 w-5" /> Import Processor Statements</h1>
        <div className="flex gap-2">
          <Link to="/reports/processor-recon" className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted">
            Reconciliation Report <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* table existence */}
      {tableOk === false && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-sm font-medium flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> Table missing: <code>processor_settlements</code></div>
          <div className="mt-2 text-xs text-muted-foreground">Run this SQL in Supabase (SQL Editor → Run):</div>
          <pre className="mt-2 text-xs overflow-auto rounded bg-muted p-2">
{`create table if not exists public.processor_settlements (
  id uuid primary key default gen_random_uuid(),
  processor text,
  occurred_on date not null,
  gross_cents int not null,
  fee_cents int default 0,
  net_cents int default 0,
  txn_count int,
  deposit_ref text,
  created_at timestamptz default now()
);
create index if not exists idx_ps_occurred_on on public.processor_settlements(occurred_on);
`}
          </pre>
          <div className="text-xs text-muted-foreground mt-2">After creating, reload this page.</div>
        </div>
      )}

      {/* file picker */}
      <div className="rounded-xl border border-border bg-card p-3 space-y-2">
        <div className="text-sm font-medium">1) Choose CSV file</div>
        <input type="file" accept=".csv,text/csv" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
               className="block w-full text-sm" />
        <div className="text-xs text-muted-foreground">Tip: export daily or monthly settlement reports from your processor (Nayax, Cantaloupe, Square, etc.).</div>
      </div>

      {/* mapping */}
      {csv && (
        <div className="rounded-xl border border-border bg-card p-3 space-y-2">
          <div className="text-sm font-medium">2) Map Columns</div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <FieldMap label="Date (occurred_on)" value={map.occurred_on} onChange={(v) => setMap((m) => ({ ...m, occurred_on: v }))} headers={headers} required />
            <FieldMap label="Processor (optional)" value={map.processor} onChange={(v) => setMap((m) => ({ ...m, processor: v }))} headers={headers} />
            <FieldMap label="Gross" value={map.gross_cents} onChange={(v) => setMap((m) => ({ ...m, gross_cents: v }))} headers={headers} required />
            <FieldMap label="Fees (optional)" value={map.fee_cents} onChange={(v) => setMap((m) => ({ ...m, fee_cents: v }))} headers={headers} />
            <FieldMap label="Net (optional)" value={map.net_cents} onChange={(v) => setMap((m) => ({ ...m, net_cents: v }))} headers={headers} />
            <FieldMap label="Txn Count (optional)" value={map.txn_count} onChange={(v) => setMap((m) => ({ ...m, txn_count: v }))} headers={headers} />
            <FieldMap label="Deposit Ref (optional)" value={map.deposit_ref} onChange={(v) => setMap((m) => ({ ...m, deposit_ref: v }))} headers={headers} />
          </div>

          {/* processor name helper */}
          {!map.processor && (
            <div className="text-sm">
              <label className="text-muted-foreground mr-2">Default processor name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. nayax"
                     className="rounded-md bg-background border border-border px-2 py-1 text-sm" />
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            Amounts auto-detect dollars vs cents. Dates accept common formats (YYYY-MM-DD or MM/DD/YYYY).
          </div>

          {/* validate */}
          {missingRequired.length > 0 && (
            <div className="text-xs text-amber-500 flex items-center gap-1 mt-1">
              <AlertTriangle className="h-4 w-4" /> Missing required: {missingRequired.join(", ")}
            </div>
          )}

          <div className="flex gap-2 mt-2">
            <button onClick={buildPreview} disabled={missingRequired.length > 0}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50">
              <TableIcon className="h-4 w-4" /> Build Preview
            </button>
            {preview.length > 0 && (
              <button onClick={save}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted">
                <Database className="h-4 w-4" /> Insert {preview.length} (preview) / all rows
              </button>
            )}
          </div>
        </div>
      )}

      {/* preview */}
      {preview.length > 0 && (
        <div className="rounded-xl border border-border overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Processor</th>
                <th className="px-3 py-2 text-right">Gross</th>
                <th className="px-3 py-2 text-right">Fees</th>
                <th className="px-3 py-2 text-right">Net</th>
                <th className="px-3 py-2 text-right">Txn</th>
                <th className="px-3 py-2 text-left">Ref</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((r, i) => (
                <tr key={i} className="odd:bg-card/50">
                  <td className="px-3 py-2">{r.occurred_on}</td>
                  <td className="px-3 py-2">{r.processor || "—"}</td>
                  <td className="px-3 py-2 text-right">{fmt((r.gross_cents || 0) / 100)}</td>
                  <td className="px-3 py-2 text-right">{fmt((r.fee_cents || 0) / 100)}</td>
                  <td className="px-3 py-2 text-right">{fmt((r.net_cents || 0) / 100)}</td>
                  <td className="px-3 py-2 text-right">{r.txn_count ?? "—"}</td>
                  <td className="px-3 py-2">{r.deposit_ref || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* status */}
      {status?.ok && <div className="text-sm text-emerald-500 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> {status.ok}</div>}
      {status?.err && <div className="text-sm text-rose-400 flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> {status.err}</div>}

      {/* housekeeping */}
      <div className="rounded-xl border border-border bg-card p-3">
        <div className="text-sm font-medium flex items-center gap-2"><FileText className="h-4 w-4" /> Notes</div>
        <ul className="mt-2 text-xs text-muted-foreground list-disc pl-5 space-y-1">
          <li>Duplicate inserts are not automatically deduped. If your file overlaps dates you've already imported, you may want to clear those days first.</li>
          <li>You can bulk delete a date range in Supabase SQL, e.g. <code>delete from processor_settlements where occurred_on between '2025-01-01' and '2025-01-31';</code></li>
          <li>After importing, open <Link to="/reports/processor-recon" className="underline">Processor Reconciliation</Link> to compare vs sales.</li>
        </ul>
      </div>
    </div>
  );
}

function FieldMap({ label, value, onChange, headers, required }: { label: string; value: string | null; onChange: (v: string | null) => void; headers: string[]; required?: boolean }) {
  return (
    <label className="text-sm">
      <span className="text-muted-foreground">{label}{required ? " *" : ""}</span>
      <div className="relative mt-1">
        <select value={value || ""} onChange={(e) => onChange(e.target.value || null)}
                className="w-full appearance-none rounded-md bg-background border border-border px-3 py-2 pr-8 text-sm">
          <option value="">{required ? "Select column…" : "— (not mapped)"}</option>
          {headers.map((h) => <option key={h} value={h}>{h}</option>)}
        </select>
        <span className="pointer-events-none absolute right-2 top-2.5 text-xs text-muted-foreground">▼</span>
      </div>
    </label>
  );
}

/** =========================================================
 *  PAGE: Statements (simple viewer)
 *  Route: /finance/processors/statements
 * ========================================================*/
type Sett = { id: string; occurred_on: string; processor?: string | null; gross_cents?: number | null; fee_cents?: number | null; net_cents?: number | null; txn_count?: number | null; deposit_ref?: string | null; };

export function ProcessorStatements() {
  const [rows, setRows] = useState<Sett[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true); setErr(null);
      const { data, error } = await supabase
        .from("processor_settlements")
        .select("id, occurred_on, processor, gross_cents, fee_cents, net_cents, txn_count, deposit_ref")
        .order("occurred_on", { ascending: false })
        .limit(2000);
      if (error) { setErr(error.message); setLoading(false); return; }
      setRows((data || []) as Sett[]);
      setLoading(false);
    })();
  }, []);

  const byDay = useMemo(() => {
    const map = new Map<string, { gross: number; fees: number; net: number; tx: number }>();
    rows.forEach((r) => {
      const d = r.occurred_on;
      const v = map.get(d) || { gross: 0, fees: 0, net: 0, tx: 0 };
      v.gross += (r.gross_cents || 0) / 100;
      v.fees += (r.fee_cents || 0) / 100;
      v.net += (r.net_cents || 0) / 100;
      v.tx += r.txn_count || 0;
      map.set(d, v);
    });
    return Array.from(map.entries()).map(([occurred_on, v]) => ({ occurred_on, ...v })).sort((a, b) => (a.occurred_on < b.occurred_on ? 1 : -1));
  }, [rows]);

  const byMonth = useMemo(() => {
    const map = new Map<string, { gross: number; fees: number; net: number; tx: number }>();
    rows.forEach((r) => {
      const month = r.occurred_on.slice(0, 7);
      const v = map.get(month) || { gross: 0, fees: 0, net: 0, tx: 0 };
      v.gross += (r.gross_cents || 0) / 100;
      v.fees += (r.fee_cents || 0) / 100;
      v.net += (r.net_cents || 0) / 100;
      v.tx += r.txn_count || 0;
      map.set(month, v);
    });
    return Array.from(map.entries()).map(([month, v]) => ({ month, ...v })).sort((a, b) => (a.month < b.month ? 1 : -1));
  }, [rows]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2"><TableIcon className="h-5 w-5" /> Processor Statements</h1>
        <div className="flex gap-2">
          <Link to="/finance/processors/import" className="rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted inline-flex items-center gap-2">
            <Upload className="h-4 w-4" /> Import CSV
          </Link>
          <Link to="/reports/processor-recon" className="rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted inline-flex items-center gap-2">
            Reconciliation <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {err && <div className="text-sm text-rose-400">{err}</div>}

      {!loading && !err && rows.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          No statements found. Import with <Link to="/finance/processors/import" className="underline">CSV importer</Link>.
        </div>
      )}

      {!loading && !err && rows.length > 0 && (
        <>
          <div className="rounded-xl border border-border overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-right">Gross</th>
                  <th className="px-3 py-2 text-right">Fees</th>
                  <th className="px-3 py-2 text-right">Net</th>
                  <th className="px-3 py-2 text-right">Txn</th>
                </tr>
              </thead>
              <tbody>
                {byDay.map((r) => (
                  <tr key={r.occurred_on} className="odd:bg-card/50">
                    <td className="px-3 py-2">{r.occurred_on}</td>
                    <td className="px-3 py-2 text-right">{fmt(r.gross)}</td>
                    <td className="px-3 py-2 text-right">{fmt(r.fees)}</td>
                    <td className="px-3 py-2 text-right">{fmt(r.net)}</td>
                    <td className="px-3 py-2 text-right">{r.tx.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-border overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left">Month</th>
                  <th className="px-3 py-2 text-right">Gross</th>
                  <th className="px-3 py-2 text-right">Fees</th>
                  <th className="px-3 py-2 text-right">Net</th>
                  <th className="px-3 py-2 text-right">Txn</th>
                </tr>
              </thead>
              <tbody>
                {byMonth.map((r) => (
                  <tr key={r.month} className="odd:bg-card/50">
                    <td className="px-3 py-2">{r.month}</td>
                    <td className="px-3 py-2 text-right">{fmt(r.gross)}</td>
                    <td className="px-3 py-2 text-right">{fmt(r.fees)}</td>
                    <td className="px-3 py-2 text-right">{fmt(r.net)}</td>
                    <td className="px-3 py-2 text-right">{r.tx.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/** =========================================================
 *  Route mounter (drop-in)
 * ========================================================*/
export function ProcessorStatementsRoutes({ ProtectedRoute }: { ProtectedRoute?: React.ComponentType<{ children: React.ReactNode }> }) {
  const Wrap: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    ProtectedRoute ? <ProtectedRoute>{children}</ProtectedRoute> : <>{children}</>;
  return (
    <>
      <Route path="/finance/processors/import" element={<Wrap><ProcessorImport /></Wrap>} />
      <Route path="/finance/processors/statements" element={<Wrap><ProcessorStatements /></Wrap>} />
    </>
  );
}

/** =========================================================
 *  Sidebar block — add under "Sales & Finance"
 * ========================================================*/
export function ProcessorStatementsSidebarItems({ collapsed, onExpandSidebar }: { collapsed: boolean; onExpandSidebar: () => void }) {
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
      <NavItem to="/finance/processors/statements" icon={TableIcon}>
        Processor Statements
      </NavItem>
      <NavItem to="/finance/processors/import" icon={Upload}>
        Import Statements
      </NavItem>
    </>
  );
}
