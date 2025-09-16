import React from 'react';

type State = { hasError: boolean; message?: string };

export default class ErrorBoundary extends React.Component<{children: React.ReactNode}, State> {
  state: State = { hasError: false };
  
  static getDerivedStateFromError(err: any) { 
    return { hasError: true, message: String(err?.message || err) }; 
  }
  
  componentDidCatch(err: any, info: any) { 
    console.error('ErrorBoundary', err, info); 
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="card" style={{border:'1px solid #fca5a5', background:'#fff5f5', padding:12}}>
          <div style={{fontWeight:700, marginBottom:6}}>Something went wrong</div>
          <div style={{color:'#b91c1c', whiteSpace:'pre-wrap'}}>{this.state.message}</div>
        </div>
      );
    }
    return this.props.children as any;
  }
}