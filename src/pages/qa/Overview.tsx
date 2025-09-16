import { useMemo, useState } from 'react';
import { checkRoutes, getSidebarPaths, probeEdgeFunctions } from '../../lib/qaAudit';
import { windowFromDays } from '../../lib/dateWindow';
import { isDemoMode, getAuthHeaders } from '../../lib/auth';

const EXPECTED = [
  '/leads','/installs',
  '/locations','/machines','/products','/inventory','/purchase-orders','/service',
  '/dashboard','/sales',
  '/reports/machines','/reports/products','/reports/locations','/reports/trends','/reports/stockouts',
  '/exports',
  '/admin/users','/admin/settings','/admin/billing',
  '/help','/help/glossary','/changelog',
  '/qa/smoke','/qa/seed'
];

const EDGE_FNS = [
  'auth-whoami','org-current','reports-sales-summary',
  'reports-machines','reports-products','reports-locations',
  'reports-trends','reports-stockouts','reports-sales-detail'
];

export default function QAOverview(){
  const [busy, setBusy] = useState(false);
  const [routes, setRoutes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [days, setDays] = useState(30);
  const demo = isDemoMode();

  const summary = useMemo(() => {
    const broken = routes.filter((r:any) => r.status !== 'OK' || (!r.hasTable && !r.hasCard));
    const sidebar = getSidebarPaths();
    const missingLinks = EXPECTED.filter(p => !sidebar.includes(p));
    return { broken, missingLinks, sidebar };
  }, [routes]);

  async function runAll() {
    setBusy(true);
    try {
      const { startISO, endISO } = windowFromDays(days);
      const headers = await getAuthHeaders();
      const routeResults = await checkRoutes(EXPECTED);
      setRoutes(routeResults);
      const edgeResults = await probeEdgeFunctions(EDGE_FNS, { startISO, endISO, days }, headers);
      setEdges(edgeResults);
      (window as any).__qaOverview = { when: new Date().toISOString(), routeResults, edgeResults };
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="card" style={{marginBottom:12, display:'flex', gap:12, alignItems:'center', flexWrap:'wrap'}}>
        <div style={{fontWeight:800}}>QA Overview</div>
        <span style={{color:'var(--muted)'}}>Demo mode: <b>{demo ? 'ON' : 'OFF'}</b></span>
        <label style={{display:'inline-flex', alignItems:'center', gap:6}}>
          Range (days)
          <input className="gv-input" type="number" min={1} max={365} value={days}
                 onChange={e=>setDays(Math.max(1, Math.min(365, Number(e.target.value)||30)))} style={{width:80}} />
        </label>
        <button className="btn" onClick={runAll} disabled={busy}>{busy ? 'Running…' : 'Run Audit'}</button>
        <button className="btn" onClick={()=>{
          const payload = (window as any).__qaOverview || { routes, edges };
          const text = JSON.stringify(payload, null, 2);
          navigator.clipboard.writeText(text);
          window.dispatchEvent(new CustomEvent('gv:notify',{ detail:{ kind:'success', title:'Copied', message:'QA results copied'}}));
        }}>Copy Results JSON</button>
      </div>

      <div className="card" style={{marginBottom:12}}>
        <div style={{fontWeight:700, marginBottom:6}}>Routes — Broken / Empty</div>
        {routes.length === 0 ? <div style={{color:'var(--muted)'}}>Click <b>Run Audit</b> to begin.</div> : (
          <table className="gv-table">
            <thead>
              <tr><th>Path</th><th>Status</th><th>ms</th><th>Breadcrumb</th><th>UI</th></tr>
            </thead>
            <tbody>
              {summary.broken.map((r:any) => (
                <tr key={r.path}>
                  <td>{r.path}</td><td>{r.status}</td><td>{r.ms}</td>
                  <td>{r.breadcrumb || '—'}</td>
                  <td>{r.hasTable ? 'table' : r.hasCard ? 'card' : 'none'}</td>
                </tr>
              ))}
              {summary.broken.length === 0 && (
                <tr><td colSpan={5} style={{color:'var(--muted)', padding:'12px'}}>All routes OK 🎉</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{marginBottom:12}}>
        <div style={{fontWeight:700, marginBottom:6}}>Missing from Sidebar</div>
        {routes.length === 0 ? <div style={{color:'var(--muted)'}}>Run audit first.</div> : (
          <ul style={{margin:0, paddingLeft:18}}>
            {summary.missingLinks.map(p => <li key={p}>{p}</li>)}
            {summary.missingLinks.length === 0 && <li style={{color:'var(--muted)'}}>None ✅</li>}
          </ul>
        )}
      </div>

      <div className="card">
        <div style={{fontWeight:700, marginBottom:6}}>Edge Functions — Probe</div>
        {edges.length === 0 ? <div style={{color:'var(--muted)'}}>Run audit to test functions.</div> : (
          <table className="gv-table">
            <thead>
              <tr><th>Function</th><th>OK</th><th>Error</th><th>Sample</th></tr>
            </thead>
            <tbody>
              {edges.map((e:any) => (
                <tr key={e.fn}>
                  <td>{e.fn}</td>
                  <td>{e.ok ? '✅' : '❌'}</td>
                  <td style={{color:e.ok ? 'var(--muted)' : 'crimson'}}>{e.error || '—'}</td>
                  <td><pre style={{margin:0, whiteSpace:'pre-wrap'}}>{e.sample ? JSON.stringify(e.sample).slice(0,200) : '—'}</pre></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}