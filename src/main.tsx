import React from 'react';
import ReactDOM from 'react-dom/client';

console.log("Starting minimal app without CSS...");

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>App Loading Test</h1>
      <p>If you can see this, the basic React app is working.</p>
      <p>Current URL: {window.location.href}</p>
    </div>
  </React.StrictMode>,
);