import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useDemo } from "@/lib/demo";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isDemo } = useDemo();
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    let unsub: any;
    (async () => {
      if (isDemo) {
        // In demo, just allow — DemoProvider already auto-signs in behind the scenes
        setAuthed(true);
        setLoading(false);
        return;
      }
      const { data } = await supabase.auth.getSession();
      setAuthed(!!data.session);
      setLoading(false);
      unsub = supabase.auth.onAuthStateChange((_e, sess) => {
        setAuthed(!!sess);
      });
    })();

    return () => {
      if (unsub && unsub.data && unsub.data.subscription) {
        unsub.data.subscription.unsubscribe();
      }
    };
  }, [isDemo]);

  if (loading) return null;
  if (!authed && !isDemo) {
    return <Navigate to="/auth" state={{ from: loc.pathname }} replace />;
  }
  return <>{children}</>;
}