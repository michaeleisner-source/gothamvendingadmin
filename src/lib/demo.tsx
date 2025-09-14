import React, { createContext, useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Demo Context
type DemoCtx = { isDemo: boolean; ready: boolean };
const DemoContext = createContext<DemoCtx>({ isDemo: false, ready: false });
export const useDemo = () => useContext(DemoContext);

// Demo Provider
export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [isDemo, setIsDemo] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const url = new URL(window.location.href);
      const flag = import.meta.env.VITE_PUBLIC_DEMO === 'true' || url.searchParams.get('demo') === '1';
      
      if (!flag) {
        setReady(true);
        return; // normal authenticated app
      }
      
      setIsDemo(true);

      // If we already have a session, done.
      const { data: s1 } = await supabase.auth.getSession();
      if (s1?.session) { 
        setReady(true); 
        return; 
      }

      // Auto sign in demo user (read‑only role). Credentials from env.
      const email = import.meta.env.VITE_DEMO_EMAIL;
      const password = import.meta.env.VITE_DEMO_PASSWORD;
      if (email && password) {
        await supabase.auth.signInWithPassword({ email, password });
      }
      setReady(true);
    })();
  }, []);

  return (
    <DemoContext.Provider value={{ isDemo, ready }}>
      {children}
      <DemoBanner show={isDemo} />
    </DemoContext.Provider>
  );
}

// Protected Route - bypasses login when demo is active
export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isDemo, ready } = useDemo();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const loc = useLocation();

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getSession();
      setAuthed(!!data.session);
      const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => setAuthed(!!session));
      return () => sub.subscription.unsubscribe();
    };
    run();
  }, []);

  if (!ready || authed === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (isDemo) return children; // bypass auth in demo mode
  if (!authed) return <Navigate to={`/auth?next=${encodeURIComponent(loc.pathname)}`} replace />;
  return children;
}

// Demo Banner - visible indicator + read‑only hint
function DemoBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 rounded-full bg-amber-500/10 border border-amber-500/40 px-4 py-1 text-amber-200 text-xs shadow-lg">
      <span className="inline-flex items-center gap-1">
        <Eye className="size-3" /> Demo Mode — read‑only
      </span>
    </div>
  );
}

// Write‑guard helper
export function guardDemoWrite(isDemo: boolean) {
  if (!isDemo) return true;
  alert('Demo mode is read‑only in this preview.');
  return false;
}