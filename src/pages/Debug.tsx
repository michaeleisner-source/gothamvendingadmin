import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Debug() {
  const [demo, setDemo] = useState<"true" | "false">("false");
  const [session, setSession] = useState<"loading" | "yes" | "no">("loading");
  const [db, setDb] = useState("pending");
  const [router, setRouter] = useState("unknown");

  useEffect(() => {
    // detect hash router
    setRouter(window.location.hash.startsWith("#/") ? "hash" : "browser");

    // detect demo flag (?demo=1 or VITE_PUBLIC_DEMO)
    const url = new URL(window.location.href);
    const envDemo = import.meta.env.VITE_PUBLIC_DEMO === "true";
    const queryDemo = url.searchParams.get("demo") === "1";
    setDemo(envDemo || queryDemo ? "true" : "false");

    // session probe
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ? "yes" : "no");
    });

    // DB probe: try a few common tables, report first that works
    (async () => {
      const candidates = ["locations", "machines", "products"] as const;
      let lastErr: string | null = null;
      for (const table of candidates) {
        const { data, error } = await supabase.from(table as any).select("id").limit(1);
        if (!error) {
          setDb(`ok: ${table} (${data?.length ?? 0} rows)`);
          return;
        }
        lastErr = error.message;
      }
      setDb(`fail: ${lastErr ?? "no accessible tables"}`);
    })();
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui" }}>
      <h2>Debug</h2>
      <div>router: {router}</div>
      <div>demo mode: {demo}</div>
      <div>session: {session}</div>
      <div>db: {db}</div>
      <p style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
        You should be able to refresh this page at <code>#/debug</code> without errors.
      </p>
    </div>
  );
}