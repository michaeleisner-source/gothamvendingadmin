import { useGlobalDays } from '@/hooks/useGlobalDays';

export default function ExportsPage(){
  const days = useGlobalDays();

  const call = (fnName: string, hint: string) => {
    const fn = (window as any).exportSalesCSV;
    if (typeof fn === 'function') {
      fn(days, { filenameHint: hint });
    } else {
      window.dispatchEvent(new CustomEvent('gv:notify', {
        detail: { kind:'warning', title:'Export helper not found', message:'Load the global export helper or ask to wire a local exporter.' }
      }));
    }
  };

  return (
    <div>
      <div style={{color:'var(--muted)', fontSize:12, marginBottom:12}}>
        Global window: last <b>{days}</b> days
      </div>

      <div className="card" style={{display:'grid', gap:10, padding:16, maxWidth:520}}>
        <button className="btn" onClick={() => call('exportSalesCSV', `sales-last-${days}-days`)}>Export Sales (CSV)</button>
        <button className="btn" onClick={() => call('exportSalesCSV', `machines-last-${days}-days`)}>Export Machine Performance (CSV)</button>
        <button className="btn" onClick={() => call('exportSalesCSV', `products-last-${days}-days`)}>Export Product Performance (CSV)</button>
        <button className="btn" onClick={() => call('exportSalesCSV', `locations-last-${days}-days`)}>Export Location Performance (CSV)</button>
      </div>
    </div>
  );
}