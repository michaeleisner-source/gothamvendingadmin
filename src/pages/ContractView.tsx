import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Contract view component for displaying contract details

export default function ContractView() {
  const { id } = useParams(); // /contracts/:id
  const [row, setRow] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const r = await supabase.from("contracts").select("*").eq("id", id).single();
      if (r.error) setErr(r.error.message);
      else setRow(r.data);
    })();
  }, [id]);

  if (err) return <div className="p-6 text-sm text-rose-400">{err}</div>;
  if (!row) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="p-6 space-y-3">
      <h1 className="text-xl font-semibold">{row.title}</h1>
      <div className="text-xs text-muted-foreground">
        Created {new Date(row.created_at).toLocaleString()}
        {row.signed_at ? <> · Signed {new Date(row.signed_at).toLocaleString()} by {row.signed_name}</> : null}
      </div>
      <div className="rounded-xl border border-border p-4 prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: row.body_html }} />
      <div className="text-right">
        <button onClick={()=>window.print()} className="mt-2 inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted">
          Print / Save as PDF
        </button>
      </div>
    </div>
  );
}