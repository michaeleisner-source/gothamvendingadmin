import { useEffect, useState } from 'react';
import { useGlobalDays } from '@/hooks/useGlobalDays';
import { invokeReport } from '@/lib/reportsApi';

type KPIs = { revenue:number; cogs:number; profit:number; orders:number; units:number; margin:number };

export default function DashboardPage() {
  const days = useGlobalDays();
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true); setErr(null);
      try {
        const { data, error } = await invokeReport('reports-sales-summary', { days });
        if (error) throw new Error(error.message || 'Failed to load KPIs');
        if (!cancel) {
          const revenue = Number(data.revenue||0), cogs = Number(data.cogs||0);
          const profit = revenue - cogs; 
          const margin = revenue ? profit/revenue : 0;
          setKpis({ 
            revenue, 
            cogs, 
            profit, 
            orders: Number(data.orders||0), 
            units: Number(data.units||0), 
            margin 
          });
        }
      } catch(e:any){ 
        if(!cancel) setErr(e?.message||'Failed to load KPIs'); 
      } finally { 
        if(!cancel) setLoading(false); 
      }
    })();
    return () => { cancel = true; };
  }, [days]);

  const Card = ({label, value}:{label:string; value:string}) => (
    <div className="card" style={{flex:1, minWidth:180}}>
      <div style={{fontSize:12, color:'var(--muted)'}}>{label}</div>
      <div style={{fontSize:22, fontWeight:800}}>{value}</div>
    </div>
  );

  return (
    <div>
      <div style={{color:'var(--muted)', fontSize:12, marginBottom:8}}>Last <b>{days}</b> days</div>
      {err && <div className="card" style={{borderColor:'var(--danger)'}}>Error: {err}</div>}
      <div style={{display:'grid', gap:12, gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))'}}>
        <Card label="Revenue" value={loading ? '—' : `$${(kpis?.revenue||0).toFixed(2)}`} />
        <Card label="COGS" value={loading ? '—' : `$${(kpis?.cogs||0).toFixed(2)}`} />
        <Card label="Profit" value={loading ? '—' : `$${(kpis?.profit||0).toFixed(2)}`} />
        <Card label="Profit %" value={loading ? '—' : `${((kpis?.margin||0)*100).toFixed(1)}%`} />
        <Card label="Orders" value={loading ? '—' : String(kpis?.orders||0)} />
        <Card label="Units" value={loading ? '—' : String(kpis?.units||0)} />
      </div>
    </div>
  );
}