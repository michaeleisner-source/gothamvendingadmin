import React from 'react';
import { Eye } from 'lucide-react';
import AuthGate from '@/components/AuthGate';

// Demo Context
type DemoCtx = { isDemo: boolean; ready: boolean };
const DemoContext = React.createContext<DemoCtx>({ isDemo: false, ready: false });
export const useDemo = () => React.useContext(DemoContext);

// Demo Provider
export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [isDemo, setIsDemo] = React.useState(true); // Always demo mode for now
  const [ready, setReady] = React.useState(true); // Always ready

  console.log('DemoProvider: isDemo =', isDemo, 'ready =', ready);

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

  console.log('ProtectedRoute render:', { isDemo, ready });

  if (!ready) {
    console.log('ProtectedRoute: Loading...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Always bypass auth in demo mode (which is always true)
  console.log('ProtectedRoute: Demo mode - bypassing auth');
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