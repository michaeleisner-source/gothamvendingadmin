import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

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
  }, [loc.pathname]);

  async function signOut() {
    await supabase.auth.signOut();
    nav("/auth");
  }

  return (
    <header className="w-full border-b bg-background">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <nav className="flex gap-4 text-sm">
          <Link to="/prospects" className="text-foreground hover:text-primary transition-colors hover:underline">
            Prospects
          </Link>
          <Link to="/locations" className="text-foreground hover:text-primary transition-colors hover:underline">
            Locations
          </Link>
          <Link to="/machines" className="text-foreground hover:text-primary transition-colors hover:underline">
            Machines
          </Link>
          <Link to="/products" className="text-foreground hover:text-primary transition-colors hover:underline">
            Products
          </Link>
          <Link to="/suppliers" className="text-foreground hover:text-primary transition-colors hover:underline">
            Suppliers
          </Link>
          <Link to="/purchase-orders/new" className="text-foreground hover:text-primary transition-colors hover:underline">
            New PO
          </Link>
          <Link to="/" className="text-foreground hover:text-primary transition-colors hover:underline">
            Dashboard
          </Link>
          <Link to="/reports" className="text-foreground hover:text-primary transition-colors hover:underline">
            Reports
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          {email ? (
            <>
              <span className="text-sm text-muted-foreground">{email}</span>
              <Button
                onClick={signOut}
                size="sm"
                className="text-sm"
              >
                Sign out
              </Button>
            </>
          ) : (
            <Link to="/auth" className="text-sm text-primary hover:underline">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}