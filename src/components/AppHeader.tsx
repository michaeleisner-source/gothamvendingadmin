import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function AppHeader() {
  const [email, setEmail] = useState<string | null>(null);
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setEmail(session?.user?.email ?? null);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    nav("/auth");
  }

  return (
    <header className="w-full border-b bg-background">
      <div className="max-w-6xl mx-auto px-4">
        {/* Top row */}
        <div className="h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="font-semibold">
              Gotham Vending
            </Link>
            <OrgSwitcher />
          </div>

          {/* User segment */}
          <div className="flex items-center gap-3">
            {email ? (
              <>
                <span className="text-sm text-muted-foreground">{email}</span>
                <button
                  onClick={signOut}
                  className="text-sm bg-secondary text-secondary-foreground rounded px-3 py-2"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/auth" className="text-sm text-primary hover:underline">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function OrgSwitcher() {
  // Stub: replace with real org list if/when you build it
  const [open, setOpen] = useState(false);
  const [orgName, setOrgName] = useState<string>("My Organization");

  return (
    <div className="relative">
      <button
        className="text-xs px-2 py-1 rounded border hover:bg-muted"
        onClick={() => setOpen((v) => !v)}
      >
        {orgName} ▾
      </button>
      {open && (
        <div className="absolute z-30 mt-2 min-w-[200px] rounded-lg border bg-background shadow-lg">
          <ul className="py-2 text-sm">
            <li>
              <button className="w-full text-left px-3 py-2 hover:bg-muted/50" onClick={() => setOpen(false)}>
                (future) Switch organization…
              </button>
            </li>
            <li>
              <Link to="/account" className="block px-3 py-2 hover:bg-muted/50" onClick={() => setOpen(false)}>
                Account & Org Settings
              </Link>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}