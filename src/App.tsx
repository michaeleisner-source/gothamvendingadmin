import React from 'react';
import { HashRouter, Routes, Route, Navigate, NavLink, Link, useLocation } from 'react-router-dom';
import { aggBy, moversFor, deltaPct, type SaleRow, type MoverRow } from '@/lib/analytics-utils';
import MiniTable from '@/components/MiniTable';

/* =========================================================
   SAFE SHELL STYLES
========================================================= */
const shellStyles: React.CSSProperties  = { display:'grid', gridTemplateColumns:'240px 1fr', minHeight:'100vh', background:'#f8fafc' };
const headerStyles: React.CSSProperties = { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', background:'#fff', borderBottom:'1px solid #e5e7eb' };
const cardStyle                          = { background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:16 };

/* =========================================================
   INLINE UTILITIES (CSV + TABLE + DEMO DATA)
========================================================= */
function toCSV(rows: any[]) {
  if (!rows?.length) return '';
  const keys = Object.keys(rows[0]);
  const esc = (v:any) => `"${String(v ?? '').replace(/"/g,'""')}"`;
  return [keys.join(','), ...rows.map(r => keys.map(k => esc(r[k])).join(','))].join('\n');
}
function downloadCSV(name: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${name}-${new Date().toISOString().replace(/[:.]/g,'-')}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}
type Col<T> = { key: keyof T & string; label: string; align?: 'left'|'right'|'center'; width?: number|string };

function SimpleTable<T extends Record<string, any>>({ columns, rows }: { columns: Col<T>[]; rows: T[] }) {
  return (
    <div className="gv-table" style={{overflow:'auto', border:'1px solid #e5e7eb', borderRadius:12}}>
      <table style={{borderCollapse:'separate', borderSpacing:0, width:'100%'}}>
        <thead style={{position:'sticky', top:0, background:'#f8fafc', zIndex:1}}>
          <tr>
            {columns.map(c => (
              <th key={c.key}
                  style={{textAlign:c.align||'left', padding:'10px 12px', fontSize:12, color:'#64748b', position:'sticky', top:0, background:'#f8fafc', width:c.width}}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{borderTop:'1px solid #f1f5f9'}}>
              {columns.map(c => (
                <td key={c.key} style={{textAlign:c.align||'left', padding:'10px 12px'}}>
                  {String(r[c.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
const LOCS = ['Manhattan Tech Hub', 'Brooklyn Hospital', 'Queens University', 'Jersey Logistics'];
const MACH = ['M-001', 'M-002', 'M-003', 'M-004', 'M-005'];
const PRODS = [
  { name:'Coke 12oz',  price:2.00 },
  { name:'Pepsi 12oz', price:2.00 },
  { name:'Water 16oz', price:1.50 },
  { name:'Chips BBQ',  price:1.75 },
  { name:'Candy Bar',  price:1.50 },
];
function seeded(seed: number) { let x = seed || 123456789; return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return (x >>> 0) / 0xffffffff; }; }
function getDemoSales(days = 30): SaleRow[] {
  const today = new Date();
  const rng = seeded(days * 1337 + today.getUTCDate());
  const rows: SaleRow[] = [];
  for (let d = 0; d < days; d++) {
    const day = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    day.setUTCDate(day.getUTCDate() - d);
    const iso = day.toISOString().slice(0,10);
    const weekday = day.getUTCDay(); // 0 Sun..6 Sat
    const baseTx = (weekday === 0 || weekday === 6) ? 12 : 28;
    const jitter = Math.floor(rng()*10);
    const txCount = baseTx + jitter;
    for (let i=0;i<txCount;i++){
      const loc = LOCS[Math.floor(rng()*LOCS.length)];
      const mac = MACH[Math.floor(rng()*MACH.length)];
      const prod = PRODS[Math.floor(rng()*PRODS.length)];
      const qty = 1 + (rng()<0.12 ? 1 : 0);
      const price = prod.price;
      rows.push({ date:iso, location:loc, machine:mac, product:prod.name, qty, price, revenue:+(qty*price).toFixed(2) });
    }
  }
  rows.sort((a,b)=> (a.date<b.date?1:-1));
  return rows;
}
function sum(arr:number[]) { return arr.reduce((a,b)=>a+b,0); }
function uniq<T>(arr:T[]) { return Array.from(new Set(arr)); }
function pct(n:number, d:number) { if (!d) return '0%'; return `${((n/d)*100).toFixed(1)}%`; }
function Bar({value, max}:{value:number; max:number}) {
  const w = max ? Math.max(2, (value/max)*100) : 0;
  return (
    <div style={{height:8, background:'#eef2ff', borderRadius:999}}>
      <div style={{height:'100%', width:`${w}%`, background:'#6366f1', borderRadius:999}} />
    </div>
  );
}

/* =========================================================
   MACHINE SUMMARY HELPERS
========================================================= */
type MachineSummary = {
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

function summarizeMachines(rows: SaleRow[], prevRows: SaleRow[]): MachineSummary[] {
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

function exportMachinesCSV(rows: MachineSummary[], days: number) {
  const header = 'machine,location,status,last_sale,tx,revenue,prev_revenue,delta,pct,window_days';
  const lines = rows.map(r =>
    [r.machine, r.location, r.status, r.lastSale, r.tx, r.revenue.toFixed(2), r.prevRevenue.toFixed(2), r.delta.toFixed(2), r.pct, days]
      .map(v => (typeof v === 'string' && v.includes(',') ? `"${v}"` : v))
      .join(',')
  );
  const csv = [header, ...lines].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  a.download = `gotham-machine-summary-last-${days}-days.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ---------- generic movers (for machines) ---------- */
function moversForKey(
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
   STOCKOUT HELPERS
========================================================= */
type StockCandidate = {
  key: string;              // "M-001 · Candy Bar" (you can change the format)
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
function stockoutCandidates(rows: SaleRow[], prevRows: SaleRow[], days: number): StockCandidate[] {
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

function exportStockoutsCSV(cands: StockCandidate[], days: number) {
  const header = 'location,machine,product,zero_day_streak,curr_tx,prev_tx,drop_pct,window_days';
  const lines = cands.map(c =>
    [c.location, c.machine, c.product, c.streak, c.currTx, c.prevTx, `${c.dropPct}%`, days]
      .map(v => (typeof v === 'string' && v.includes(',') ? `"${v}"` : v))
      .join(',')
  );
  const csv = [header, ...lines].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  a.download = `gotham-top-stockouts-last-${days}-days.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ---------- tiny table for stockouts ---------- */
function StockMiniTable({
  title,
  rows,
  limit = 10,
}: {
  title: string;
  rows: StockCandidate[];
  limit?: number;
}) {
  const top = rows.slice(0, limit);
  return (
    <div className="card" style={cardStyle}>
      <div style={{ fontWeight: 800, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>Trailing zero-days & drop vs prev</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr .6fr .6fr .6fr .6fr', gap: 6, fontSize: 13 }}>
        <div style={{ fontWeight: 700, color: '#0f172a' }}>Machine · Product</div>
        <div style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>Streak</div>
        <div style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>Curr Tx</div>
        <div style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>Prev Tx</div>
        <div style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>Drop</div>
        {top.length === 0 && <div style={{ gridColumn: '1 / -1', color: '#64748b' }}>No candidates</div>}
        {top.map((r) => (
          <React.Fragment key={`${r.machine}·${r.product}`}>
            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {r.machine} · {r.product}
            </div>
            <div style={{ textAlign: 'right', color: r.streak >= 2 ? '#dc2626' : '#0f172a' }}>{r.streak}</div>
            <div style={{ textAlign: 'right' }}>{r.currTx}</div>
            <div style={{ textAlign: 'right', color: '#64748b' }}>{r.prevTx}</div>
            <div style={{ textAlign: 'right', color: r.dropPct >= 70 ? '#dc2626' : '#0f172a' }}>-{r.dropPct}%</div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   PAGES
========================================================= */
function ScaffoldPage({ title }: { title:string }) {
  return (
    <div className="card" style={cardStyle}>
      <div style={{fontWeight:800}}>{title}</div>
      <div style={{color:'#64748b'}}>Scaffold placeholder — content coming next.</div>
    </div>
  );
}

/* ---------- Reports / Stockouts (Top Stockouts + CSV) ---------- */
function StockoutsPage() {
  const [days, setDays] = React.useState<7 | 14 | 30>(14);

  // current & previous windows (demo uses same generator)
  const rows = React.useMemo(() => getDemoSales(days), [days]);
  const prevRows = React.useMemo(() => getDemoSales(days), [days]);

  const candidates = React.useMemo(() => stockoutCandidates(rows, prevRows, days), [rows, prevRows, days]);

  // simple location aggregation
  const byLocation = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const c of candidates) m.set(c.location, (m.get(c.location) || 0) + 1);
    return Array.from(m.entries())
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count);
  }, [candidates]);

  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent('gv:breadcrumb:set', { detail: 'Stockouts' }));
    return () => {
      window.dispatchEvent(new CustomEvent('gv:breadcrumb:set', { detail: null }));
    };
  }, []);

  const chip = (label: string, active: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      style={{
        padding: '6px 10px',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        background: active ? '#eef2ff' : '#fff',
        fontWeight: active ? 700 : 500,
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {/* Header */}
      <div className="card" style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontWeight: 800 }}>Top Stockouts</div>
        <div style={{ marginLeft: 12, display: 'inline-flex', gap: 8 }}>
          {chip('7d', days === 7, () => setDays(7))}
          {chip('14d', days === 14, () => setDays(14))}
          {chip('30d', days === 30, () => setDays(30))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'inline-flex', gap: 12 }}>
          <div><strong>Candidates:</strong> {candidates.length}</div>
          <div><strong>Locations affected:</strong> {byLocation.length}</div>
          <button
            onClick={() => exportStockoutsCSV(candidates, days)}
            style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', fontWeight: 600 }}
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Layout: left candidates, right locations */}
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '2fr 1fr' }}>
        <StockMiniTable title="Likely Stockouts (Machine · Product)" rows={candidates} />

        <div className="card" style={cardStyle}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Locations Most Impacted</div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>Count of stockout candidates</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 6, fontSize: 13 }}>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>Location</div>
            <div style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>Count</div>
            {byLocation.length === 0 && <div style={{ gridColumn: '1 / -1', color: '#64748b' }}>No data</div>}
            {byLocation.map((r) => (
              <React.Fragment key={r.location}>
                <div>{r.location}</div>
                <div style={{ textAlign: 'right' }}>{r.count}</div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Sales (detail table + Top Movers) ---------- */
function SalesPage() {
  const [days, setDays] = React.useState<number>(30);
  const rows = React.useMemo(() => getDemoSales(days), [days]);

  // DEMO previous period: mirror generator. In prod, fetch offset window.
  const prevRows = React.useMemo(() => getDemoSales(days), [days]);

  const totalRows = rows.length;
  const totalQty = rows.reduce((s, r) => s + r.qty, 0);
  const totalRevenue = +rows.reduce((s, r) => s + r.revenue, 0).toFixed(2);

  const productMovers = React.useMemo(() => moversFor(rows, prevRows, 'product'), [rows, prevRows]);
  const locationMovers = React.useMemo(() => moversFor(rows, prevRows, 'location'), [rows, prevRows]);

  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent('gv:breadcrumb:set', { detail: 'Sales' }));
    return () => {
      window.dispatchEvent(new CustomEvent('gv:breadcrumb:set', { detail: null }));
    };
  }, []);

  const onExport = () => {
    // prefer your global CSV exporter if present
    // @ts-ignore
    if (window.exportSalesCSV) { /* @ts-ignore */ window.exportSalesCSV(days); return; }
    // local fallback
    const header = 'date,location,machine,product,qty,price,revenue';
    const lines = rows.map(r =>
      [r.date, r.location, r.machine, r.product, r.qty, r.price.toFixed(2), r.revenue.toFixed(2)]
        .map(v => (typeof v === 'string' && v.includes(',') ? `"${v}"` : v))
        .join(',')
    );
    const csv = [header, ...lines].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const now = new Date();
    const ts = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}-${String(now.getHours()).padStart(2,'0')}-${String(now.getMinutes()).padStart(2,'0')}-${String(now.getSeconds()).padStart(2,'0')}`;
    a.download = `gotham-sales-last-${days}-days-${ts}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const Input = (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <label htmlFor="salesDays" style={{ fontSize: 12, color: '#64748b' }}>Days</label>
      <input
        id="salesDays"
        type="number"
        min={1}
        max={365}
        value={days}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (Number.isFinite(v)) setDays(Math.min(365, Math.max(1, v)));
        }}
        style={{ width: 72, padding: '6px 8px', border: '1px solid #e5e7eb', borderRadius: 8 }}
      />
      <button
        onClick={onExport}
        style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', fontWeight: 600 }}
        title="Download CSV"
      >
        Export CSV
      </button>
    </div>
  );

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {/* Header */}
      <div className="card" style={{ ...cardStyle, display: 'flex', alignItems: 'center' }}>
        <div style={{ fontWeight: 800 }}>Sales Detail</div>
        <div style={{ marginLeft: 'auto' }}>{Input}</div>
      </div>

      {/* Totals */}
      <div className="card" style={cardStyle}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div><strong>Total Rows:</strong> {totalRows.toLocaleString()}</div>
          <div><strong>Total Qty:</strong> {totalQty.toLocaleString()}</div>
          <div><strong>Total Revenue:</strong> ${totalRevenue.toLocaleString()}</div>
        </div>
      </div>

      {/* Main + sidebar */}
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '2fr 1fr' }}>
        {/* Table */}
        <div className="card" style={{ ...cardStyle, overflow: 'auto' }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Transactions</div>
          <table className="gv-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #e5e7eb' }}>Date</th>
                <th style={{ textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #e5e7eb' }}>Location</th>
                <th style={{ textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #e5e7eb' }}>Machine</th>
                <th style={{ textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #e5e7eb' }}>Product</th>
                <th style={{ textAlign: 'right', padding: '8px 6px', borderBottom: '1px solid #e5e7eb' }}>Qty</th>
                <th style={{ textAlign: 'right', padding: '8px 6px', borderBottom: '1px solid #e5e7eb' }}>Price</th>
                <th style={{ textAlign: 'right', padding: '8px 6px', borderBottom: '1px solid #e5e7eb' }}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td style={{ padding: '8px 6px', borderBottom: '1px solid #f1f5f9' }}>{r.date}</td>
                  <td style={{ padding: '8px 6px', borderBottom: '1px solid #f1f5f9' }}>{r.location}</td>
                  <td style={{ padding: '8px 6px', borderBottom: '1px solid #f1f5f9' }}>{r.machine}</td>
                  <td style={{ padding: '8px 6px', borderBottom: '1px solid #f1f5f9' }}>{r.product}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'right', borderBottom: '1px solid #f1f5f9' }}>{r.qty}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'right', borderBottom: '1px solid #f1f5f9' }}>${r.price.toFixed(2)}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'right', borderBottom: '1px solid #f1f5f9' }}>${r.revenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sidebar: Top Movers */}
        <div style={{ display: 'grid', gap: 12 }}>
          <MiniTable title="Top Product Gainers (vs prev)" rows={productMovers.gainers} />
          <MiniTable title="Top Product Decliners (vs prev)" rows={productMovers.decliners} />
          <MiniTable title="Top Location Gainers (vs prev)" rows={locationMovers.gainers} />
          <MiniTable title="Top Location Decliners (vs prev)" rows={locationMovers.decliners} />
        </div>
      </div>
    </div>
  );
}

/* ---------- Trends (Revenue & Transactions over time) ---------- */
function Sparkline({ values, height = 80 }: { values: number[]; height?: number }) {
  const w = Math.max(120, (values.length - 1) * 14 + 6);
  const maxY = Math.max(1, ...values);
  const pad = 3;
  const h = height;
  const toY = (v: number) => (1 - v / maxY) * (h - pad * 2) + pad;
  const toX = (i: number) => (i / Math.max(1, values.length - 1)) * (w - pad * 2) + pad;

  const d = values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`).join(' ');
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={d} fill="none" stroke="#6366f1" strokeWidth="2" />
      {/* area fill */}
      {values.length > 1 && (
        <path
          d={`${d} L ${toX(values.length - 1).toFixed(1)} ${toY(0).toFixed(1)} L ${toX(0).toFixed(1)} ${toY(0).toFixed(1)} Z`}
          fill="url(#sparkFill)"
        />
      )}
    </svg>
  );
}

function makeDayKey(d: Date) { return d.toISOString().slice(0, 10); }

function seriesByDay(rows: SaleRow[], days: number, measure: 'revenue' | 'tx') {
  // build a map of yyyy-mm-dd -> value
  const map = new Map<string, { tx: number; revenue: number }>();
  for (const r of rows) {
    const m = map.get(r.date) || { tx: 0, revenue: 0 };
    m.tx += 1;
    m.revenue += r.revenue;
    map.set(r.date, m);
  }
  // ensure every day has a value (including zeros)
  const today = new Date();
  const out: number[] = [];
  const labels: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    d.setUTCDate(d.getUTCDate() - i);
    const key = makeDayKey(d);
    const v = map.get(key);
    out.push(+((v?.[measure] ?? 0).toFixed(2)));
    labels.push(key);
  }
  return { labels, values: out };
}

function exportTrendsCSV(labels: string[], revValues: number[], txValues: number[]) {
  const header = 'date,revenue,transactions';
  const rows = labels.map((d, i) => `${d},${revValues[i].toFixed(2)},${txValues[i]}`);
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `gotham-trends-${labels[0]}_to_${labels[labels.length - 1]}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function TrendsPage() {
  const [days, setDays] = React.useState<7 | 30 | 90>(30);

  // current period
  const rows = React.useMemo(() => getDemoSales(days), [days]);

  // DEMO NOTE: mirrors current-period generator for "previous period"
  // In prod, fetch previous window (offset = days).
  const prevRows = React.useMemo(() => getDemoSales(days), [days]);

  const revSeries = React.useMemo(() => seriesByDay(rows, days, 'revenue'), [rows, days]);
  const txSeries = React.useMemo(() => seriesByDay(rows, days, 'tx'), [rows, days]);

  const totalRev = +rows.reduce((s, r) => s + r.revenue, 0).toFixed(2);
  const totalTx = rows.length;
  const prevRev = +prevRows.reduce((s, r) => s + r.revenue, 0).toFixed(2);
  const prevTx = prevRows.length;

  const productMovers = React.useMemo(() => moversFor(rows, prevRows, 'product'), [rows, prevRows]);
  const locationMovers = React.useMemo(() => moversFor(rows, prevRows, 'location'), [rows, prevRows]);

  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent('gv:breadcrumb:set', { detail: 'Trends' }));
    return () => {
      window.dispatchEvent(new CustomEvent('gv:breadcrumb:set', { detail: null }));
    };
  }, []);

  const chip = (label: string, active: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      style={{
        padding: '6px 10px',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        background: active ? '#eef2ff' : '#fff',
        fontWeight: active ? 700 : 500,
      }}
    >
      {label}
    </button>
  );

  const Stat = ({ label, value, sub }: { label: string; value: string; sub: string }) => (
    <div style={{ ...cardStyle, padding: '8px 12px' }}>
      <div style={{ fontSize: 12, color: '#64748b' }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 18 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#16a34a' }}>{sub}</div>
    </div>
  );

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {/* Header & controls */}
      <div className="card" style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontWeight: 800 }}>Trends</div>
        <div style={{ marginLeft: 12, display: 'inline-flex', gap: 8 }}>
          {chip('Last 7d', days === 7, () => setDays(7))}
          {chip('Last 30d', days === 30, () => setDays(30))}
          {chip('Last 90d', days === 90, () => setDays(90))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'inline-flex', gap: 12 }}>
          <Stat label="Revenue" value={`$${totalRev.toLocaleString()}`} sub={`${deltaPct(totalRev, prevRev)} vs prev`} />
          <Stat label="Transactions" value={totalTx.toLocaleString()} sub={`${deltaPct(totalTx, prevTx)} vs prev`} />
          <button
            onClick={() => exportTrendsCSV(revSeries.labels, revSeries.values, txSeries.values)}
            style={{
              padding: '8px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              background: '#fff',
              fontWeight: 600,
            }}
            title="Download date/revenue/transactions CSV"
          >
            Export Trends CSV
          </button>
        </div>
      </div>

      {/* Revenue trend */}
      <div className="card" style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <div style={{ fontWeight: 800 }}>Revenue Trend</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {revSeries.labels[0]} → {revSeries.labels[revSeries.labels.length - 1]}
          </div>
        </div>
        <Sparkline values={revSeries.values} height={120} />
      </div>

      {/* Transactions trend */}
      <div className="card" style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <div style={{ fontWeight: 800 }}>Transactions Trend</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {txSeries.labels[0]} → {txSeries.labels[txSeries.labels.length - 1]}
          </div>
        </div>
        <Sparkline values={txSeries.values} height={120} />
      </div>

      {/* Top movers (Products & Locations) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <MiniTable title="Top Product Gainers (WoW)" rows={productMovers.gainers} />
        <MiniTable title="Top Product Decliners (WoW)" rows={productMovers.decliners} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <MiniTable title="Top Location Gainers (WoW)" rows={locationMovers.gainers} />
        <MiniTable title="Top Location Decliners (WoW)" rows={locationMovers.decliners} />
      </div>
    </div>
  );
}

/* ---------- Aggregations shared by performance pages ---------- */
type AggRow = { key:string; tx:number; qty:number; revenue:number };
function aggregateBy(rows: SaleRow[], key: keyof SaleRow): AggRow[] {
  const map = new Map<string, AggRow>();
  for (const r of rows) {
    const k = String(r[key]);
    const prev = map.get(k) || { key:k, tx:0, qty:0, revenue:0 };
    prev.tx += 1; prev.qty += r.qty; prev.revenue += r.revenue;
    map.set(k, prev);
  }
  const arr = Array.from(map.values());
  arr.forEach(a => a.revenue = +a.revenue.toFixed(2));
  arr.sort((a,b)=> b.revenue - a.revenue);
  return arr;
}
function KPI({label, value}:{label:string; value:string}) {
  return (
    <div style={{...cardStyle, padding:'12px'}}>
      <div style={{fontSize:12, color:'#64748b'}}>{label}</div>
      <div style={{fontWeight:800, fontSize:20, marginTop:4}}>{value}</div>
    </div>
  );
}

/* ---------- Product Performance ---------- */
function ProductPerformancePage() {
  const [days, setDays] = React.useState(30);
  const rows = React.useMemo(()=>getDemoSales(days),[days]);
  const byProd = React.useMemo(()=>aggregateBy(rows,'product'),[rows]);
  const totalRev = +rows.reduce((s,r)=>s+r.revenue,0).toFixed(2);
  const maxRev = byProd[0]?.revenue || 0;

  React.useEffect(()=>{
    window.dispatchEvent(new CustomEvent('gv:breadcrumb:set', { detail: 'Product Performance' }));
    return () => {
      window.dispatchEvent(new CustomEvent('gv:breadcrumb:set', { detail: null }));
    };
  },[]);

  const view = byProd.map(r => ({
    product: r.key,
    tx: r.tx,
    qty: r.qty,
    revenueFmt: `$${r.revenue.toFixed(2)}`,
    share: pct(r.revenue, totalRev),
    _rev: r.revenue
  }));

  const cols = [
    { key:'product',   label:'Product' },
    { key:'tx',        label:'Tx', align:'right', width:80 },
    { key:'qty',       label:'Qty', align:'right', width:80 },
    { key:'revenueFmt',label:'Revenue', align:'right', width:110 },
    { key:'share',     label:'Share', align:'right', width:90 },
  ] as Col<any>[];

  function exportCSV(){
    const csv = toCSV(byProd);
    downloadCSV(`gotham-products-last-${days}-days`, csv);
  }

  return (
    <div style={{display:'grid', gap:12}}>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12}}>
        <KPI label="Days" value={`${days}`} />
        <KPI label="Products" value={`${byProd.length}`} />
        <KPI label="Total Tx" value={String(rows.length)} />
        <KPI label="Total Revenue" value={`$${totalRev.toLocaleString()}`} />
      </div>

      <div className="card" style={{...cardStyle, display:'flex', alignItems:'center', gap:12}}>
        <div style={{fontWeight:800}}>Product Performance</div>
        <label style={{display:'inline-flex', alignItems:'center', gap:6}}>
          Days
          <input type="number" min={1} max={365} value={days}
                 onChange={e=>setDays(Math.max(1, Math.min(365, Number(e.target.value)||30)))}
                 style={{width:80, padding:'6px 8px', border:'1px solid #e5e7eb', borderRadius:8}}/>
        </label>
        <button onClick={exportCSV} className="btn"
                style={{marginLeft:'auto', padding:'8px 12px', border:'1px solid #e5e7eb', borderRadius:8, background:'#fff'}}>
          Export CSV
        </button>
      </div>

      <div className="card" style={cardStyle}>
        <div style={{display:'grid', gap:10}}>
          {byProd.slice(0,5).map((r)=>(
            <div key={r.key}>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:12, color:'#475569', marginBottom:6}}>
                <div>{r.key}</div>
                <div><b>${r.revenue.toFixed(2)}</b> • {pct(r.revenue,totalRev)}</div>
              </div>
              <Bar value={r.revenue} max={maxRev} />
            </div>
          ))}
        </div>
        <div style={{height:12}} />
        <SimpleTable columns={cols as any} rows={view as any} />
      </div>
    </div>
  );
}

