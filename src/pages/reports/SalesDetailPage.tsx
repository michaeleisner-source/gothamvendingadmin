import React from 'react';
import SimpleTable, { Col } from '../../components/ui/SimpleTable';
import { getDemoSales, SaleRow } from '../../lib/demo-data';
import { toCSV, downloadCSV } from '../../lib/csv-utils';

export default function SalesDetailPage() {
  const [days, setDays] = React.useState(30);
  const rows = React.useMemo(() => getDemoSales(days), [days]);

  const totals = React.useMemo(() => {
    const qty = rows.reduce((s, r) => s + r.qty, 0);
    const rev = rows.reduce((s, r) => s + r.revenue, 0);
    return { qty, rev: +rev.toFixed(2) };
  }, [rows]);

  const columns: Col<SaleRow & { priceFmt:string; revFmt:string }>[]= [
    { key: 'date',     label: 'Date', width: 110 },
    { key: 'location', label: 'Location' },
    { key: 'machine',  label: 'Machine', width: 90 },
    { key: 'product',  label: 'Product' },
    { key: 'qty',      label: 'Qty', align: 'right', width: 60 },
    { key: 'priceFmt', label: 'Price', align: 'right', width: 80 },
    { key: 'revFmt',   label: 'Revenue', align: 'right', width: 100 },
  ];

  const view = rows.map(r => ({
    ...r,
    priceFmt: `$${r.price.toFixed(2)}`,
    revFmt: `$${r.revenue.toFixed(2)}`
  }));

  function exportCSV(){
    downloadCSV(`gotham-sales-last-${days}-days`, toCSV(rows));
  }

  // breadcrumb nice title
  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent('gv:breadcrumb:set', { detail: 'Sales Detail' }));
    return () => {
      window.dispatchEvent(new CustomEvent('gv:breadcrumb:set', { detail: null }));
    };
  }, []);

  return (
    <div style={{display:'grid', gap:12}}>
      <div className="card" style={{border:'1px solid #e5e7eb', borderRadius:12, padding:12, display:'flex', alignItems:'center', gap:12}}>
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

      <div className="card" style={{border:'1px solid #e5e7eb', borderRadius:12, padding:12}}>
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