import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import AppRoutes from './components/AppRoutes';
import './styles/theme.css';

function Root() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}

const root = document.getElementById('root') || (() => {
  const el = document.createElement('div'); el.id = 'root'; document.body.appendChild(el); return el;
})();
ReactDOM.createRoot(root).render(<Root />);
