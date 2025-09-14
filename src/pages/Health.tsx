import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Health() {
  const [router, setRouter] = useState("unknown");
  const [demo, setDemo] = useState<"true" | "false">("false");
  const [session, setSession] = useState<"loading" | "yes" | "no">("loading");
  const [db, setDb] = useState("pending");

  useEffect(() => {
    setRouter(window.location.hash.startsWith("#/") ? "hash" : "browser");

    const envDemo = import.meta.env.VITE_PUBLIC_DEMO === "true";
    const queryDemo = new URL(window.location.href).searchParams.get("demo") === "1";
    setDemo(envDemo || queryDemo ? "true" : "false");

    supabase.auth.getSession().then(({ data }) => setSession(data.session ? "yes" : "no"));

    (async () => {
      const { data, error } = await supabase.from("locations").select("id").limit(1);
      setDb(error ? `fail: ${error.message}` : `ok: locations (${data?.length ?? 0} rows)`);
    })();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-2">Health Check</h1>
      <ul className="text-sm space-y-1">
        <li>router: <b>{router}</b></li>
        <li>demo mode: <b>{demo}</b></li>
        <li>session: <b>{session}</b></li>
        <li>db: <b>{db}</b></li>
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        You should be able to refresh this page (hash routing) without errors.
      </p>
    </div>
  );
}