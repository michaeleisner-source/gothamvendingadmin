import React from "react";

interface CardProps {
  title: string;
  children: React.ReactNode;
}

export function Card({ title, children }: CardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-sm font-medium mb-2">{title}</div>
      {children}
    </div>
  );
}