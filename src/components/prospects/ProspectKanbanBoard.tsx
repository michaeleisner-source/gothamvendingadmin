import { Link } from "react-router-dom";
import { useState } from "react";
import { ClipboardList, Users, Phone, Mail, Tags, Clock, AlertTriangle, Plus, Minus } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type Prospect = {
  id: string;
  name?: string | null;
  company?: string | null;
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
  stage?: string | null;
  status?: string | null;
  source?: string | null;
  next_follow_up_at?: string | null;
  city?: string | null;
  state?: string | null;
};

interface ProspectKanbanBoardProps {
  prospects: Prospect[];
  stages: string[];
}

export function ProspectKanbanBoard({ prospects, stages }: ProspectKanbanBoardProps) {
  const title = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  
  const pickStage = (p: Prospect) => {
    const s = (p.stage || p.status || "new").toLowerCase();
    const normalized: Record<string, string> = {
      new: "new",
      contacted: "contacted",
      qualifying: "qualified",
      qualified: "qualified",
      meeting: "qualified",
      proposal: "proposal",
      won: "won",
      closed_won: "won",
      lost: "lost",
      closed_lost: "lost",
    };
    return normalized[s] || "new";
  };

  const isOverdue = (p: Prospect) => {
    const d = p.next_follow_up_at ? new Date(p.next_follow_up_at) : null;
    return d ? d.getTime() < Date.now() : false;
  };

  const grouped = stages.reduce((acc, stage) => {
    acc[stage] = prospects.filter(p => pickStage(p) === stage);
    return acc;
  }, {} as Record<string, Prospect[]>);

  return (
    <div className="space-y-6">
      {/* Active Pipeline */}
      <div className="grid gap-3 lg:grid-cols-3">
        {["new", "contacted", "qualified"].map((stage) => (
          <StageColumn 
            key={stage} 
            title={title(stage)} 
            items={grouped[stage] || []} 
            emptyHint="No leads here yet." 
            isOverdue={isOverdue}
          />
        ))}
      </div>

      {/* Pipeline Tail */}
      <div className="grid gap-3 lg:grid-cols-3">
        {["proposal", "won", "lost"].map((stage) => (
          <StageColumn 
            key={stage} 
            title={title(stage)} 
            items={grouped[stage] || []} 
            emptyHint="—"
            isOverdue={isOverdue}
          />
        ))}
      </div>
    </div>
  );
}

function StageColumn({ 
  title: columnTitle, 
  items, 
  emptyHint,
  isOverdue
}: { 
  title: string; 
  items: Prospect[]; 
  emptyHint: string;
  isOverdue: (p: Prospect) => boolean;
}) {
  const title = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="px-3 py-2 border-b border-border text-sm font-medium flex items-center gap-2">
        <ClipboardList className="h-4 w-4" /> 
        {columnTitle} 
        <span className="text-xs text-muted-foreground">({items.length})</span>
      </div>
      <div className="p-2 space-y-2">
        {items.length === 0 && (
          <div className="text-xs text-muted-foreground px-2 py-3">{emptyHint}</div>
        )}
        {items.map((p) => (
          <ProspectCard 
            key={p.id} 
            prospect={p} 
            isOverdue={isOverdue(p)} 
            title={title}
            isNewStage={columnTitle === "New"}
          />
        ))}
      </div>
    </div>
  );
}

function ProspectCard({ 
  prospect, 
  isOverdue: overdue,
  title,
  isNewStage = false
}: { 
  prospect: Prospect; 
  isOverdue: boolean;
  title: (s: string) => string;
  isNewStage?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (isNewStage) {
    return (
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="rounded-lg border border-border bg-background">
          <CollapsibleTrigger className="w-full p-3 text-left hover:bg-muted flex items-center justify-between group">
            <div className="font-medium flex items-center gap-2">
              {prospect.name || prospect.company || "Untitled lead"}
              {overdue && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
            </div>
            {isExpanded ? (
              <Minus className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
            ) : (
              <Plus className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
            )}
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <div className="px-3 pb-3 border-t border-border/50">
              <div className="mt-2 text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                {prospect.contact_name && (
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> {prospect.contact_name}
                  </span>
                )}
                {prospect.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" /> {prospect.phone}
                  </span>
                )}
                {prospect.email && (
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" /> {prospect.email}
                  </span>
                )}
                {prospect.source && (
                  <span className="inline-flex items-center gap-1">
                    <Tags className="h-3.5 w-3.5" /> {title(prospect.source)}
                  </span>
                )}
                {prospect.next_follow_up_at && (
                  <span className={`inline-flex items-center gap-1 ${overdue ? 'text-amber-600 font-medium' : ''}`}>
                    <Clock className="h-3.5 w-3.5" /> 
                    {new Date(prospect.next_follow_up_at).toLocaleDateString()}
                  </span>
                )}
              </div>
              {(prospect.city || prospect.state) && (
                <div className="mt-1 text-xs text-muted-foreground">
                  📍 {[prospect.city, prospect.state].filter(Boolean).join(", ")}
                </div>
              )}
              <Link 
                to={`/prospects/${prospect.id}`}
                className="inline-block mt-2 text-xs text-primary hover:underline"
              >
                View Details →
              </Link>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
  }

  return (
    <Link 
      to={`/prospects/${prospect.id}`} 
      className="block rounded-lg border border-border bg-background p-3 hover:bg-muted"
    >
      <div className="font-medium flex items-center gap-2">
        {prospect.name || prospect.company || "Untitled lead"}
        {overdue && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
      </div>
      <div className="mt-1 text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
        {prospect.contact_name && (
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> {prospect.contact_name}
          </span>
        )}
        {prospect.phone && (
          <span className="inline-flex items-center gap-1">
            <Phone className="h-3.5 w-3.5" /> {prospect.phone}
          </span>
        )}
        {prospect.email && (
          <span className="inline-flex items-center gap-1">
            <Mail className="h-3.5 w-3.5" /> {prospect.email}
          </span>
        )}
        {prospect.source && (
          <span className="inline-flex items-center gap-1">
            <Tags className="h-3.5 w-3.5" /> {title(prospect.source)}
          </span>
        )}
        {prospect.next_follow_up_at && (
          <span className={`inline-flex items-center gap-1 ${overdue ? 'text-amber-600 font-medium' : ''}`}>
            <Clock className="h-3.5 w-3.5" /> 
            {new Date(prospect.next_follow_up_at).toLocaleDateString()}
          </span>
        )}
      </div>
      {(prospect.city || prospect.state) && (
        <div className="mt-1 text-xs text-muted-foreground">
          📍 {[prospect.city, prospect.state].filter(Boolean).join(", ")}
        </div>
      )}
    </Link>
  );
}