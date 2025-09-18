import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Minimal test component
function MinimalApp() {
  return (
    <div style={{
      padding: '50px',
      fontSize: '24px',
      backgroundColor: 'red',
      color: 'white',
      textAlign: 'center'
    }}>
      <h1>MINIMAL TEST - IF YOU SEE THIS, REACT WORKS!</h1>
      <p>Route: {window.location.pathname}</p>
      <button onClick={() => window.location.href = '/'}>
        Go to Home
      </button>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MinimalApp />
  </React.StrictMode>,
);