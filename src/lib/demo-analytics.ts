import { type SaleRow } from '@/lib/demo-data';

// Re-export demo data utilities
export { getDemoSales, type SaleRow } from '@/lib/demo-data';

/* =========================================================
   CSV UTILITIES
========================================================= */
export function toCSV(rows: any[]) {
  if (!rows?.length) return '';
  const keys = Object.keys(rows[0]);
  const esc = (v: any) => `\"${String(v ?? '').replace(/\"/g, '\"\"')}\"`;
  return [keys.join(','), ...rows.map(r => keys.map(k => esc(r[k])).join(','))].join('\n');
}

export function downloadCSV(name: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${name}-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* =========================================================
   ANALYTICS UTILITIES
========================================================= */
export function sum(arr: number[]) { return arr.reduce((a, b) => a + b, 0); }
export function uniq<T>(arr: T[]) { return Array.from(new Set(arr)); }
export function pct(n: number, d: number) { if (!d) return '0%'; return `${((n / d) * 100).toFixed(1)}%`; }

/* =========================================================
   MACHINE SUMMARY HELPERS
========================================================= */
export type MachineSummary = {
  machine: string;
  location: string;
  tx: number;
  revenue: number;
  prevRevenue: number;
  delta: number;   // revenue delta (curr - prev)
  pct: string;     // % change vs prev
  lastSale: string | '—';
  status: 'online' | 'idle' | 'offline';
};

function lastSaleDateMap(rows: SaleRow[]) {
  const m = new Map<string, string>();
  for (const r of rows) {
    const key = r.machine;
    const prev = m.get(key);
    if (!prev || r.date > prev) m.set(key, r.date);
  }
  return m;
}

function daysBetween(isoYMD: string) {
  const now = new Date();
  const d = new Date(isoYMD + 'T00:00:00');
  return Math.floor((+now - +d) / 86400000);
}

export function summarizeMachines(rows: SaleRow[], prevRows: SaleRow[]): MachineSummary[] {
  const curAgg = new Map<string, { location: string; tx: number; revenue: number }>();
  const prevAgg = new Map<string, { revenue: number }>();
  const lastMap = lastSaleDateMap(rows);

  for (const r of rows) {
    const k = r.machine;
    const cur = curAgg.get(k) || { location: r.location, tx: 0, revenue: 0 };
    cur.tx += 1;
    cur.revenue += r.revenue;
    cur.location = r.location; // latest seen
    curAgg.set(k, cur);
  }
  for (const r of prevRows) {
    const k = r.machine;
    const prev = prevAgg.get(k) || { revenue: 0 };
    prev.revenue += r.revenue;
    prevAgg.set(k, prev);
  }

  const keys = new Set<string>([...curAgg.keys(), ...prevAgg.keys()]);
  const out: MachineSummary[] = [];
  for (const k of keys) {
    const c = curAgg.get(k) || { location: '—', tx: 0, revenue: 0 };
    const p = prevAgg.get(k) || { revenue: 0 };
    const delta = +(c.revenue - p.revenue).toFixed(2);
    const pct = p.revenue === 0 ? (c.revenue ? '∞%' : '0%') : `${(((c.revenue - p.revenue) / p.revenue) * 100).toFixed(1)}%`;
    const last = lastMap.get(k) ?? '—';

    let status: MachineSummary['status'] = 'offline';
    if (last !== '—') {
      const d = daysBetween(last);
      status = d <= 2 ? 'online' : d <= 7 ? 'idle' : 'offline';
    }

    out.push({
      machine: k,
      location: c.location,
      tx: c.tx,
      revenue: +c.revenue.toFixed(2),
      prevRevenue: +p.revenue.toFixed(2),
      delta,
      pct,
      lastSale: last,
      status,
    });
  }
  // sort by current revenue desc
  out.sort((a, b) => b.revenue - a.revenue);
  return out;
}

export function exportMachinesCSV(rows: MachineSummary[], days: number) {
  const header = 'machine,location,status,last_sale,tx,revenue,prev_revenue,delta,pct,window_days';
  const lines = rows.map(r =>
    [r.machine, r.location, r.status, r.lastSale, r.tx, r.revenue.toFixed(2), r.prevRevenue.toFixed(2), r.delta.toFixed(2), r.pct, days]
      .map(v => (typeof v === 'string' && v.includes(',') ? `\"${v}\"` : v))
      .join(',')
  );
  const csv = [header, ...lines].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  a.download = `gotham-machine-summary-last-${days}-days.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* =========================================================
   MOVERS ANALYSIS
========================================================= */
export function moversForKey(
  rows: SaleRow[],
  prevRows: SaleRow[],
  keyFn: (r: SaleRow) => string,
  limit = 5
) {
  const cur = new Map<string, { tx: number; revenue: number }>();
  const prev = new Map<string, { tx: number; revenue: number }>();

  for (const r of rows) {
    const k = keyFn(r);
    const c = cur.get(k) || { tx: 0, revenue: 0 };
    c.tx += 1; c.revenue += r.revenue; cur.set(k, c);
  }
  for (const r of prevRows) {
    const k = keyFn(r);
    const p = prev.get(k) || { tx: 0, revenue: 0 };
    p.tx += 1; p.revenue += r.revenue; prev.set(k, p);
  }

  const keys = new Set<string>([...cur.keys(), ...prev.keys()]);
  const all = Array.from(keys).map(k => {
    const c = cur.get(k) || { tx: 0, revenue: 0 };
    const p = prev.get(k) || { tx: 0, revenue: 0 };
    const delta = +(c.revenue - p.revenue).toFixed(2);
    const pct = p.revenue === 0 ? (c.revenue ? '∞%' : '0%') : `${(((c.revenue - p.revenue) / p.revenue) * 100).toFixed(1)}%`;
    return { key: k, curr: +c.revenue.toFixed(2), prev: +p.revenue.toFixed(2), delta, pct, txCurr: c.tx, txPrev: p.tx };
  });

  const gainers = all.filter(x => x.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, limit);
  const decliners = all.filter(x => x.delta < 0).sort((a, b) => a.delta - b.delta).slice(0, limit);
  return { gainers, decliners };
}

/* =========================================================
   STOCKOUT ANALYSIS
========================================================= */
export type StockCandidate = {
  key: string;              // "M-001 · Candy Bar"
  location: string;
  machine: string;
  product: string;
  streak: number;           // trailing zero-days
  currTx: number;           // transactions in current window
  prevTx: number;           // transactions in previous window
  dropPct: number;          // % drop vs prev (0..100)
};

function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function makeDayLabels(days: number) {
  const labels: string[] = [];
  const end = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    labels.push(ymd(d));
  }
  return labels;
}

function trailingZeroStreak(arr: number[]) {
  let s = 0;
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] === 0) s++;
    else break;
  }
  return s;
}

export function stockoutCandidates(rows: SaleRow[], prevRows: SaleRow[], days: number): StockCandidate[] {
  const labels = makeDayLabels(days);
  const idx = new Map(labels.map((d, i) => [d, i]));

  // group by machine+product (and keep location for reporting)
  type Acc = { location: string; machine: string; product: string; series: number[] };
  const byKey = new Map<string, Acc>();
  const byKeyPrev = new Map<string, Acc>();

  function add(map: Map<string, Acc>, r: SaleRow) {
    const key = `${r.machine} · ${r.product}`;
    let acc = map.get(key);
    if (!acc) {
      acc = { location: r.location, machine: r.machine, product: r.product, series: Array(labels.length).fill(0) };
      map.set(key, acc);
    }
    const i = idx.get(r.date);
    if (i != null) acc.series[i] += 1; // tx count
  }

  rows.forEach(r => add(byKey, r));
  prevRows.forEach(r => add(byKeyPrev, r));

  const keys = new Set<string>([...byKey.keys(), ...byKeyPrev.keys()]);
  const out: StockCandidate[] = [];

  for (const k of keys) {
    const cur = byKey.get(k) || { location: '—', machine: k.split(' · ')[0], product: k.split(' · ')[1], series: Array(labels.length).fill(0) };
    const prev = byKeyPrev.get(k) || { location: cur.location, machine: cur.machine, product: cur.product, series: Array(labels.length).fill(0) };
    const currTx = cur.series.reduce((s, x) => s + x, 0);
    const prevTx = prev.series.reduce((s, x) => s + x, 0);
    const streak = trailingZeroStreak(cur.series);
    const dropPct = prevTx <= 0 ? 0 : Math.max(0, Math.round(((prevTx - currTx) / prevTx) * 100));

    // Heuristics for "likely stockout"
    const likely =
      streak >= 2 ||                           // no sales for last 2+ days
      (prevTx >= 5 && currTx === 0) ||         // was selling, now nothing
      dropPct >= 70;                            // big drop vs prev

    if (likely) {
      out.push({
        key: k,
        location: cur.location,
        machine: cur.machine,
        product: cur.product,
        streak,
        currTx,
        prevTx,
        dropPct,
      });
    }
  }

  // sort by strongest signals
  out.sort((a, b) => (b.streak - a.streak) || (b.dropPct - a.dropPct) || (a.currTx - b.currTx));
  return out;
}

export function exportStockoutsCSV(cands: StockCandidate[], days: number) {
  const header = 'location,machine,product,zero_day_streak,curr_tx,prev_tx,drop_pct,window_days';
  const lines = cands.map(c =>
    [c.location, c.machine, c.product, c.streak, c.currTx, c.prevTx, `${c.dropPct}%`, days]
      .map(v => (typeof v === 'string' && v.includes(',') ? `\"${v}\"` : v))
      .join(',')
  );
  const csv = [header, ...lines].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  a.download = `gotham-top-stockouts-last-${days}-days.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}
