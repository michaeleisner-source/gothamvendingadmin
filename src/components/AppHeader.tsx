import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type NavItem = { label: string; to: string; exact?: boolean };
type NavGroup = { label: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    label: "Sales",
    items: [
      { label: "Dashboard", to: "/" },
      { label: "Reports", to: "/reports" },
      { label: "Inventory", to: "/inventory" },
      { label: "Cost Analysis", to: "/cost-analysis" },
      { label: "Audit", to: "/audit" },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Prospects", to: "/prospects" },
      { label: "Locations", to: "/locations" },
      { label: "Machines", to: "/machines" },
      { label: "Setup", to: "/setup" },
      { label: "Slots", to: "/slots" },
      { label: "Restock", to: "/restock" },
      { label: "Sales Entry", to: "/sales" },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products", to: "/products" },
      { label: "Suppliers", to: "/suppliers" },
    ],
  },
  {
    label: "Purchasing",
    items: [
      { label: "New PO", to: "/purchase-orders/new" },
      { label: "Purchase Orders", to: "/purchase-orders" },
    ],
  },
];

// Quick-create actions
const QUICK_CREATE: NavItem[] = [
  { label: "New Prospect", to: "/prospects?new=1" },
  { label: "New Location", to: "/locations?new=1" },
  { label: "New Machine", to: "/machines/new" },
  { label: "New Product", to: "/products?new=1" },
  { label: "New Supplier", to: "/suppliers?new=1" },
  { label: "New Purchase Order", to: "/purchase-orders/new" },
];

export default function AppHeader() {
  const [email, setEmail] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [groupsOpen, setGroupsOpen] = useState<Record<string, boolean>>({});
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

  // close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setCreateOpen(false);
    setGroupsOpen({});
  }, [loc.pathname]);

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
            <button
              className="sm:hidden inline-flex items-center justify-center h-9 w-9 rounded-md border"
              aria-label="Toggle menu"
              onClick={() => setMobileOpen((v) => !v)}
            >
              ☰
            </button>
            <Link to="/" className="font-semibold">
              Gotham Vending
            </Link>
            <OrgSwitcher />
          </div>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-4">
            {NAV.map((g) => (
              <div key={g.label} className="relative">
                <button
                  className="px-2 py-1 rounded hover:bg-muted text-sm"
                  onClick={() =>
                    setGroupsOpen((prev) => ({ ...prev, [g.label]: !prev[g.label] }))
                  }
                  onMouseEnter={() =>
                    setGroupsOpen((prev) => ({ ...prev, [g.label]: true }))
                  }
                  onMouseLeave={() =>
                    setGroupsOpen((prev) => ({ ...prev, [g.label]: false }))
                  }
                >
                  {g.label} ▾
                </button>
                {/* Dropdown */}
                {groupsOpen[g.label] && (
                  <div
                    className="absolute z-30 mt-2 min-w-[180px] rounded-lg border bg-background shadow-lg"
                    onMouseEnter={() =>
                      setGroupsOpen((prev) => ({ ...prev, [g.label]: true }))
                    }
                    onMouseLeave={() =>
                      setGroupsOpen((prev) => ({ ...prev, [g.label]: false }))
                    }
                  >
                    <ul className="py-2">
                      {g.items.map((it) => (
                        <li key={it.to}>
                          <NavLink
                            to={it.to}
                            className={({ isActive }) =>
                              `block px-3 py-2 text-sm ${
                                isActive ? "bg-muted font-medium" : "hover:bg-muted/50"
                              }`
                            }
                          >
                            {it.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}

            {/* Create menu */}
            <div className="relative">
              <button
                onClick={() => setCreateOpen((v) => !v)}
                className="text-sm bg-primary text-primary-foreground rounded px-3 py-2"
              >
                Create
              </button>
              {createOpen && (
                <div className="absolute right-0 z-30 mt-2 min-w-[220px] rounded-lg border bg-background shadow-lg">
                  <ul className="py-2">
                    {QUICK_CREATE.map((c) => (
                      <li key={c.to}>
                        <NavLink
                          to={c.to}
                          className="block px-3 py-2 text-sm hover:bg-muted/50"
                        >
                          {c.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </nav>

          {/* User segment */}
          <div className="flex items-center gap-3">
            {email ? (
              <>
                <span className="hidden sm:inline text-sm text-muted-foreground">{email}</span>
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

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="sm:hidden pb-3">
            <div className="grid gap-1">
              {NAV.map((g) => (
                <div key={g.label} className="border rounded-lg overflow-hidden">
                  <button
                    className="w-full text-left px-3 py-2 text-sm bg-muted font-medium"
                    onClick={() =>
                      setGroupsOpen((prev) => ({ ...prev, [g.label]: !prev[g.label] }))
                    }
                  >
                    {g.label}
                  </button>
                  {groupsOpen[g.label] && (
                    <ul className="py-1">
                      {g.items.map((it) => (
                        <li key={it.to}>
                          <NavLink
                            to={it.to}
                            className={({ isActive }) =>
                              `block px-3 py-2 text-sm ${
                                isActive ? "bg-muted font-medium" : ""
                              }`
                            }
                          >
                            {it.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}

              <div className="border rounded-lg overflow-hidden">
                <button
                  className="w-full text-left px-3 py-2 text-sm bg-muted font-medium"
                  onClick={() => setCreateOpen((v) => !v)}
                >
                  Create
                </button>
                {createOpen && (
                  <ul className="py-1">
                    {QUICK_CREATE.map((c) => (
                      <li key={c.to}>
                        <NavLink to={c.to} className="block px-3 py-2 text-sm">
                          {c.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
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