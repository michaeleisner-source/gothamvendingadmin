import { useEffect, useState } from "react";

type Probe = "ok" | "missing-env";

export default function Debug() {
  const [demoFlag, setDemoFlag] = useState("false");
  const [envProbe, setEnvProbe] = useState<Probe>("ok");

  useEffect(() => {
    const url = new URL(window.location.href);
    setDemoFlag(url.searchParams.get("demo") === "1" ? "true" : "false");

    const hasUrl = !!import.meta.env.VITE_SUPABASE_URL;
    const hasKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!hasUrl || !hasKey) setEnvProbe("missing-env");
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui" }}>
      <h2>Debug</h2>
      <div>hash router: true</div>
      <div>demo query (?demo=1): {demoFlag}</div>
      <div>supabase env: {envProbe}</div>
      <p style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
        You should be able to refresh this page at <code>#/debug</code> without errors.
      </p>
    </div>
  );
}