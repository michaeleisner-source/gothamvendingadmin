import { useMemo, useState } from 'react';
import { checkRoutes, getSidebarPaths } from '../../lib/qaAudit';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';

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

export default function QAOverview(){
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

  console.log('QA Overview rendering...', { busy, routesCount: routes.length });

  return (
    <div className="p-6 space-y-6">
      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">QA Overview</h1>
          <Button onClick={runAudit} disabled={busy}>
            {busy ? 'Running…' : 'Run Audit'}
          </Button>
          <Button 
            variant="outline"
            onClick={()=>{
              const payload = { when:new Date().toISOString(), routes };
              navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
            }}
          >
            Copy Results JSON
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Routes — Broken / Empty</h2>
        {routes.length === 0 ? (
          <p className="text-muted-foreground">Click <strong>Run Audit</strong> to begin.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Path</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>ms</TableHead>
                <TableHead>Breadcrumb</TableHead>
                <TableHead>UI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.broken.map((r:any) => (
                <TableRow key={r.path}>
                  <TableCell>{r.path}</TableCell>
                  <TableCell>{r.status}</TableCell>
                  <TableCell>{r.ms}</TableCell>
                  <TableCell>{r.breadcrumb || '—'}</TableCell>
                  <TableCell>{r.hasTable ? 'table' : r.hasCard ? 'card' : 'none'}</TableCell>
                </TableRow>
              ))}
              {summary.broken.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                    All routes OK 🎉
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Missing from Sidebar</h2>
        {routes.length === 0 ? (
          <p className="text-muted-foreground">Run audit first.</p>
        ) : (
          <ul className="list-disc list-inside space-y-1">
            {summary.missingLinks.map(p => <li key={p} className="text-sm">{p}</li>)}
            {summary.missingLinks.length === 0 && (
              <li className="text-muted-foreground text-sm">None ✅</li>
            )}
          </ul>
        )}
      </Card>
    </div>
  );
}