/* ---------- Reports / Machines (Summary + Top Movers + CSV) ---------- */
function MachinesReportPage() {
  const [days, setDays] = React.useState<7 | 14 | 30>(14);

  // demo windows (in prod, fetch true prior window)
  const rows = React.useMemo(() => getDemoSales(days), [days]);
  const prevRows = React.useMemo(() => getDemoSales(days), [days]);

  const summaries = React.useMemo(() => summarizeMachines(rows, prevRows), [rows, prevRows]);
  const totalRevenue = summaries.reduce((s, r) => s + r.revenue, 0);
  const online = summaries.filter(s => s.status === 'online').length;
  const idle = summaries.filter(s => s.status === 'idle').length;
  const offline = summaries.filter(s => s.status === 'offline').length;

  const movers = React.useMemo(() => moversForKey(rows, prevRows, (r) => r.machine), [rows, prevRows]);

  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent('gv:breadcrumb:set', { detail: 'Machine Reports' }));
    return () => {
      window.dispatchEvent(new CustomEvent('gv:breadcrumb:set', { detail: null }));
    };
  }, []);

  const chip = (label: string, active: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      style={{
        padding: '6px 10px',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        background: active ? '#eef2ff' : '#fff',
        fontWeight: active ? 700 : 500,
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {/* Header */}
      <div className="card" style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontWeight: 800 }}>Machines Overview</div>
        <div style={{ marginLeft: 12, display: 'inline-flex', gap: 8 }}>
          {chip('7d', days === 7, () => setDays(7))}
          {chip('14d', days === 14, () => setDays(14))}
          {chip('30d', days === 30, () => setDays(30))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'inline-flex', gap: 16, alignItems: 'center' }}>
          <div><strong>Machines:</strong> {summaries.length}</div>
          <div><strong>Online:</strong> {online}</div>
          <div><strong>Idle:</strong> {idle}</div>
          <div><strong>Offline:</strong> {offline}</div>
          <div><strong>Revenue:</strong> ${totalRevenue.toFixed(2)}</div>
          <button
            onClick={() => exportMachinesCSV(summaries, days)}
            style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', fontWeight: 600 }}
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Layout: main table + sidebar movers */}
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '2fr 1fr' }}>
        {/* Main: Machine summary table */}
        <div className="card" style={{ ...cardStyle, overflow: 'auto' }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Machine Summary (last {days} days)</div>
          <table className="gv-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #e5e7eb' }}>Machine</th>
                <th style={{ textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #e5e7eb' }}>Location</th>
                <th style={{ textAlign: 'center', padding: '8px 6px', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #e5e7eb' }}>Last Sale</th>
                <th style={{ textAlign: 'right', padding: '8px 6px', borderBottom: '1px solid #e5e7eb' }}>Tx</th>
                <th style={{ textAlign: 'right', padding: '8px 6px', borderBottom: '1px solid #e5e7eb' }}>Revenue</th>
                <th style={{ textAlign: 'right', padding: '8px 6px', borderBottom: '1px solid #e5e7eb' }}>Prev Rev</th>
                <th style={{ textAlign: 'right', padding: '8px 6px', borderBottom: '1px solid #e5e7eb' }}>Δ</th>
                <th style={{ textAlign: 'right', padding: '8px 6px', borderBottom: '1px solid #e5e7eb' }}>%</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((r) => (
                <tr key={r.machine}>
                  <td style={{ padding: '8px 6px', borderBottom: '1px solid #f1f5f9' }}>{r.machine}</td>
                  <td style={{ padding: '8px 6px', borderBottom: '1px solid #f1f5f9' }}>{r.location}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 700,
                        background: r.status === 'online' ? '#ecfdf5' : r.status === 'idle' ? '#fffbeb' : '#fef2f2',
                        color: r.status === 'online' ? '#065f46' : r.status === 'idle' ? '#92400e' : '#991b1b',
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td style={{ padding: '8px 6px', borderBottom: '1px solid #f1f5f9' }}>{r.lastSale}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'right', borderBottom: '1px solid #f1f5f9' }}>{r.tx}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'right', borderBottom: '1px solid #f1f5f9' }}>${r.revenue.toFixed(2)}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'right', borderBottom: '1px solid #f1f5f9' }}>${r.prevRevenue.toFixed(2)}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'right', color: r.delta >= 0 ? '#16a34a' : '#dc2626', borderBottom: '1px solid #f1f5f9' }}>
                    {r.delta >= 0 ? '+' : ''}{r.delta.toFixed(2)}
                  </td>
                  <td style={{ padding: '8px 6px', textAlign: 'right', color: r.delta >= 0 ? '#16a34a' : '#dc2626', borderBottom: '1px solid #f1f5f9' }}>
                    {r.pct}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sidebar: Top Movers */}
        <div style={{ display: 'grid', gap: 12 }}>
          <MiniTable title="Top Machine Gainers (vs prev)" rows={movers.gainers} />
          <MiniTable title="Top Machine Decliners (vs prev)" rows={movers.decliners} />
        </div>
      </div>
    </div>
  );
}

