import React from "react";

interface KPIProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}

export function KPI({ label, value, icon }: KPIProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{label}</div>
        {icon}
      </div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}