import React from 'react';

type S = { hasError: boolean; msg?: string; stack?: string };
export default class RootErrorBoundary extends React.Component<{children: React.ReactNode}, S> {
  state: S = { hasError: false };
  static getDerivedStateFromError(err: any) {
    return { hasError: true, msg: String(err?.message || err), stack: String(err?.stack || '') };
  }
  componentDidCatch(err: any, info: any) {
    // Keep a breadcrumb for debugging
    (window as any).__lastError = { err: String(err), stack: String(err?.stack||''), info };
    console.error('RootErrorBoundary', err, info);
  }
  render() {
    if (!this.state.hasError) return this.props.children as any;
    return (
      <div style={{minHeight:'100vh', padding:24, background:'#fff'}}>
        <div className="card" style={{border:'1px solid #fca5a5', background:'#fff5f5', borderRadius:12, padding:16, maxWidth:900, margin:'24px auto'}}>
          <div style={{fontWeight:800, color:'#b91c1c'}}>Something crashed while rendering</div>
          <div style={{marginTop:8}}>{this.state.msg}</div>
          {this.state.stack && (
            <pre style={{marginTop:12, whiteSpace:'pre-wrap', font: '12px/1.4 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', color:'#7f1d1d'}}>
{this.state.stack}
            </pre>
          )}
        </div>
      </div>
    );
  }
}
