import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, Filter, BarChart3, Search, ChevronDown, Plus, Phone, Mail, MapPin, Tags,
  Clock, CheckCircle2, XCircle, ArrowRight, ClipboardList, Building2, FileText
} from "lucide-react";

/** =========================================================
 * Helpers
 * ========================================================*/
type Prospect = {
  id: string;
  name?: string | null;
  company?: string | null;
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
  stage?: string | null;          // "new" | "contacted" | "qualified" | "proposal" | "won" | "lost"
  status?: string | null;         // fallback if stage missing
  source?: string | null;         // "referral" | "walk-in" | "web" | ...
  owner_id?: string | null;       // staff/rep
  city?: string | null;
  state?: string | null;
  address?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  next_follow_up_at?: string | null;
  converted_location_id?: string | null; // if already converted
};

type AnyRow = Record<string, any>;
const num = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const toDate = (v?: string | null) => (v ? new Date(v) : undefined);
const daysBetween = (a?: Date, b?: Date) => (a && b ? Math.abs(a.getTime() - b.getTime()) / 86400000 : undefined);
const title = (s: string) => s.slice(0, 1).toUpperCase() + s.slice(1);

function pickStage(p: Prospect) {
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
}
function isOverdue(p: Prospect) {
  const d = toDate(p.next_follow_up_at);
  return d ? d.getTime() < Date.now() : false;
}

/** =========================================================
 * Prospects Home — KPIs + Filters + Grouped "Boards" + Table
 * Route: /prospects
 * ========================================================*/
export function ProspectsHome() {
  const [rows, setRows] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // filters
  const [q, setQ] = useState("");
  const [stage, setStage] = useState<string>("all");
  const [source, setSource] = useState<string>("all");

  useEffect(() => {
    (async () => {
      setLoading(true); setErr(null);
      const { data, error } = await supabase
        .from("prospects")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1000);
      if (error) { setErr(error.message); setLoading(false); return; }
      setRows((data || []) as Prospect[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const qLower = q.trim().toLowerCase();
    return rows.filter((p) => {
      if (stage !== "all" && pickStage(p) !== stage) return false;
      if (source !== "all" && (p.source || "").toLowerCase() !== source) return false;
      if (!qLower) return true;
      const fields = [p.name, p.company, p.contact_name, p.email, p.phone, p.city, p.state, p.address, p.source]
        .map((x) => (x || "").toLowerCase());
      return fields.some((f) => f.includes(qLower));
    });
  }, [rows, q, stage, source]);

  const stages = ["new", "contacted", "qualified", "proposal", "won", "lost"];
  const grouped = useMemo(() => {
    const g: Record<string, Prospect[]> = {};
    stages.forEach((s) => (g[s] = []));
    filtered.forEach((p) => g[pickStage(p)].push(p));
    return g;
  }, [filtered]);

  // KPIs
  const now = new Date();
  const last7 = new Date(Date.now() - 7 * 864e5);
  const kpis = useMemo(() => {
    const new7 = rows.filter((p) => {
      const d = toDate(p.created_at);
      return d && d >= last7;
    }).length;
    const active = rows.filter((p) => !["won", "lost"].includes(pickStage(p))).length;
    const overdue = rows.filter((p) => isOverdue(p)).length;
    const wonThisMonth = rows.filter((p) => {
      const st = pickStage(p);
      const d = toDate(p.updated_at);
      const sameMonth = d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      return st === "won" && sameMonth;
    }).length;
    const convRate = rows.length ? Math.round((rows.filter((p) => pickStage(p) === "won").length / rows.length) * 100) : 0;
    return { new7, active, overdue, wonThisMonth, convRate };
  }, [rows]);

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2"><Users className="h-5 w-5" /> Prospects</h1>
        <div className="flex items-center gap-2">
          <Link to="/reports/pipeline-analytics" className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted">
            <BarChart3 className="h-4 w-4" /> Pipeline Analytics
          </Link>
          <Link to="/locations" className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted">
            Convert to Location <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* KPI Bar */}
      <div className="grid gap-2 sm:grid-cols-5">
        <KPI label="New (7d)" value={kpis.new7} />
        <KPI label="Active Leads" value={kpis.active} />
        <KPI label="Overdue Follow-ups" value={kpis.overdue} tone="warn" />
        <KPI label="Won (this month)" value={kpis.wonThisMonth} />
        <KPI label="Conversion Rate" value={`${kpis.convRate}%`} />
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, company, contact, email, city…"
              className="pl-8 pr-3 py-2 text-sm rounded-md bg-background border border-border min-w-[260px]"
            />
          </div>
          <Select value={stage} onChange={setStage} label="Stage" options={["all", ...stages]} />
          <Select value={source} onChange={setSource} label="Source" options={["all", ...Array.from(new Set(rows.map(r => (r.source || "").toLowerCase()).filter(Boolean)))]} />
          <div className="ml-auto text-xs text-muted-foreground flex items-center gap-2">
            <Filter className="h-4 w-4" /> {filtered.length} shown / {rows.length} total
          </div>
        </div>
      </div>

      {/* Grouped "Boards" */}
      <div className="grid gap-3 lg:grid-cols-3">
        {["new", "contacted", "qualified"].map((st) => (
          <StageColumn key={st} title={title(st)} items={grouped[st]} emptyHint="No leads here yet." />
        ))}
      </div>

      {/* Pipeline tail: proposal, won, lost */}
      <div className="grid gap-3 lg:grid-cols-3">
        {["proposal", "won", "lost"].map((st) => (
          <StageColumn key={st} title={title(st)} items={grouped[st]} emptyHint="—" />
        ))}
      </div>

      {/* Table view (alternative) */}
      <div className="rounded-xl border border-border overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-3 py-2 text-left">Lead</th>
              <th className="px-3 py-2 text-left">Contact</th>
              <th className="px-3 py-2 text-left">Source</th>
              <th className="px-3 py-2 text-left">Stage</th>
              <th className="px-3 py-2 text-left">Next Follow-up</th>
              <th className="px-3 py-2 text-left">Location</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => <ProspectRow key={p.id} p={p} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KPI({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "warn" | "ok" }) {
  const toneClass = tone === "warn" ? "text-amber-500" : tone === "ok" ? "text-emerald-500" : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}

function Select({ value, onChange, label, options }: { value: string; onChange: (v: string) => void; label: string; options: string[] }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="relative">
        <select
          className="appearance-none rounded-md bg-background border border-border px-3 py-2 pr-8 text-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>{title(opt)}</option>
          ))}
        </select>
        <ChevronDown className="h-4 w-4 absolute right-2 top-2.5 text-muted-foreground pointer-events-none" />
      </div>
    </label>
  );
}

