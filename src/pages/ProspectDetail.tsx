import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, Phone, Mail, MapPin, Tags, ArrowRight, BarChart3, FileText, Plus
} from "lucide-react";

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
  owner_id?: string | null;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  next_follow_up_at?: string | null;
  converted_location_id?: string | null;
};

type Note = { 
  id: string; 
  prospect_id: string; 
  body?: string | null; 
  created_at?: string | null; 
  type?: string | null 
};

const toDate = (v?: string | null) => (v ? new Date(v) : undefined);
const title = (s: string) => s.slice(0, 1).toUpperCase() + s.slice(1);

function pickStage(p: Prospect) {
  const s = (p.stage || p.status || "new").toLowerCase();
  const normalized: Record<string, string> = {
    new: "new", contacted: "contacted", qualifying: "qualified", qualified: "qualified",
    meeting: "qualified", proposal: "proposal", won: "won", closed_won: "won",
    lost: "lost", closed_lost: "lost",
  };
  return normalized[s] || "new";
}

function isOverdue(p: Prospect) {
  const d = toDate(p.next_follow_up_at);
  return d ? d.getTime() < Date.now() : false;
}

function DetailRow({ label, value, addon }: { label: string; value: React.ReactNode; addon?: React.ReactNode }) {
  return (
    <div className="text-sm flex items-center justify-between gap-3">
      <div className="text-muted-foreground">{label}</div>
      <div className="flex items-center gap-2">{value}{addon}</div>
    </div>
  );
}

function QuickNote({ prospectId, onSaved }: { prospectId: string; onSaved?: () => void }) {
  const [val, setVal] = useState("");
  const [type, setType] = useState("note");
  const [loading, setLoading] = useState(false);
  
  async function save() {
    if (!val.trim()) return;
    setLoading(true);
    // For now, just simulate saving since prospect_activities table doesn't exist yet
    console.log('Would save note:', { prospect_id: prospectId, body: val.trim(), type });
    setLoading(false);
    setVal("");
    onSaved?.();
  }
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Type</span>
        <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-md bg-background border border-border px-2 py-1">
          <option value="note">Note</option>
          <option value="call">Call</option>
          <option value="email">Email</option>
          <option value="visit">Visit</option>
          <option value="proposal">Proposal</option>
        </select>
      </div>
      <textarea
        rows={3}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="w-full rounded-md bg-background border border-border p-2 text-sm"
        placeholder="What happened? (e.g., Called owner, discussed placement…)"
      />
      <button disabled={loading} onClick={save} className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted">
        <Plus className="h-4 w-4" /> {loading ? "Saving…" : "Add Note"}
      </button>
    </div>
  );
}

export default function ProspectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [p, setP] = useState<Prospect | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: dp } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
      setP((dp || null) as Prospect | null);

      // For now, create empty notes array since prospect_activities table doesn't exist yet
      setNotes([]);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  if (!p) return <div className="p-6 text-sm text-red-400">Prospect not found.</div>;

  const stage = pickStage(p);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{p.name || p.company || "Prospect"}</h1>
          <div className="mt-1 text-sm text-muted-foreground flex flex-wrap gap-3">
            {p.contact_name && <span className="inline-flex items-center gap-1"><Users className="h-4 w-4" /> {p.contact_name}</span>}
            {p.phone && <span className="inline-flex items-center gap-1"><Phone className="h-4 w-4" /> {p.phone}</span>}
            {p.email && <span className="inline-flex items-center gap-1"><Mail className="h-4 w-4" /> {p.email}</span>}
            {p.address && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {p.address}</span>}
            {p.source && <span className="inline-flex items-center gap-1"><Tags className="h-4 w-4" /> {title(p.source)}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/prospects" className="rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted">Back</Link>
          {stage !== "won" && (
            <Link to={`/locations/new?from_prospect=${p.id}`} className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted">
              Convert to Location <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-3 space-y-2">
          <div className="text-sm font-medium">Details</div>
          <DetailRow label="Stage" value={title(stage)} />
          <DetailRow label="Owner" value={p.owner_id || "—"} />
          <DetailRow label="Created" value={p.created_at ? new Date(p.created_at).toLocaleString() : "—"} />
          <DetailRow label="Updated" value={p.updated_at ? new Date(p.updated_at).toLocaleString() : "—"} />
          <DetailRow label="Next Follow-up" value={p.next_follow_up_at ? new Date(p.next_follow_up_at).toLocaleString() : "—"}
                     addon={isOverdue(p) ? <span className="text-amber-500 text-xs">Overdue</span> : null} />
          <DetailRow label="Converted Location" value={p.converted_location_id ? <Link className="hover:underline" to={`/locations/${p.converted_location_id}`}>{p.converted_location_id}</Link> : "—"} />
        </div>

        <div className="rounded-xl border border-border bg-card p-3 space-y-2">
          <div className="text-sm font-medium">Quick Note</div>
          <QuickNote prospectId={p.id} onSaved={() => window.location.reload()} />
          <div className="text-xs text-muted-foreground">Tip: log calls, emails, site visits, proposal sent, etc.</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-3 space-y-2">
          <div className="text-sm font-medium">Actions</div>
          <div className="flex flex-col gap-2">
            <button onClick={() => navigate(`/help?cat=pipeline`)} className="rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-muted inline-flex items-center gap-2">
              <FileText className="h-4 w-4" /> Open Pipeline Help
            </button>
            <Link to={`/reports/pipeline-analytics`} className="rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-muted inline-flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> View Pipeline Analytics
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="px-3 py-2 border-b border-border text-sm font-medium">Timeline</div>
        <div className="p-3">
          {!notes.length ? (
            <div className="text-sm text-muted-foreground">No activity yet. Use Quick Note to add your first interaction.</div>
          ) : (
            <ul className="space-y-2">
              {notes.map((n) => (
                <li key={n.id} className="rounded-md border border-border bg-background p-2">
                  <div className="text-xs text-muted-foreground">{n.created_at ? new Date(n.created_at).toLocaleString() : "—"} · {n.type || "note"}</div>
                  <div className="text-sm whitespace-pre-wrap">{n.body || "—"}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}