import React from 'react';
type State = { hasError: boolean; msg?: string };
export default class ErrorBoundary extends React.Component<{children:React.ReactNode}, State> {
  state: State = { hasError:false };
  static getDerivedStateFromError(err:any){ return { hasError:true, msg:String(err?.message||err) }; }
  componentDidCatch(err:any, info:any){ console.error('ErrorBoundary', err, info); }
  render(){ return this.state.hasError
    ? <div className="card" style={{border:'1px solid #fca5a5', background:'#fff5f5', padding:12}}>
        <b>Render error</b><div style={{color:'#b91c1c'}}>{this.state.msg}</div>
      </div>
    : this.props.children as any; }
}