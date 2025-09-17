import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import RootErrorBoundary from './components/util/RootErrorBoundary';

function Root() {
  return (
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  );
}

function mount() {
  let el = document.getElementById('root');
  if (!el) { el = document.createElement('div'); el.id = 'root'; document.body.appendChild(el); }
  ReactDOM.createRoot(el).render(<Root />);
}

try { mount(); } catch (e) {
  console.error('Mount failed:', e);
  document.body.innerHTML = `
    <div style="padding:24px;font:14px system-ui">
      <div style="padding:16px;border:1px solid #fca5a5;background:#fff5f5;border-radius:12px">
        <b>Critical mount error</b>
        <div style="margin-top:8px">${(e as any)?.message || e}</div>
      </div>
    </div>`;
}