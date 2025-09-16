import { useMemo, useState } from 'react';
import { checkRoutes, getSidebarPaths } from '../../lib/qaAudit';

const EXPECTED = [
  '/leads','/installs',
  '/locations','/machines','/products','/inventory','/purchase-orders','/service',
  '/dashboard','/sales',
  '/reports/machines','/reports/products','/reports/locations','/reports/trends','/reports/stockouts',
  '/exports',
  '/admin/users','/admin/settings','/admin/billing',
  '/help','/help/glossary','/changelog',
  '/qa/overview','/qa/smoke','/qa/seed'
];

export default function OverviewSmoke(){
  const [busy, setBusy] = useState(false);
  const [routes, setRoutes] = useState<any[]>([]);
  const summary = useMemo(() => {
    const broken = routes.filter((r:any) => r.status !== 'OK' || (!r.hasTable && !r.hasCard));
    const sidebar = getSidebarPaths();
    const missingLinks = EXPECTED.filter(p => !sidebar.includes(p));
    return { broken, missingLinks, sidebar };
  }, [routes]);

  async function runAudit(){
    setBusy(true);
    try { setRoutes(await checkRoutes(EXPECTED)); }
    finally { setBusy(false); }
  }

  return (
    <div style={{padding:16}}>
      <div className="card" style={{marginBottom:12, display:'flex', gap:12, alignItems:'center', flexWrap:'wrap'}}>
        <div style={{fontWeight:800}}>QA Overview</div>
        <button className="btn" onClick={runAudit} disabled={busy}>{busy ? 'Running…' : 'Run Audit'}</button>
        <button className="btn" onClick={()=>{
          const payload = { when:new Date().toISOString(), routes };
          navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
        }}>Copy Results JSON</button>
      </div>

      <div className="card" style={{marginBottom:12}}>
        <div style={{fontWeight:700, marginBottom:6}}>Routes — Broken / Empty</div>
        {routes.length === 0 ? <div style={{color:'var(--muted)'}}>Click <b>Run Audit</b>.</div> : (
          <table className="gv-table">
            <thead><tr><th>Path</th><th>Status</th><th>ms</th><th>Breadcrumb</th><th>UI</th></tr></thead>
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

      <div className="card">
        <div style={{fontWeight:700, marginBottom:6}}>Missing from Sidebar</div>
        {routes.length === 0 ? <div style={{color:'var(--muted)'}}>Run audit first.</div> : (
          <ul style={{margin:0, paddingLeft:18}}>
            {summary.missingLinks.map(p => <li key={p}>{p}</li>)}
            {summary.missingLinks.length === 0 && <li style={{color:'var(--muted)'}}>None ✅</li>}
          </ul>
        )}
      </div>
    </div>
  );
}