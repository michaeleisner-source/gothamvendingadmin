import { ReactNode, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const PUBLIC_PATHS = new Set<string>([
  "/", // Making all routes public
  "/auth",
  "/reset-password",
]);

export default function AuthGate({ children }: { children: ReactNode }) {
  const nav = useNavigate();
  const loc = useLocation();
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      const path = loc.pathname;
      const isPublic = Array.from(PUBLIC_PATHS).some((p) =>
        path === p || path.startsWith(p + "/")
      );

      if (session) {
        setAuthed(true);
        setLoading(false);
        return;
      }

      if (isPublic) {
        setAuthed(false);
        setLoading(false);
        return;
      }

      // Not authed and trying to access a protected route
      setAuthed(false);
      setLoading(false);
      nav("/auth", { replace: true });
    })();

    // keep session in sync (handles sign-in/out from other tabs)
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      const path = loc.pathname;
      const isPublic = Array.from(PUBLIC_PATHS).some((p) =>
        path === p || path.startsWith(p + "/")
      );
      if (session) {
        setAuthed(true);
      } else {
        setAuthed(false);
        if (!isPublic) nav("/auth", { replace: true });
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loc.pathname, nav]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
