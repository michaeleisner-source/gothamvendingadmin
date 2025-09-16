import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type DemoCtx = {
  isDemo: boolean;
  ready: boolean;
  user: any | null;
};

const Ctx = createContext<DemoCtx>({ isDemo: false, ready: false, user: null });

function getDemoFlag() {
  // Env flag wins, but also honor ?demo=1 for quick toggles
  const env = import.meta.env.VITE_PUBLIC_DEMO === "true";
  const url = new URL(window.location.href);
  const q = url.searchParams.get("demo") === "1";
  return env || q;
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
  console.log("DemoProvider: Component mounting");
  
  const [user, setUser] = useState<any | null>(null);
  const [ready, setReady] = useState(true); // Start as ready to allow app to load
  const isDemo = useMemo(() => {
    try {
      return getDemoFlag();
    } catch (error) {
      console.error("Error getting demo flag:", error);
      return false;
    }
  }, []);

  useEffect(() => {
    console.log("DemoProvider: useEffect running, isDemo:", isDemo);
    // Simplified initialization without authentication to test loading
    setReady(true);
  }, [isDemo]);

  const value = useMemo(() => ({ isDemo, ready, user }), [isDemo, ready, user]);
  
  console.log("DemoProvider: Rendering with value:", value);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDemo() {
  return useContext(Ctx);
}

/** Optional: tiny banner so you remember you're in demo mode */
export function DemoBanner() {
  const { isDemo } = useDemo();
  if (!isDemo) return null;
  return (
    <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-50 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs">
      Demo Mode — auth bypass & auto-login active
    </div>
  );
}