/* ---------- Machine Performance ---------- */
function MachinePerformancePage() {
  const [days, setDays] = React.useState<7 | 14 | 30>(30);
  const rows = React.useMemo(() => getDemoSales(days), [days]);
  const prevRows = React.useMemo(() => getDemoSales(days), [days]);
  
  const machines = React.useMemo(() => summarizeMachines(rows, prevRows), [rows, prevRows]);
  const machineMovers = React.useMemo(() => moversForKey(rows, prevRows, r => r.machine), [rows, prevRows]);

  const totalRev = +rows.reduce((s, r) => s + r.revenue, 0).toFixed(2);
  const onlineCount = machines.filter(m => m.status === 'online').length;
  const idleCount = machines.filter(m => m.status === 'idle').length;
  const offlineCount = machines.filter(m => m.status === 'offline').length;

  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent('gv:breadcrumb:set', { detail: 'Machine Performance' }));
    return () => {
      window.dispatchEvent(new CustomEvent('gv:breadcrumb:set', { detail: null }));
    };
  }, []);

  const chip = (label: string, active: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      style={{
        padding: '6px 10px',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        background: active ? '#eef2ff' : '#fff',
        fontWeight: active ? 700 : 500,
      }}
    >
      {label}
    </button>
  );

  const StatusBadge = ({ status }: { status: MachineSummary['status'] }) => {
    const colors = {
      online: '#16a34a',
      idle: '#eab308',
      offline: '#dc2626'
    };
    return (
      <span
        style={{
          padding: '2px 6px',
          borderRadius: 4,
          fontSize: 11,
          color: '#fff',
          background: colors[status],
          fontWeight: 600,
          textTransform: 'uppercase'
        }}
      >
        {status}
      </span>
    );
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {/* Header */}
      <div className="card" style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontWeight: 800 }}>Machine Performance</div>
        <div style={{ marginLeft: 12, display: 'inline-flex', gap: 8 }}>
          {chip('7d', days === 7, () => setDays(7))}
          {chip('14d', days === 14, () => setDays(14))}
          {chip('30d', days === 30, () => setDays(30))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'inline-flex', gap: 12 }}>
          <div><strong>Total Revenue:</strong> ${totalRev.toLocaleString()}</div>
          <div><strong>Online:</strong> {onlineCount}</div>
          <div><strong>Idle:</strong> {idleCount}</div>
          <div><strong>Offline:</strong> {offlineCount}</div>
          <button
            onClick={() => exportMachinesCSV(machines, days)}
            style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', fontWeight: 600 }}
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Main + sidebar */}
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '2fr 1fr' }}>
        {/* Machine table */}
        <div className="card" style={{ ...cardStyle, overflow: 'auto' }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Machine Summary</div>
          <table className="gv-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #e5e7eb' }}>Machine</th>
                <th style={{ textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #e5e7eb' }}>Location</th>
                <th style={{ textAlign: 'center', padding: '8px 6px', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #e5e7eb' }}>Last Sale</th>
                <th style={{ textAlign: 'right', padding: '8px 6px', borderBottom: '1px solid #e5e7eb' }}>Tx</th>
                <th style={{ textAlign: 'right', padding: '8px 6px', borderBottom: '1px solid #e5e7eb' }}>Revenue</th>
                <th style={{ textAlign: 'right', padding: '8px 6px', borderBottom: '1px solid #e5e7eb' }}>Δ vs Prev</th>
                <th style={{ textAlign: 'right', padding: '8px 6px', borderBottom: '1px solid #e5e7eb' }}>%</th>
              </tr>
            </thead>
            <tbody>
              {machines.map((m, i) => (
                <tr key={i}>
                  <td style={{ padding: '8px 6px', borderBottom: '1px solid #f1f5f9' }}>{m.machine}</td>
                  <td style={{ padding: '8px 6px', borderBottom: '1px solid #f1f5f9' }}>{m.location}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>
                    <StatusBadge status={m.status} />
                  </td>
                  <td style={{ padding: '8px 6px', borderBottom: '1px solid #f1f5f9' }}>{m.lastSale}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'right', borderBottom: '1px solid #f1f5f9' }}>{m.tx}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'right', borderBottom: '1px solid #f1f5f9' }}>${m.revenue.toFixed(2)}</td>
                  <td style={{ 
                    padding: '8px 6px', 
                    textAlign: 'right', 
                    borderBottom: '1px solid #f1f5f9',
                    color: m.delta >= 0 ? '#16a34a' : '#dc2626'
                  }}>
                    {m.delta >= 0 ? '+' : ''}{m.delta.toFixed(2)}
                  </td>
                  <td style={{ 
                    padding: '8px 6px', 
                    textAlign: 'right', 
                    borderBottom: '1px solid #f1f5f9',
                    color: m.delta >= 0 ? '#16a34a' : '#dc2626'
                  }}>
                    {m.pct}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sidebar: Top Movers */}
        <div style={{ display: 'grid', gap: 12 }}>
          <MiniTable title="Top Machine Gainers (vs prev)" rows={machineMovers.gainers} />
          <MiniTable title="Top Machine Decliners (vs prev)" rows={machineMovers.decliners} />
        </div>
      </div>
    </div>
  );
}
/* ---------- Location Performance ---------- */
function LocationPerformancePage() {
  const [days, setDays] = React.useState(30);
  const rows = React.useMemo(()=>getDemoSales(days),[days]);
  const byLoc = React.useMemo(()=>aggregateBy(rows,'location'),[rows]);
  const totalRev = +rows.reduce((s,r)=>s+r.revenue,0).toFixed(2);
  const maxRev = byLoc[0]?.revenue || 0;

  React.useEffect(()=>{
    window.dispatchEvent(new CustomEvent('gv:breadcrumb:set', { detail: 'Location Performance' }));
    return () => {
      window.dispatchEvent(new CustomEvent('gv:breadcrumb:set', { detail: null }));
    };
  },[]);

  const locToMachines = new Map<string, Set<string>>();
  for (const r of rows) {
    if (!locToMachines.has(r.location)) locToMachines.set(r.location, new Set());
    locToMachines.get(r.location)!.add(r.machine);
  }

  const view = byLoc.map(r => ({
    location: r.key,
    machines: locToMachines.get(r.key)?.size || 1,
    tx: r.tx,
    qty: r.qty,
    revenueFmt: `$${r.revenue.toFixed(2)}`,
    share: pct(r.revenue, totalRev),
    _rev: r.revenue
  }));

  const cols = [
    { key:'location',  label:'Location' },
    { key:'machines',  label:'#Machines', align:'right', width:110 },
    { key:'tx',        label:'Tx', align:'right', width:80 },
    { key:'qty',       label:'Qty', align:'right', width:80 },
    { key:'revenueFmt',label:'Revenue', align:'right', width:110 },
    { key:'share',     label:'Share', align:'right', width:90 },
  ] as Col<any>[];

  function exportCSV(){
    const csv = toCSV(byLoc);
    downloadCSV(`gotham-locations-last-${days}-days`, csv);
  }

  return (
    <div style={{display:'grid', gap:12}}>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12}}>
        <KPI label="Days" value={`${days}`} />
        <KPI label="Locations" value={`${byLoc.length}`} />
        <KPI label="Total Tx" value={String(rows.length)} />
        <KPI label="Total Revenue" value={`$${totalRev.toLocaleString()}`} />
      </div>

      <div className="card" style={{...cardStyle, display:'flex', alignItems:'center', gap:12}}>
        <div style={{fontWeight:800}}>Location Performance</div>
        <label style={{display:'inline-flex', alignItems:'center', gap:6}}>
          Days
          <input type="number" min={1} max={365} value={days}
                 onChange={e=>setDays(Math.max(1, Math.min(365, Number(e.target.value)||30)))}
                 style={{width:80, padding:'6px 8px', border:'1px solid #e5e7eb', borderRadius:8}}/>
        </label>
        <button onClick={exportCSV} className="btn"
                style={{marginLeft:'auto', padding:'8px 12px', border:'1px solid #e5e7eb', borderRadius:8, background:'#fff'}}>
          Export CSV
        </button>
      </div>

      <div className="card" style={cardStyle}>
        <div style={{display:'grid', gap:10}}>
          {byLoc.slice(0,5).map((r)=>(
            <div key={r.key}>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:12, color:'#475569', marginBottom:6}}>
                <div>{r.key}</div>
                <div><b>${r.revenue.toFixed(2)}</b> • {pct(r.revenue,totalRev)}</div>
              </div>
              <Bar value={r.revenue} max={maxRev} />
            </div>
          ))}
        </div>
        <div style={{height:12}} />
        <SimpleTable columns={cols as any} rows={view as any} />
      </div>
    </div>
  );
}

