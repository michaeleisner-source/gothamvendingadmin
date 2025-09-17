import React from 'react';
import { HashRouter, Routes, Route, Navigate, NavLink, Link, useLocation } from 'react-router-dom';

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
type SaleRow = { date:string; location:string; machine:string; product:string; qty:number; price:number; revenue:number; };
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

function SalesDetailPage() {
  const [days, setDays] = React.useState(30);
  const rows = React.useMemo(() => getDemoSales(days), [days]);
  const totals = React.useMemo(() => {
    const qty = rows.reduce((s, r) => s + r.qty, 0);
    const rev = rows.reduce((s, r) => s + r.revenue, 0);
    return { qty, rev:+rev.toFixed(2) };
  }, [rows]);

  type ViewRow = SaleRow & { priceFmt:string; revFmt:string };
  const columns: Col<ViewRow>[] = [
    { key:'date',     label:'Date', width:110 },
    { key:'location', label:'Location' },
    { key:'machine',  label:'Machine', width:90 },
    { key:'product',  label:'Product' },
    { key:'qty',      label:'Qty', align:'right', width:60 },
    { key:'priceFmt', label:'Price', align:'right', width:80 },
    { key:'revFmt',   label:'Revenue', align:'right', width:100 },
  ];
  const view: ViewRow[] = rows.map(r => ({ ...r, priceFmt:`$${r.price.toFixed(2)}`, revFmt:`$${r.revenue.toFixed(2)}` }));

  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent('gv:breadcrumb:set', { detail: 'Sales Detail' }));
    return () => {
      window.dispatchEvent(new CustomEvent('gv:breadcrumb:set', { detail: null }));
    };
  }, []);

  function exportCSV(){ downloadCSV(`gotham-sales-last-${days}-days`, toCSV(rows)); }

  return (
    <div style={{display:'grid', gap:12}}>
      <div className="card" style={{...cardStyle, display:'flex', alignItems:'center', gap:12}}>
        <div style={{fontWeight:800}}>Sales Detail</div>
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
        <div style={{display:'flex', gap:16, marginBottom:10, alignItems:'baseline'}}>
          <div><b>Total Rows:</b> {view.length.toLocaleString()}</div>
          <div><b>Total Qty:</b> {totals.qty.toLocaleString()}</div>
          <div><b>Total Revenue:</b> ${totals.rev.toLocaleString()}</div>
        </div>
        <SimpleTable columns={columns as any} rows={view as any} />
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

/* ---------- Machine Performance ---------- */
function MachinePerformancePage() {
  const [days, setDays] = React.useState(30);
  const rows = React.useMemo(()=>getDemoSales(days),[days]);
  const byMachine = React.useMemo(()=>aggregateBy(rows,'machine'),[rows]);
  const totalRev = +rows.reduce((s,r)=>s+r.revenue,0).toFixed(2);
  const maxRev = byMachine[0]?.revenue || 0;

  React.useEffect(()=>{
    window.dispatchEvent(new CustomEvent('gv:breadcrumb:set', { detail: 'Machine Performance' }));
    return () => {
      window.dispatchEvent(new CustomEvent('gv:breadcrumb:set', { detail: null }));
    };
  },[]);

  const machineToLocs = new Map<string, Set<string>>();
  for (const r of rows) {
    if (!machineToLocs.has(r.machine)) machineToLocs.set(r.machine, new Set());
    machineToLocs.get(r.machine)!.add(r.location);
  }

  const view = byMachine.map(r => ({
    machine: r.key,
    tx: r.tx,
    qty: r.qty,
    revenueFmt: `$${r.revenue.toFixed(2)}`,
    locations: machineToLocs.get(r.key)?.size || 1,
    share: pct(r.revenue, totalRev),
    _rev: r.revenue
  }));

  const cols = [
    { key:'machine',   label:'Machine', width:100 },
    { key:'locations', label:'#Locations', align:'right', width:110 },
    { key:'tx',        label:'Tx', align:'right', width:80 },
    { key:'qty',       label:'Qty', align:'right', width:80 },
    { key:'revenueFmt',label:'Revenue', align:'right', width:110 },
    { key:'share',     label:'Share', align:'right', width:90 },
  ] as Col<any>[];

  function exportCSV(){
    const csv = toCSV(byMachine);
    downloadCSV(`gotham-machines-last-${days}-days`, csv);
  }

  return (
    <div style={{display:'grid', gap:12}}>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12}}>
        <KPI label="Days" value={`${days}`} />
        <KPI label="Machines" value={`${byMachine.length}`} />
        <KPI label="Total Tx" value={String(rows.length)} />
        <KPI label="Total Revenue" value={`$${totalRev.toLocaleString()}`} />
      </div>

      <div className="card" style={{...cardStyle, display:'flex', alignItems:'center', gap:12}}>
        <div style={{fontWeight:800}}>Machine Performance</div>
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
          {byMachine.slice(0,5).map((r)=>(
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
          <Route path="/sales"               element={<SalesDetailPage />} />
          <Route path="/reports/products"    element={<ProductPerformancePage />} />
          <Route path="/reports/machines"    element={<MachinePerformancePage />} />
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
          <Route path="/reports/trends"     element={<ScaffoldPage title="Trends" />} />
          <Route path="/reports/stockouts"  element={<ScaffoldPage title="Inventory & Stock-outs" />} />
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