import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

console.log("Starting minimal app...");

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>App Loading Test</h1>
      <p>If you can see this, the basic React app is working.</p>
    </div>
  </React.StrictMode>,
);