/* =========================================================
   MODERN INLINE ICONS (minimal, crisp)
========================================================= */
function Icon({name}:{name:string}) {
  const common = { fill:'none', stroke:'currentColor', strokeWidth:1.8, strokeLinecap:'round', strokeLinejoin:'round' } as any;
  const c = '#334155';
  const size = 18;
  const paths: Record<string, JSX.Element> = {
    chart: (<> <path d="M4 4v12a2 2 0 0 0 2 2h12" {...common}/> <path d="M8 14V9"/><path d="M12 14V6"/><path d="M16 14v-4"/></>),
    table: (<> <rect x="3" y="5" width="18" height="14" rx="2" {...common}/> <path d="M3 10h18"/><path d="M9 5v14"/></>),
    box:   (<> <rect x="3" y="6" width="18" height="12" rx="2" {...common}/><path d="M3 10h18"/></>),
    pin:   (<> <path d="M12 21s7-5.4 7-11a7 7 0 0 0-14 0c0 5.6 7 11 7 11Z" {...common}/><circle cx="12" cy="10" r="2" {...common}/></>),
    sliders: (<> <path d="M4 6h16"/><path d="M10 6v8"/><path d="M4 12h16"/><path d="M14 12v8"/><path d="M4 18h16"/><path d="M6 18v-8" /></>),
    users: (<> <path d="M16 11a4 4 0 1 0-8 0"/><path d="M3 20a7 7 0 0 1 18 0"/></>),
    card: (<> <rect x="3" y="6" width="18" height="12" rx="2" {...common}/><path d="M3 10h18"/></>),
    help: (<> <circle cx="12" cy="12" r="9" {...common}/><path d="M9.5 9a3 3 0 1 1 4.9 2.4c-.9.6-1.4 1.1-1.4 2.1"/><path d="M12 17h.01"/></>),
    book: (<> <path d="M4 19h12a2 2 0 0 0 2-2V6"/><path d="M4 19a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h12"/><path d="M8 7h8"/></>),
    activity: (<> <path d="M22 12h-4l-3 7-6-14-3 7H2"/></>)
  };
  const node = paths[name] || paths.table;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{color:c, flex:'0 0 auto'}} aria-hidden>
      {node}
    </svg>
  );
}
function iconFor(label:string){
  const l = label.toLowerCase();
  if (l.includes('dashboard') || l.includes('trends')) return 'activity';
  if (l.includes('sales') || l.includes('performance') || l.includes('reports')) return 'chart';
  if (l.includes('locations') || l.includes('installs')) return 'pin';
  if (l.includes('machines') || l.includes('inventory') || l.includes('products') || l.includes('purchase')) return 'box';
  if (l.includes('users') || l.includes('roles')) return 'users';
  if (l.includes('billing') || l.includes('card')) return 'card';
  if (l.includes('settings') || l.includes('service')) return 'sliders';
  if (l.includes('help') || l.includes('glossary')) return 'help';
  if (l.includes('changelog')) return 'book';
  return 'table';
}

