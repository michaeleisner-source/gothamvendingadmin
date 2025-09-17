import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppRoutes from './AppRoutes';
import RootErrorBoundary from './components/util/RootErrorBoundary';
import './index.css';
import { supabase } from '@/integrations/supabase/client';

// Make Supabase client globally available for QA tools
declare global {
  interface Window {
    supabase: typeof supabase;
  }
}
window.supabase = supabase;

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
    },
  },
});

function Root() {
  return (
    <RootErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </QueryClientProvider>
    </RootErrorBoundary>
  );
}

// Mount (and never fail silently)
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