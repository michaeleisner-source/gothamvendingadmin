import { useEffect, useMemo, useRef, useState } from 'react';

type RouteCheck = { path: string; status: 'OK'|'TIMEOUT'|'NAV_ERROR'; ms: number; breadcrumb: string; hasTable: boolean; hasCard: boolean; };

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

const norm = (p:string) => (p || '/').replace(/\/+$/,'') || '/';
const sleep = (ms:number) => new Promise(r => setTimeout(r, ms));

async function checkRoutes(expected: string[]): Promise<RouteCheck[]> {
  const mainSel = '.gv-page';
  const crumbSel = '#gv-breadcrumb-slot';
  const startPath = norm(location.pathname);
  const out: RouteCheck[] = [];

  async function goto(path: string): Promise<RouteCheck> {
    const target = norm(path);
    const main = document.querySelector(mainSel) as HTMLElement | null;
    const crumb = document.querySelector(crumbSel) as HTMLElement | null;
    const prevMainHTML = main ? main.innerHTML : '';
    const prevCrumbText = crumb ? (crumb.textContent || '') : '';

    let status: RouteCheck['status'] = 'TIMEOUT';
    const started = performance.now();
    const obs = main ? new MutationObserver(() => {
      const contentChanged = main!.innerHTML !== prevMainHTML;
      const crumbChanged = (document.querySelector(crumbSel)?.textContent || '') !== prevCrumbText;
      if (contentChanged || crumbChanged) finish('OK');
    }) : null;

    function finish(s: RouteCheck['status']) { status = s; obs?.disconnect(); }
    if (obs && main) obs.observe(main, { childList: true, subtree: true });

    try {
      // Works under HashRouter too
      history.pushState({}, '', target);
      dispatchEvent(new PopStateEvent('popstate'));
    } catch { finish('NAV_ERROR'); }

    const deadline = Date.now() + 5000;
    while (status === 'TIMEOUT' && Date.now() < deadline) {
      await sleep(120);
      const contentChanged = main && main.innerHTML !== prevMainHTML;
      const crumbChanged = (document.querySelector(crumbSel)?.textContent || '') !== prevCrumbText;
      if (contentChanged || crumbChanged) finish('OK');
    }
    if (status === 'TIMEOUT') finish('TIMEOUT');

    const hasTable = !!document.querySelector('.gv-table');
    const hasCard  = !!document.querySelector('.card');
    const breadcrumb = (document.querySelector(crumbSel)?.textContent || '')!.trim();
    const ms = Math.round(performance.now() - started);

    return { path: target, status, ms, breadcrumb, hasTable, hasCard };
  }

  for (const p of expected) out.push(await goto(p));
  await goto(startPath);
  return out;
}

function getSidebarPaths(): string[] {
  const links = Array.from(document.querySelectorAll('.gv-nav .gv-nav-item'));
  const hrefs = links.map(a => (a as HTMLAnchorElement).getAttribute('href')).filter(Boolean) as string[];
  return Array.from(new Set(hrefs.map(norm)));
}

export default function QAOverview() {
  const [open, setOpen] = useState(true); // Auto-open on this page
  const [busy, setBusy] = useState(false);
  const [routes, setRoutes] = useState<RouteCheck[]>([]);
  const drag = useRef<{x:number;y:number;dx:number;dy:number}|null>(null);

  // Auto-open if ?qa=1 or local flag
  useEffect(() => {
    const qp = new URLSearchParams(location.search);
    if (qp.get('qa') === '1' || localStorage.getItem('gv:qa') === '1') setOpen(true);
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'q') {
        setOpen(v => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const summary = useMemo(() => {
    const broken = routes.filter(r => r.status !== 'OK' || (!r.hasTable && !r.hasCard));
    const sidebar = getSidebarPaths();
    const missingLinks = EXPECTED.filter(p => !sidebar.includes(p));
    return { broken, missingLinks, sidebar };
  }, [routes]);

  async function runAudit() {
    setBusy(true);
    try {
      const res = await checkRoutes(EXPECTED);
      setRoutes(res);
      (window as any).__qaOverlay = { when: new Date().toISOString(), res };
    } finally { setBusy(false); }
  }

  if (!open) {
    return (
      <button
        aria-label="Open QA"
        onClick={() => setOpen(true)}
        style={{
          position:'fixed', right:12, bottom:12, zIndex: 999999,
          padding:'10px 12px', borderRadius:10, border:'1px solid var(--border)',
          background:'#fff', boxShadow:'0 6px 18px rgba(0,0,0,.12)', cursor:'pointer'
        }}
      >QA</button>
    );
  }

  return (
    <div
      role="dialog" aria-label="QA Overlay"
      style={{
        position:'fixed', right:12, bottom:12, width: 520, maxWidth:'95vw', maxHeight:'80vh',
        zIndex: 999999, background:'#fff', border:'1px solid var(--border)', borderRadius:12,
        boxShadow:'0 10px 28px rgba(0,0,0,.18)', display:'flex', flexDirection:'column', overflow:'hidden'
      }}
      onMouseDown={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        if ((e.target as HTMLElement).dataset.drag !== '1') return;
        const r = el.getBoundingClientRect();
        drag.current = { x: r.left, y: r.top, dx: e.clientX - r.left, dy: e.clientY - r.top };
        const move = (ev:MouseEvent) => {
          if (!drag.current) return;
          const nx = Math.max(8, Math.min(window.innerWidth - r.width - 8, ev.clientX - drag.current.dx));
          const ny = Math.max(8, Math.min(window.innerHeight - 40, ev.clientY - drag.current.dy));
          el.style.left = nx + 'px'; el.style.top = ny + 'px';
          el.style.right = 'auto'; el.style.bottom = 'auto'; el.style.position = 'fixed';
        };
        const up = () => { drag.current = null; window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
        window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
      }}
    >
      <div data-drag="1" style={{padding:'10px 12px', fontWeight:800, background:'#fafafa', borderBottom:'1px solid var(--border)', cursor:'move'}}>
        QA Overview
        <button onClick={() => setOpen(false)} style={{float:'right', border:'none', background:'transparent', cursor:'pointer'}}>✕</button>
      </div>

      <div style={{padding:12, display:'flex', gap:8, flexWrap:'wrap', borderBottom:'1px solid var(--border)'}}>
        <button className="btn" onClick={runAudit} disabled={busy}>{busy ? 'Running…' : 'Run Audit'}</button>
        <button className="btn" onClick={()=>{
          const payload = { when:new Date().toISOString(), routes };
          navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
        }}>Copy JSON</button>
        <button className="btn" onClick={()=>{
          localStorage.setItem('gv:qa','1'); alert('QA overlay will auto-open on reload'); location.reload();
        }}>Pin Overlay</button>
        <span style={{color:'var(--muted)'}}>Tip: <kbd>Ctrl/⌘</kbd>+<kbd>Shift</kbd>+<kbd>Q</kbd> toggles</span>
      </div>

      <div style={{padding:12, overflow:'auto'}}>
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
              {(() => {
                const sidebar = getSidebarPaths();
                const missing = EXPECTED.filter(p => !sidebar.includes(p));
                return missing.length ? missing.map(p => <li key={p}>{p}</li>) : <li style={{color:'var(--muted)'}}>None ✅</li>;
              })()}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}