import React from "react";

export function KPIBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {children}
    </div>
  );
}

export function KPI({
  label,
  value,
  hint,
  icon,
  intent = "neutral",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
  intent?: "good" | "warn" | "bad" | "neutral";
}) {
  const color =
    intent === "good" ? "text-emerald-400"
      : intent === "warn" ? "text-amber-400"
      : intent === "bad" ? "text-rose-400"
      : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">{label}</div>
        {icon}
      </div>
      <div className={`mt-1 text-2xl font-semibold ${color}`}>{value}</div>
      {hint ? <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div> : null}
    </div>
  );
}