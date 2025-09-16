import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
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
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}

const root = document.getElementById('root') || (() => {
  const el = document.createElement('div'); el.id = 'root'; document.body.appendChild(el); return el;
})();
ReactDOM.createRoot(root).render(<Root />);
