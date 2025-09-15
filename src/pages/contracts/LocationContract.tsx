import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Printer, CheckCircle2 } from "lucide-react";

type Any = Record<string, any>;

export default function LocationContract() {
  const { id } = useParams(); // location id
  const [contract, setContract] = useState<Any|null>(null);
  const [locationRow, setLocationRow] = useState<Any|null>(null);
  const [err, setErr] = useState<string|null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true); setErr(null);
      try {
        const loc = await supabase.from("locations").select("*").eq("id", id).single();
        if (loc.error) throw loc.error;
        setLocationRow(loc.data);
        if (loc.data.contract_id) {
          const c = await supabase.from("contracts").select("*").eq("id", loc.data.contract_id).single();
          if (!c.error) setContract(c.data);
        }
      } catch (e:any) {
        setErr(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function markSigned() {
    if (!contract) return;
    const r = await supabase.from("contracts").update({
      signed_at: new Date().toISOString(),
      signed_name: "Location Representative",
    }).eq("id", contract.id).select("*").single();
    if (!r.error) setContract(r.data);
  }

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  if (err) return <div className="p-6 text-sm text-rose-400">Error: {err}</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" /> Contract — {locationRow?.name ?? id}
        </h1>
        <div className="flex gap-2">
          <button onClick={()=>window.print()}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted">
            <Printer className="h-4 w-4"/> Print / Save PDF
          </button>
          {!contract?.signed_at && contract && (
            <button onClick={markSigned}
              className="inline-flex items-center gap-1 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm hover:bg-primary/90">
              <CheckCircle2 className="h-4 w-4"/> Mark Signed
            </button>
          )}
        </div>
      </div>

      {!contract ? (
        <div className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
          No contract linked. Use "Convert Prospect" to generate a draft.
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-white text-black p-6">
          <div dangerouslySetInnerHTML={{ __html: contract.body_html || contract.html || "(no HTML stored)" }} />
          <div className="mt-3 text-xs text-neutral-600">
            Status: <b>{contract.signed_at ? "Signed" : "Draft"}</b>
            {contract.signed_at ? (
              <> — signed {new Date(contract.signed_at).toLocaleDateString()}</>
            ) : null}
            {contract.signed_name ? <> by {contract.signed_name}</> : null}
          </div>
        </div>
      )}
    </div>
  );
}