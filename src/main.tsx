import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import AppRoutes from './AppRoutes';

function RootErrorBoundary({ children }: { children: React.ReactNode }) {
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

function Root() {
  return (
    <RootErrorBoundary>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </RootErrorBoundary>
  );
}

function mount() {
  let el = document.getElementById('root');
  if (!el) { el = document.createElement('div'); el.id = 'root'; document.body.appendChild(el); }
  ReactDOM.createRoot(el).render(<Root />);
}

try { mount(); } catch (e: any) {
  document.body.innerHTML = `
    <div style="padding:24px;font:14px system-ui">
      <div style="padding:16px;border:1px solid #fca5a5;background:#fff5f5;border-radius:12px">
        <b>Critical mount error</b>
        <div style="margin-top:8px">${e?.message || e}</div>
      </div>
    </div>`;
}