import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './components/AppRoutes';
import './index.css';

function Root() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

const root = document.getElementById('root') || (() => {
  const el = document.createElement('div'); el.id = 'root'; document.body.appendChild(el); return el;
})();
ReactDOM.createRoot(root).render(<Root />);
