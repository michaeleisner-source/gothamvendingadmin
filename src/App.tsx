import React from 'react';
import { HashRouter, Routes, Route, Navigate, NavLink, Link, useLocation } from 'react-router-dom';

/* ---------------- ErrorBoundary ---------------- */
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [err, setErr] = React.useState<null | { msg: string; stack?: string }>(null);
  React.useEffect(() => {
    const onErr = (e: ErrorEvent) => setErr({ msg: String(e.message || e.error || 'Error'), stack: e.error?.stack });
    const onRej = (e: PromiseRejectionEvent) => setErr({ msg: String(e.reason || 'Unhandled promise'), stack: e.reason?.stack });
    window.addEventListener('error', onErr);
    window.addEventListener('unhandledrejection', onRej);
    return () => { window.removeEventListener('error', onErr); window.removeEventListener('unhandledrejection', onRej); };
  }, []);
  if (err) {
    return (
      <div style={{minHeight:'100vh', padding:24, background:'#fff'}}>
        <div className="card" style={{border:'1px solid #fca5a5', background:'#fff5f5', borderRadius:12, padding:16, maxWidth:900, margin:'24px auto'}}>
          <div style={{fontWeight:800, color:'#b91c1c'}}>Render error</div>
          <div style={{marginTop:8}}>{err.msg}</div>
          {err.stack && <pre style={{marginTop:12, whiteSpace:'pre-wrap', font:'12px/1.4 ui-monospace, Menlo, Consolas, monospace', color:'#7f1d1d'}}>{err.stack}</pre>}
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

/* ---------------- Minimal Styles (safe) ---------------- */
const shellStyles: React.CSSProperties = { display:'grid', gridTemplateColumns:'240px 1fr', minHeight:'100vh', background:'#f8fafc' };
const headerStyles: React.CSSProperties = { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', background:'#fff', borderBottom:'1px solid #e5e7eb' };
const cardClass = { background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:16 };

/* ---------------- Navigation Model ---------------- */
const NAV = [
  { title: 'Pipeline', items: [
    { label: 'Leads',    path: '/leads' },
    { label: 'Installs', path: '/installs' },
  ]},
  { title: 'Operations', items: [
    { label: 'Dashboard',       path: '/dashboard' },
    { label: 'Locations',       path: '/locations' },
    { label: 'Machines',        path: '/machines' },
    { label: 'Products',        path: '/products' },
    { label: 'Inventory',       path: '/inventory' },
    { label: 'Purchase Orders', path: '/purchase-orders' },
    { label: 'Service',         path: '/service' },
  ]},
  { title: 'Sales & Reports', items: [
    { label: 'Sales Detail',           path: '/sales' },
    { label: 'Machine Performance',    path: '/reports/machines' },
    { label: 'Product Performance',    path: '/reports/products' },
    { label: 'Location Performance',   path: '/reports/locations' },
    { label: 'Trends',                 path: '/reports/trends' },
    { label: 'Inventory & Stock-outs', path: '/reports/stockouts' },
    { label: 'Exports',                path: '/exports' },
  ]},
  { title: 'Admin', items: [
    { label: 'Users & Roles', path: '/admin/users' },
    { label: 'Org Settings',  path: '/admin/settings' },
    { label: 'Billing',       path: '/admin/billing' },
  ]},
  { title: 'Help', items: [
    { label: 'Help Center', path: '/help' },
    { label: 'Glossary',    path: '/help/glossary' },
    { label: 'Changelog',   path: '/changelog' },
  ]},
] satisfies { title:string; items:{label:string; path:string}[] }[];

/* ---------------- Sidebar ---------------- */
function Sidebar() {
  return (
    <aside className="gv-sidebar" style={{width:240, borderRight:'1px solid #e5e7eb', background:'#fff'}}>
      <nav className="gv-nav" style={{padding:'12px 8px'}}>
        {NAV.map(section => (
          <div key={section.title} style={{marginBottom:14}}>
            <div style={{padding:'6px 10px', fontSize:12, color:'#64748b', textTransform:'uppercase', letterSpacing:.4}}>
              {section.title}
            </div>
            <div>
              {section.items.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({isActive}) => 'gv-nav-item' + (isActive ? ' is-active' : '')}
                  style={({isActive}) => ({
                    display:'flex', alignItems:'center', gap:10,
                    padding:'8px 10px', margin:'2px 4px', borderRadius:8,
                    textDecoration:'none', color:isActive?'#111':'#374151',
                    background:isActive ? '#eef2ff' : 'transparent'
                  })}
                >
                  {/* icons later; keep rock-solid now */}
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

/* ---------------- Breadcrumbs ---------------- */
function Breadcrumbs() {
  const loc = useLocation();
  const path = loc.pathname || '/';
  const segs = path.split('/').filter(Boolean);
  const parts = [{ href: '/', label: 'Home' }];
  let acc = '';
  segs.forEach((s, i) => { acc += '/' + s; parts.push({ href: acc, label: pretty(s) }); });

  const text = parts.map(p => p.label).join(' / ');
  React.useEffect(() => {
    const slot = document.getElementById('gv-breadcrumb-slot');
    if (slot) slot.textContent = text;
    document.title = text ? `${text} — Gotham Vending` : 'Gotham Vending';
  }, [text]);

  return (
    <div style={{padding:'10px 16px', borderBottom:'1px solid #e5e7eb', background:'#fafafa'}}>
      <nav aria-label="Breadcrumb" style={{display:'flex', gap:6, flexWrap:'wrap'}}>
        {parts.map((p, i) => (
          <span key={p.href} style={{display:'inline-flex', alignItems:'center', gap:6}}>
            {i>0 && <span style={{color:'#94a3b8'}}>›</span>}
            {i < parts.length - 1
              ? <Link to={p.href} style={{textDecoration:'none', color:'#2563eb'}}>{p.label}</Link>
              : <span style={{fontWeight:700}}>{p.label}</span>}
          </span>
        ))}
      </nav>
      <div id="gv-breadcrumb-slot" style={{position:'absolute', left:-9999, width:1, height:1}} aria-hidden />
    </div>
  );
}
const pretty = (s:string) => s.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

/* ---------------- Scaffold Page ---------------- */
function ScaffoldPage({ title }: { title: string }) {
  return (
    <div className="card" style={cardClass}>
      <div style={{fontWeight:800}}>{title}</div>
      <div style={{color:'#64748b'}}>Scaffold placeholder — content coming next.</div>
    </div>
  );
}

/* ---------------- Routes ---------------- */
const ROUTES: { path: string; title: string; el?: React.ReactNode }[] = [
  { path: '/leads',              title: 'Leads' },
  { path: '/installs',           title: 'Installs' },
  { path: '/dashboard',          title: 'Dashboard' },
  { path: '/locations',          title: 'Locations' },
  { path: '/machines',           title: 'Machines' },
  { path: '/products',           title: 'Products' },
  { path: '/inventory',          title: 'Inventory' },
  { path: '/purchase-orders',    title: 'Purchase Orders' },
  { path: '/service',            title: 'Service' },
  { path: '/sales',              title: 'Sales Detail' },
  { path: '/reports/machines',   title: 'Machine Performance' },
  { path: '/reports/products',   title: 'Product Performance' },
  { path: '/reports/locations',  title: 'Location Performance' },
  { path: '/reports/trends',     title: 'Trends' },
  { path: '/reports/stockouts',  title: 'Inventory & Stock-outs' },
  { path: '/exports',            title: 'Exports' },
  { path: '/admin/users',        title: 'Users & Roles' },
  { path: '/admin/settings',     title: 'Org Settings' },
  { path: '/admin/billing',      title: 'Billing' },
  { path: '/help',               title: 'Help Center' },
  { path: '/help/glossary',      title: 'Glossary' },
  { path: '/changelog',          title: 'Changelog' },
];

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="gv-app" style={shellStyles}>
      <Sidebar />
      <div style={{display:'grid', gridTemplateRows:'auto auto 1fr'}}>
        <header style={headerStyles}>
          <div style={{fontWeight:800}}>Gotham Vending</div>
          <div />
        </header>
        <Breadcrumbs />
        <main className="gv-page" id="gv-page" style={{padding:16}}>
          {children}
        </main>
      </div>
    </div>
  );
}

/* ---------------- App (HashRouter + Layout + Routes) ---------------- */
export default function App() {
  return (
    <HashRouter>
      <ErrorBoundary>
        <AppLayout>
          <Routes>
            <Route index element={<Navigate to="/leads" replace />} />
            {ROUTES.map(r => (
              <Route key={r.path} path={r.path} element={r.el ?? <ScaffoldPage title={r.title} />} />
            ))}
            <Route path="*" element={<ScaffoldPage title="Not Found" />} />
          </Routes>
        </AppLayout>
      </ErrorBoundary>
    </HashRouter>
  );
}
