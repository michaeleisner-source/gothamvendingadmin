import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { installKillBanners } from './boot/killBanners';
import { installDemoScaffold } from './boot/demoScaffold';

console.log("Main.tsx starting...");
installKillBanners();
installDemoScaffold();
console.log("About to render React app...");

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);