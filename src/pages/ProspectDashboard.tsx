import React, { useMemo, useState } from 'react';

type Prospect = {
  id: string;
  name: string;
  type: 'Office'|'Hospital'|'University';
  footTraffic: number; // estimated / day
  estRevenue: number;  // USD / month
  aiScore: number;     // 0-100
  conversion: number;  // %
  city: string;
};

const SAMPLE: Prospect[] = [
  { id:'p1', name:'Manhattan Tech Hub', type:'Office', city:'NYC', footTraffic: 1200, estRevenue: 4200, aiScore: 86, conversion: 22 },
  { id:'p2', name:'Brooklyn Community Hospital', type:'Hospital', city:'Brooklyn', footTraffic: 950, estRevenue: 3800, aiScore: 79, conversion: 19 },
  { id:'p3', name:'Queens University', type:'University', city:'Queens', footTraffic: 2600, estRevenue: 7300, aiScore: 91, conversion: 28 },
];

export default function ProspectDashboard() {
  const [q, setQ] = useState('');
  const [type, setType] = useState<'All'|Prospect['type']>('All');

  const list = useMemo(() => {
    return SAMPLE.filter(p => (type==='All' || p.type===type) && p.name.toLowerCase().includes(q.toLowerCase()));
  }, [q, type]);

  const kpis = useMemo(() => {
    const total = SAMPLE.length;
    const rev   = SAMPLE.reduce((s,p)=>s+p.estRevenue,0);
    const score = Math.round(SAMPLE.reduce((s,p)=>s+p.aiScore,0) / total);
    const conv  = Math.round(SAMPLE.reduce((s,p)=>s+p.conversion,0) / total);
    return { total, rev, score, conv };
  }, []);

  return (
    <div style={{padding:16}}>
      {/* Header + KPIs */}
      <div className="card" style={{marginBottom:12}}>
        <div style={{fontWeight:800, marginBottom:8}}>Smart Prospect Pipeline</div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12}}>
          <KPI title="Total Prospects" value={kpis.total} />
          <KPI title="Monthly Revenue (est.)" value={`$${kpis.rev.toLocaleString()}`} />
          <KPI title="AI Score (avg)" value={kpis.score} />
          <KPI title="Conversion Rate (avg)" value={`${kpis.conv}%`} />
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{display:'flex', gap:12, alignItems:'center', marginBottom:12}}>
        <input className="gv-input" placeholder="Search prospects…" value={q} onChange={e=>setQ(e.target.value)} />
        <select className="gv-input" value={type} onChange={e=>setType(e.target.value as any)}>
          <option>All</option><option>Office</option><option>Hospital</option><option>University</option>
        </select>
      </div>

      {/* Cards list */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:12}}>
        {list.map(p => (
          <div key={p.id} className="card" style={{display:'grid', gap:6}}>
            <div style={{fontWeight:700}}>{p.name}</div>
            <div style={{color:'var(--muted)'}}>{p.city} · {p.type}</div>
            <div style={{display:'flex', gap:12, flexWrap:'wrap', marginTop:6}}>
              <Chip label="Foot Traffic" val={`${p.footTraffic.toLocaleString()}/day`} />
              <Chip label="Est. Revenue" val={`$${p.estRevenue.toLocaleString()}/mo`} />
              <Chip label="AI Score" val={p.aiScore} />
              <Chip label="Conversion" val={`${p.conversion}%`} />
            </div>
            <div style={{marginTop:8, display:'flex', gap:8}}>
              <button className="btn" onClick={()=>alert('Qualify → create lead')}>Qualify</button>
              <button className="btn" onClick={()=>alert('View details')}>Details</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function KPI({ title, value }: { title:string; value:React.ReactNode }) {
  return (
    <div className="card" style={{padding:'10px 12px'}}>
      <div style={{fontSize:12, color:'var(--muted)'}}>{title}</div>
      <div style={{fontWeight:800, fontSize:20}}>{value}</div>
    </div>
  );
}
function Chip({ label, val }: { label:string; val:React.ReactNode }) {
  return (
    <div style={{border:'1px solid var(--border)', borderRadius:8, padding:'4px 8px', display:'inline-flex', gap:6, alignItems:'center'}}>
      <span style={{color:'var(--muted)', fontSize:12}}>{label}</span>
      <b>{val}</b>
    </div>
  );
}