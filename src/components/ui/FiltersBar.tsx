import React from "react";

interface FiltersBarProps {
  children?: React.ReactNode;
}

export function FiltersBar({ children }: FiltersBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 bg-muted border border-border rounded-xl p-2">
      {children ?? <DefaultFilters />}
    </div>
  );
}

function DefaultFilters() {
  return (
    <>
      <input 
        className="bg-background border border-input rounded-lg px-2 py-1 text-sm" 
        placeholder="Date from" 
        type="date" 
      />
      <input 
        className="bg-background border border-input rounded-lg px-2 py-1 text-sm" 
        placeholder="Date to" 
        type="date" 
      />
      <input 
        className="bg-background border border-input rounded-lg px-2 py-1 text-sm" 
        placeholder="Location/Machine" 
      />
      <button className="px-3 py-1 text-sm rounded-lg bg-muted hover:bg-accent">
        Apply
      </button>
    </>
  );
}