function StageColumn({ title: t, items, emptyHint }: { title: string; items: Prospect[]; emptyHint: string }) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="px-3 py-2 border-b border-border text-sm font-medium flex items-center gap-2">
        <ClipboardList className="h-4 w-4" /> {t} <span className="text-xs text-muted-foreground">({items.length})</span>
      </div>
      <div className="p-2 space-y-2">
        {items.length === 0 && <div className="text-xs text-muted-foreground px-2 py-3">{emptyHint}</div>}
        {items.map((p) => <ProspectCard key={p.id} p={p} />)}
      </div>
    </div>
  );
}

function ProspectCard({ p }: { p: Prospect }) {
  const overdue = isOverdue(p);
  return (
    <Link to={`/prospects/${p.id}`} className="block rounded-lg border border-border bg-background p-3 hover:bg-muted">
      <div className="font-medium">{p.name || p.company || "Untitled lead"}</div>
      <div className="mt-1 text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
        {p.contact_name && <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {p.contact_name}</span>}
        {p.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {p.phone}</span>}
        {p.email && <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {p.email}</span>}
        {p.source && <span className="inline-flex items-center gap-1"><Tags className="h-3.5 w-3.5" /> {title(p.source)}</span>}
        {(p.city || p.state) && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {(p.city || "") + (p.state ? ", " + p.state : "")}</span>}
      </div>
      {p.next_follow_up_at && (
        <div className="mt-2 text-xs inline-flex items-center gap-1 rounded border border-border px-2 py-1">
          <Clock className="h-3.5 w-3.5" />
          Next: {new Date(p.next_follow_up_at).toLocaleString()}
          {overdue && <span className="ml-2 text-amber-500">Overdue</span>}
        </div>
      )}
    </Link>
  );
}

function ProspectRow({ p }: { p: Prospect }) {
  const navigate = useNavigate();
  const stage = pickStage(p);
  const next = p.next_follow_up_at ? new Date(p.next_follow_up_at).toLocaleString() : "—";
  return (
    <tr className="odd:bg-card/50">
      <td className="px-3 py-2">
        <button onClick={() => navigate(`/prospects/${p.id}`)} className="hover:underline">
          {p.name || p.company || "—"}
        </button>
      </td>
      <td className="px-3 py-2">{p.contact_name || p.email || p.phone || "—"}</td>
      <td className="px-3 py-2">{p.source ? title(p.source) : "—"}</td>
      <td className="px-3 py-2">{title(stage)}</td>
      <td className="px-3 py-2">{next}</td>
      <td className="px-3 py-2">{p.converted_location_id ? <Link className="hover:underline" to={`/locations/${p.converted_location_id}`}>Location</Link> : "—"}</td>
      <td className="px-3 py-2 text-right">
        <Link to={`/locations/new?from_prospect=${p.id}`} className="inline-flex items-center gap-1 rounded border border-border bg-card px-2 py-1 hover:bg-muted text-xs">
          Convert <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </td>
    </tr>
  );
}

