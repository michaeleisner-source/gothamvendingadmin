import React from "react";

interface ListProps {
  data: Record<string, number>;
}

export function List({ data }: ListProps) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  
  return (
    <div className="space-y-1">
      {entries.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{k}</span>
          <span className="font-medium">{v.toLocaleString()}</span>
        </div>
      ))}
      {!entries.length && <div className="text-sm text-muted-foreground">No data.</div>}
    </div>
  );
}