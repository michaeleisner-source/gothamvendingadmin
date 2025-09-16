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
  const [user, setUser] = useState<any | null>(null);
  const [ready, setReady] = useState(false);
  const isDemo = useMemo(() => getDemoFlag(), []);

  useEffect(() => {
    let unsub: any;
    (async () => {
      // Track auth changes
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      unsub = supabase.auth.onAuthStateChange((_e, sess) => {
        setUser(sess?.user ?? null);
      });

      if (isDemo) {
        // Auto-sign in as demo user if no session
        if (!data.session) {
          const email = import.meta.env.VITE_DEMO_EMAIL || "demo@example.com";
          const password = import.meta.env.VITE_DEMO_PASSWORD || "supersecret";
          // Try sign-in; if it fails with invalid credentials, you likely need to create the user in Supabase Auth.
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) {
            // OPTIONAL fallback: try signUp if your project allows it without email confirmation
            // const { error: upErr } = await supabase.auth.signUp({ email, password });
            // if (upErr) console.warn("Demo signUp failed:", upErr.message);
            console.warn("Demo sign-in failed:", error.message);
          }
        }
      }

      setReady(true);
    })();

    return () => {
      if (unsub && unsub.data && unsub.data.subscription) {
        unsub.data.subscription.unsubscribe();
      }
    };
  }, [isDemo]);

  const value = useMemo(() => ({ isDemo, ready, user }), [isDemo, ready, user]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDemo() {
  return useContext(Ctx);
}

// Protected Route - compatible with existing App.tsx usage
export function ProtectedRoute({ children }: { children: JSX.Element }) {
  // Always return children without authentication check for demo mode
  return children;
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