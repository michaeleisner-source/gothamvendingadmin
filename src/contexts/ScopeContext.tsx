import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type ScopeState = {
  // time
  startISO: string;
  endISO: string;
  label: string;         // e.g., "Last 30 days" or "August 2025"
  mode: "last7" | "last30" | "last90" | "lastFullMonth" | "custom";

  // entities (optional)
  locationId: string | null;
  routeId: string | null;

  // setters
  setMode: (m: ScopeState["mode"]) => void;
  setCustomRange: (startISO: string, endISO: string, label?: string) => void;
  setLocation: (id: string | null) => void;
  setRoute: (id: string | null) => void;
  reset: () => void;
};

const ScopeCtx = createContext<ScopeState | null>(null);

function isoDaysAgo(d: number) {
  const x = new Date();
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - d);
  return x.toISOString();
}

function endOfTodayISO() {
  const x = new Date();
  x.setHours(23, 59, 59, 999);
  return x.toISOString();
}

function lastFullMonth() {
  const now = new Date();
  const firstOfThis = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(firstOfThis.getTime() - 1);
  const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
  const label = start.toLocaleDateString(undefined, { year: "numeric", month: "long" });
  return { startISO: start.toISOString(), endISO: end.toISOString(), label };
}

const DEFAULT = (() => {
  const startISO = isoDaysAgo(30);
  const endISO = endOfTodayISO();
  return { startISO, endISO, label: "Last 30 days", mode: "last30" as const, locationId: null, routeId: null };
})();

const LS_KEY = "gv_scope_v1";

export function ScopeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ScopeState["mode"]>(DEFAULT.mode);
  const [startISO, setStart] = useState(DEFAULT.startISO);
  const [endISO, setEnd] = useState(DEFAULT.endISO);
  const [label, setLabel] = useState(DEFAULT.label);
  const [locationId, setLocation] = useState<string | null>(DEFAULT.locationId);
  const [routeId, setRoute] = useState<string | null>(DEFAULT.routeId);

  // load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s?.mode) setMode(s.mode);
        if (s?.startISO) setStart(s.startISO);
        if (s?.endISO) setEnd(s.endISO);
        if (s?.label) setLabel(s.label);
        setLocation(s?.locationId ?? null);
        setRoute(s?.routeId ?? null);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // persist
  useEffect(() => {
    const s = { mode, startISO, endISO, label, locationId, routeId };
    try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch {}
  }, [mode, startISO, endISO, label, locationId, routeId]);

  // when mode changes, compute dates
  useEffect(() => {
    if (mode === "custom") return;
    if (mode === "last7") {
      setStart(isoDaysAgo(7)); setEnd(endOfTodayISO()); setLabel("Last 7 days");
    } else if (mode === "last30") {
      setStart(isoDaysAgo(30)); setEnd(endOfTodayISO()); setLabel("Last 30 days");
    } else if (mode === "last90") {
      setStart(isoDaysAgo(90)); setEnd(endOfTodayISO()); setLabel("Last 90 days");
    } else if (mode === "lastFullMonth") {
      const { startISO, endISO, label } = lastFullMonth();
      setStart(startISO); setEnd(endISO); setLabel(label);
    }
  }, [mode]);

  const setCustomRange = (start: string, end: string, lbl?: string) => {
    setMode("custom"); setStart(start); setEnd(end);
    setLabel(lbl || "Custom range");
  };

  const reset = () => {
    setMode(DEFAULT.mode);
    setStart(DEFAULT.startISO);
    setEnd(DEFAULT.endISO);
    setLabel(DEFAULT.label);
    setLocation(null);
    setRoute(null);
  };

  const value = useMemo<ScopeState>(() => ({
    startISO, endISO, label, mode,
    locationId, routeId,
    setMode, setCustomRange, setLocation, setRoute, reset
  }), [startISO, endISO, label, mode, locationId, routeId]);

  return <ScopeCtx.Provider value={value}>{children}</ScopeCtx.Provider>;
}

export function useScope() {
  const ctx = useContext(ScopeCtx);
  if (!ctx) throw new Error("useScope must be used within ScopeProvider");
  return ctx;
}