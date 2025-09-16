import { useMemo, useState } from 'react';
import { checkRoutes, getSidebarPaths, probeEdgeFunctions } from '@/lib/qaAudit';
import { windowFromDays } from '@/lib/dateWindow';
import { isDemoMode, getAuthHeaders } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
    const broken = routes.filter(r => r.status !== 'OK' || (!r.hasTable && !r.hasCard));
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
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-2xl font-bold">QA Overview</h1>
            <span className="text-muted-foreground">Demo mode: <b>{demo ? 'ON' : 'OFF'}</b></span>
            <div className="flex items-center gap-2">
              <label htmlFor="days-input" className="text-sm font-medium">Range (days):</label>
              <Input
                id="days-input"
                type="number"
                min={1}
                max={365}
                value={days}
                onChange={e=>setDays(Math.max(1, Math.min(365, Number(e.target.value)||30)))}
                className="w-20"
              />
            </div>
            <Button onClick={runAll} disabled={busy}>
              {busy ? 'Running…' : 'Run Audit'}
            </Button>
            <Button 
              variant="outline"
              onClick={()=>{
                const payload = (window as any).__qaOverview || { routes, edges };
                const text = JSON.stringify(payload, null, 2);
                navigator.clipboard.writeText(text);
                window.dispatchEvent(new CustomEvent('gv:notify',{ detail:{ kind:'success', title:'Copied', message:'QA results copied to clipboard'}}));
              }}
            >
              Copy Results JSON
            </Button>
            <Button variant="outline" onClick={()=>{
              localStorage.setItem('gv:demo','1'); location.reload();
            }}>
              Enable Demo
            </Button>
            <Button variant="outline" onClick={()=>{
              localStorage.removeItem('gv:demo'); location.reload();
            }}>
              Disable Demo
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Routes — Broken / Empty</CardTitle>
        </CardHeader>
        <CardContent>
          {routes.length === 0 ? (
            <div className="text-muted-foreground">No results yet — click <b>Run Audit</b>.</div>
          ) : (
            <table className="gv-table">
              <thead>
                <tr><th>Path</th><th>Status</th><th>ms</th><th>Breadcrumb</th><th>UI</th></tr>
              </thead>
              <tbody>
                {summary.broken.map(r => (
                  <tr key={r.path}>
                    <td>{r.path}</td><td>{r.status}</td><td>{r.ms}</td>
                    <td>{r.breadcrumb || '—'}</td>
                    <td>{r.hasTable ? 'table' : r.hasCard ? 'card' : 'none'}</td>
                  </tr>
                ))}
                {summary.broken.length === 0 && (
                  <tr><td colSpan={5} className="text-muted-foreground text-center p-4">All routes OK 🎉</td></tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Missing from Sidebar</CardTitle>
        </CardHeader>
        <CardContent>
          {routes.length === 0 ? (
            <div className="text-muted-foreground">Run audit first.</div>
          ) : (
            <ul className="list-disc pl-6 space-y-1">
              {summary.missingLinks.map(p => <li key={p}>{p}</li>)}
              {summary.missingLinks.length === 0 && <li className="text-muted-foreground">None ✅</li>}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Edge Functions — Probe</CardTitle>
        </CardHeader>
        <CardContent>
          {edges.length === 0 ? (
            <div className="text-muted-foreground">Run audit to test functions.</div>
          ) : (
            <table className="gv-table">
              <thead>
                <tr><th>Function</th><th>OK</th><th>Error</th><th>Sample</th></tr>
              </thead>
              <tbody>
                {edges.map(e => (
                  <tr key={e.fn}>
                    <td>{e.fn}</td>
                    <td>{e.ok ? '✅' : '❌'}</td>
                    <td className={e.ok ? 'text-muted-foreground' : 'text-destructive'}>{e.error || '—'}</td>
                    <td><pre className="text-xs whitespace-pre-wrap">{e.sample ? JSON.stringify(e.sample).slice(0,200) : '—'}</pre></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}