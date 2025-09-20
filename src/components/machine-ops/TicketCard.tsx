import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Factory, Clock, Plus, Minus } from "lucide-react";
import { Ticket } from "@/lib/machine-ops-utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface TicketCardProps {
  t: Ticket;
}

export function TicketCard({ t }: TicketCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="rounded-lg border border-border bg-background">
        <CollapsibleTrigger className="w-full p-3 text-left hover:bg-muted flex items-center justify-between group">
          <div className="font-medium">{t.title || t.issue || t.id}</div>
          {isExpanded ? (
            <Minus className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
          ) : (
            <Plus className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
          )}
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-3 pb-3 border-t border-border/50">
            <div className="mt-2 text-xs text-muted-foreground flex flex-wrap gap-3">
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
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}