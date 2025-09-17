import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

function mount() {
  console.log('Attempting to mount app...');
  let el = document.getElementById('root');
  if (!el) { 
    console.log('Creating root element...');
    el = document.createElement('div'); 
    el.id = 'root'; 
    document.body.appendChild(el); 
  }
  console.log('Root element found/created:', el);
  const root = ReactDOM.createRoot(el);
  console.log('React root created, rendering App...');
  root.render(<App />);
  console.log('App render initiated');
}

try { mount(); } catch (e: any) {
  document.body.innerHTML = `
    <div style="padding:24px;font:14px system-ui">
      <div style="padding:16px;border:1px solid #fca5a5;background:#fff5f5;border-radius:12px">
        <b>Critical mount error</b>
        <div style="margin-top:8">${e?.message || e}</div>
      </div>
    </div>`;
}