/* =========================================================
   NAV / LAYOUT (SIDEBAR + BREADCRUMBS + MAIN)
========================================================= */
const NAV = [
  { title:'Pipeline', items:[ {label:'Leads', path:'/leads'}, {label:'Installs', path:'/installs'} ] },
  { title:'Operations', items:[
    {label:'Dashboard', path:'/dashboard'},
    {label:'Locations', path:'/locations'},
    {label:'Machines',  path:'/machines'},
    {label:'Products',  path:'/products'},
    {label:'Inventory', path:'/inventory'},
    {label:'Purchase Orders', path:'/purchase-orders'},
    {label:'Service',   path:'/service'},
  ]},
  { title:'Sales & Reports', items:[
    {label:'Sales Detail', path:'/sales'},
    {label:'Machine Performance', path:'/reports/machines'},
    {label:'Product Performance', path:'/reports/products'},
    {label:'Location Performance', path:'/reports/locations'},
    {label:'Trends', path:'/reports/trends'},
    {label:'Inventory & Stock-outs', path:'/reports/stockouts'},
    {label:'Exports', path:'/exports'},
  ]},
  { title:'Admin', items:[
    {label:'Users & Roles', path:'/admin/users'},
    {label:'Org Settings',  path:'/admin/settings'},
    {label:'Billing',       path:'/admin/billing'},
  ]},
  { title:'Help', items:[
    {label:'Help Center', path:'/help'},
    {label:'Glossary',    path:'/help/glossary'},
    {label:'Changelog',   path:'/changelog'},
  ]},
] as const;

