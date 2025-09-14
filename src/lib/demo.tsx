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
      // Enable demo mode by default for this implementation, or with ?demo=1 parameter
      const flag = true || import.meta.env.VITE_PUBLIC_DEMO === 'true' || url.searchParams.get('demo') === '1';
      
      console.log('Demo mode check:', { flag, env: import.meta.env.VITE_PUBLIC_DEMO, param: url.searchParams.get('demo') });
      
      if (!flag) {
        console.log('Demo mode disabled, using normal auth');
        setReady(true);
        return; // normal authenticated app
      }
      
      console.log('Demo mode enabled');
      setIsDemo(true);

      // Since your app is already public, just mark as ready
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
      console.log('ProtectedRoute session check:', { session: !!data.session, isDemo, ready });
      setAuthed(!!data.session);
      const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
        console.log('Auth state changed:', { session: !!session, isDemo });
        setAuthed(!!session);
      });
      return () => sub.subscription.unsubscribe();
    };
    run();
  }, [isDemo]);

  console.log('ProtectedRoute render:', { isDemo, ready, authed, pathname: loc.pathname });

  if (!ready || authed === null) {
    console.log('ProtectedRoute: Loading...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (isDemo) {
    console.log('ProtectedRoute: Demo mode - bypassing auth');
    return children; // bypass auth in demo mode
  }
  
  if (!authed) {
    console.log('ProtectedRoute: Not authenticated - redirecting to auth');
    return <Navigate to={`/auth?next=${encodeURIComponent(loc.pathname)}`} replace />;
  }
  
  console.log('ProtectedRoute: Authenticated - rendering children');
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