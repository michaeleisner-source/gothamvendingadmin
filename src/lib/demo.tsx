import React from 'react';
import { Eye } from 'lucide-react';
import AuthGate from '@/components/AuthGate';

// Demo Context
type DemoCtx = { isDemo: boolean; ready: boolean };
const DemoContext = React.createContext<DemoCtx>({ isDemo: false, ready: false });
export const useDemo = () => React.useContext(DemoContext);

// Demo Provider
export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [isDemo, setIsDemo] = React.useState(false);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const url = new URL(window.location.href);
      const flag = url.searchParams.get('demo') === '1';
      
      console.log('DemoProvider: Environment check', {
        queryParam: url.searchParams.get('demo'),
        demoMode: flag
      });
      
      if (!flag) {
        console.log('Demo mode disabled, using normal auth');
        setReady(true);
        return;
      }
      
      console.log('Demo mode enabled');
      setIsDemo(true);
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

// Protected Route - bypasses login (all routes are now public)
export function ProtectedRoute({ children }: { children: JSX.Element }) {
  // Always return children without authentication check
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