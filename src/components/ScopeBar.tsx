import React, { useEffect, useState } from "react";
import { useScope } from "@/contexts/ScopeContext";
import { supabase } from "@/integrations/supabase/client";

type Opt = { id: string; name: string };

export default function ScopeBar() {
  const scope = useScope();
  const [locs, setLocs] = useState<Opt[]>([]);
  const [routes, setRoutes] = useState<Opt[]>([]);
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState(scope.startISO.slice(0, 10));
  const [customEnd, setCustomEnd] = useState(scope.endISO.slice(0, 10));

  useEffect(() => {
    (async () => {
      const l = await supabase.from("locations").select("id,name").order("name", { ascending: true }).limit(10000);
      if (!l.error) setLocs((l.data || []).map(r => ({ id: String(r.id), name: r.name || "(unnamed)" })));
      const r = await supabase.from("delivery_routes").select("id,name").order("name", { ascending: true }).limit(10000);
      if (!r.error) setRoutes((r.data || []).map(r => ({ id: String(r.id), name: r.name || "(route)" })));
    })();
  }, []);

  useEffect(() => {
    setShowCustom(scope.mode === "custom");
    setCustomStart(scope.startISO.slice(0,10));
    setCustomEnd(scope.endISO.slice(0,10));
  }, [scope.mode, scope.startISO, scope.endISO]);

  return (
    <div className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b border-border">
      <div className="mx-auto max-w-screen-2xl px-4 py-2 flex flex-wrap items-center gap-2">
        {/* Time range */}
        <select
          value={scope.mode}
          onChange={(e) => scope.setMode(e.target.value as any)}
          className="bg-card border border-border rounded-md px-2 py-1 text-sm"
          aria-label="Time range"
        >
          <option value="last7">Last 7 days</option>
          <option value="last30">Last 30 days</option>
          <option value="last90">Last 90 days</option>
          <option value="lastFullMonth">Last full month</option>
          <option value="custom">Custom…</option>
        </select>

        {showCustom && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              className="bg-card border border-border rounded-md px-2 py-1 text-sm"
              aria-label="Custom start date"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              className="bg-card border border-border rounded-md px-2 py-1 text-sm"
              aria-label="Custom end date"
            />
            <button
              onClick={() => {
                const s = new Date(customStart + "T00:00:00Z").toISOString();
                const e = new Date(customEnd + "T23:59:59Z").toISOString();
                scope.setCustomRange(s, e, `${customStart} → ${customEnd}`);
              }}
              className="text-xs rounded-md border border-border bg-card px-2 py-1 hover:bg-muted"
            >
              Apply
            </button>
          </div>
        )}

        {/* Location filter */}
        <select
          value={scope.locationId || ""}
          onChange={(e) => scope.setLocation(e.target.value || null)}
          className="bg-card border border-border rounded-md px-2 py-1 text-sm"
          aria-label="Location"
        >
          <option value="">All locations</option>
          {locs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>

        {/* Route filter (only if routes exist) */}
        {routes.length > 0 && (
          <select
            value={scope.routeId || ""}
            onChange={(e) => scope.setRoute(e.target.value || null)}
            className="bg-card border border-border rounded-md px-2 py-1 text-sm"
            aria-label="Route"
          >
            <option value="">All routes</option>
            {routes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        )}

        {/* Label */}
        <div className="ml-auto text-xs text-muted-foreground">
          Scope: <span className="font-medium">{scope.label}</span>
          {scope.locationId ? <span> · location set</span> : null}
          {scope.routeId ? <span> · route set</span> : null}
        </div>
      </div>
    </div>
  );
}