function Sidebar(){
  return (
    <aside className="gv-sidebar" style={{width:240, borderRight:'1px solid #e5e7eb', background:'#fff'}}>
      <nav className="gv-nav" style={{padding:'12px 8px'}}>
        {NAV.map(section=>(
          <div key={section.title} style={{marginBottom:14}}>
            <div style={{padding:'6px 10px', fontSize:12, color:'#64748b', textTransform:'uppercase', letterSpacing:.4}}>
              {section.title}
            </div>
            <div>
              {section.items.map(item=>(
                <NavLink key={item.path} to={item.path}
                  className={({isActive})=>'gv-nav-item'+(isActive?' is-active':'')}
                  style={({isActive})=>({
                    display:'flex', alignItems:'center', gap:10,
                    padding:'8px 10px', margin:'2px 4px', borderRadius:8,
                    textDecoration:'none', color:isActive?'#111':'#374151',
                    background:isActive ? '#eef2ff' : 'transparent'
                  })}
                >
                  <Icon name={iconFor(item.label)} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}

function Breadcrumbs(){
  const loc = useLocation();
  const path = loc.pathname || '/';
  const segs = path.split('/').filter(Boolean);
  const parts = [{ href:'/', label:'Home' }];
  let acc = '';
  segs.forEach((s)=>{ acc += '/'+s; parts.push({ href: acc, label: s.replace(/[-_]/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) }); });
  const text = parts.map(p=>p.label).join(' / ');
  React.useEffect(()=>{
    const slot = document.getElementById('gv-breadcrumb-slot');
    if (slot) slot.textContent = text;
    document.title = text ? `${text} — Gotham Vending` : 'Gotham Vending';
  },[text]);
  return (
    <div style={{padding:'10px 16px', borderBottom:'1px solid #e5e7eb', background:'#fafafa'}}>
      <nav aria-label="Breadcrumb" style={{display:'flex', gap:6, flexWrap:'wrap'}}>
        {parts.map((p,i)=>(
          <span key={p.href} style={{display:'inline-flex', alignItems:'center', gap:6}}>
            {i>0 && <span style={{color:'#94a3b8'}}>›</span>}
            {i < parts.length-1
              ? <Link to={p.href} style={{textDecoration:'none', color:'#2563eb'}}>{p.label}</Link>
              : <span style={{fontWeight:700}}>{p.label}</span>}
          </span>
        ))}
      </nav>
      <div id="gv-breadcrumb-slot" style={{position:'absolute', left:-9999, width:1, height:1}} aria-hidden />
    </div>
  );
}

/* =========================================================
   APP
========================================================= */
function AppLayout({children}:{children:React.ReactNode}) {
  return (
    <div className="gv-app" style={shellStyles}>
      <Sidebar />
      <div style={{display:'grid', gridTemplateRows:'auto auto 1fr'}}>
        <header style={headerStyles}><div style={{fontWeight:800}}>Gotham Vending</div><div/></header>
        <Breadcrumbs />
        <main className="gv-page" id="gv-page" style={{padding:16}}>{children}</main>
      </div>
    </div>
  );
}

export default function App(){
  return (
    <HashRouter>
      <AppLayout>
        <Routes>
          {/* default → Sales so you immediately see data */}
          <Route index element={<Navigate to="/sales" replace />} />
          {/* real pages with data */}
          <Route path="/sales"               element={<SalesPage />} />
          <Route path="/reports/products"    element={<ProductPerformancePage />} />
          <Route path="/reports/machines"    element={<MachinesReportPage />} />
          <Route path="/reports/locations"   element={<LocationPerformancePage />} />
          {/* the rest are scaffolds so nav works */}
          <Route path="/leads"              element={<ScaffoldPage title="Leads" />} />
          <Route path="/installs"           element={<ScaffoldPage title="Installs" />} />
          <Route path="/dashboard"          element={<ScaffoldPage title="Dashboard" />} />
          <Route path="/locations"          element={<ScaffoldPage title="Locations" />} />
          <Route path="/machines"           element={<ScaffoldPage title="Machines" />} />
          <Route path="/products"           element={<ScaffoldPage title="Products" />} />
          <Route path="/inventory"          element={<ScaffoldPage title="Inventory" />} />
          <Route path="/purchase-orders"    element={<ScaffoldPage title="Purchase Orders" />} />
          <Route path="/service"            element={<ScaffoldPage title="Service" />} />
          <Route path="/reports/trends"     element={<TrendsPage />} />
          <Route path="/reports/stockouts"  element={<StockoutsPage />} />
          <Route path="/exports"            element={<ScaffoldPage title="Exports" />} />
          <Route path="/admin/users"        element={<ScaffoldPage title="Users & Roles" />} />
          <Route path="/admin/settings"     element={<ScaffoldPage title="Org Settings" />} />
          <Route path="/admin/billing"      element={<ScaffoldPage title="Billing" />} />
          <Route path="/help"               element={<ScaffoldPage title="Help Center" />} />
          <Route path="/help/glossary"      element={<ScaffoldPage title="Glossary" />} />
          <Route path="/changelog"          element={<ScaffoldPage title="Changelog" />} />
          <Route path="*"                   element={<ScaffoldPage title="Not Found" />} />
        </Routes>
      </AppLayout>
    </HashRouter>
  );
}