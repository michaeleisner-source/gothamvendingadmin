import React from "react";
import { Link } from "react-router-dom";
import { Factory, Clock } from "lucide-react";
import { Ticket } from "@/lib/machine-ops-utils";

interface TicketCardProps {
  t: Ticket;
}

export function TicketCard({ t }: TicketCardProps) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="font-medium">{t.title || t.issue || t.id}</div>
      <div className="mt-1 text-xs text-muted-foreground flex flex-wrap gap-3">
        <span>Status: {(t.status || "open").toUpperCase()}</span>
        <span>Priority: {(t.priority || "medium").toUpperCase()}</span>
        {t.machine_id && (
          <span className="inline-flex items-center gap-1">
            <Factory className="h-3.5 w-3.5" /> 
            <Link to={`/machines/${t.machine_id}`} className="hover:underline">
              {t.machine_id}
            </Link>
          </span>
        )}
        {t.created_at && (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> 
            {new Date(t.created_at).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}