/** =========================================================
 * Prospect Detail — timeline/tasks/quick actions
 * Route: /prospects/:id
 * ========================================================*/
type Note = { id: string; prospect_id: string; body?: string | null; created_at?: string | null; type?: string | null };

export function ProspectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [p, setP] = useState<Prospect | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: dp } = await supabase.from("prospects").select("*").eq("id", id).single();
      setP((dp || null) as Prospect | null);

      // Optional related activities/notes table
      const { data: dn } = await supabase.from("prospect_activities").select("*").eq("prospect_id", id).order("created_at", { ascending: false });
      setNotes((dn || []) as Note[]);
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
        {/* Left: details */}
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

        {/* Middle: quick note */}
        <div className="rounded-xl border border-border bg-card p-3 space-y-2">
          <div className="text-sm font-medium">Quick Note</div>
          <QuickNote prospectId={p.id} onSaved={() => window.location.reload()} />
          <div className="text-xs text-muted-foreground">Tip: log calls, emails, site visits, proposal sent, etc.</div>
        </div>

        {/* Right: actions */}
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

      {/* Timeline */}
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
    await supabase.from("prospect_activities").insert({ prospect_id: prospectId, body: val.trim(), type });
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

/** =========================================================
 * Pipeline Analytics — stage/source mix, conversion, aging
 * Route: /reports/pipeline-analytics
 * ========================================================*/
export function PipelineAnalytics() {
  const [rows, setRows] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true); setErr(null);
      const { data, error } = await supabase.from("prospects").select("*").order("created_at", { ascending: false }).limit(2000);
      if (error) { setErr(error.message); setLoading(false); return; }
      setRows((data || []) as Prospect[]);
      setLoading(false);
    })();
  }, []);

  const stageCounts = useMemo(() => {
    const acc: Record<string, number> = {};
    rows.forEach((p) => { const s = pickStage(p); acc[s] = (acc[s] || 0) + 1; });
    return acc;
  }, [rows]);

  const sources = useMemo(() => {
    const acc: Record<string, number> = {};
    rows.forEach((p) => { const s = (p.source || "unknown").toLowerCase(); acc[s] = (acc[s] || 0) + 1; });
    return acc;
  }, [rows]);

  const convRate = rows.length ? (rows.filter((p) => pickStage(p) === "won").length / rows.length) * 100 : 0;

  const aging = useMemo(() => {
    const now = new Date();
    const buckets = { "0–7d": 0, "8–30d": 0, "31–90d": 0, "90d+": 0 };
    rows.forEach((p) => {
      const d = toDate(p.created_at) || now;
      const a = daysBetween(now, d) || 0;
      if (a <= 7) buckets["0–7d"]++; else if (a <= 30) buckets["8–30d"]++; else if (a <= 90) buckets["31–90d"]++; else buckets["90d+"]++;
    });
    return buckets;
  }, [rows]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Pipeline Analytics</h1>
        <Link to="/prospects" className="rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted">Back to Prospects</Link>
      </div>

      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {err && <div className="text-sm text-red-400">Error: {err}</div>}

      {!loading && !err && (
        <>
          <div className="grid gap-2 sm:grid-cols-3">
            <Tile title="Total Leads" value={rows.length.toLocaleString()} icon={<Users className="h-4 w-4" />} />
            <Tile title="Conversion Rate" value={`${convRate.toFixed(1)}%`} icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />} />
            <Tile title="Lost (%)" value={`${((rows.filter((p) => pickStage(p) === "lost").length / (rows.length || 1)) * 100).toFixed(1)}%`} icon={<XCircle className="h-4 w-4 text-rose-500" />} />
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <Card title="Stage Mix">
              <SimpleList data={stageCounts} />
            </Card>
            <Card title="Lead Sources">
              <SimpleList data={sources} />
            </Card>
          </div>

          <Card title="Lead Aging (by created date)">
            <SimpleList data={aging} />
            <div className="text-xs text-muted-foreground mt-2">Tip: use Next Follow-up and Overdue KPI to stay on top of aging leads.</div>
          </Card>
        </>
      )}
    </div>
  );
}
function Tile({ title, value, icon }: { title: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{title}</div>
        {icon}
      </div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-sm font-medium mb-2">{title}</div>
      {children}
    </div>
  );
}
function SimpleList({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  return (
    <div className="space-y-1">
      {entries.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{title(k)}</span>
          <span className="font-medium">{v.toLocaleString()}</span>
        </div>
      ))}
      {!entries.length && <div className="text-sm text-muted-foreground">No data.</div>}
    </div>
  );
}

// Default export for the main component
export default ProspectsHome;