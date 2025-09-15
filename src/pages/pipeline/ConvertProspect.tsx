import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Save, CheckCircle2, Edit3, Eye } from "lucide-react";

type Any = Record<string, any>;

export default function ConvertProspect() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const prospectId = sp.get("prospect") || "";
  const [p, setP] = useState<Any|null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string|null>(null);

  // form
  const [name, setName] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [commissionModel, setCommissionModel] = useState<"none"|"percent_gross"|"flat_month"|"hybrid">("none");
  const [pctBps, setPctBps] = useState<number>(0);
  const [flatCents, setFlatCents] = useState<number>(0);
  const [minCents, setMinCents] = useState<number>(0);
  const [notes, setNotes] = useState("");

  // Contract editing
  const [isEditingContract, setIsEditingContract] = useState(false);
  const [customContractHTML, setCustomContractHTML] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true); setErr(null);
      try {
        if (prospectId) {
          const r = await supabase.from("prospects").select("*").eq("id", prospectId).single();
          if (r.error) throw r.error;
          setP(r.data);
          setName(r.data.business_name || r.data.name || "");
          setAddressLine1(r.data.address_line1 || "");
          setCity(r.data.city || "");
          setState(r.data.state || "");
          setPostalCode(r.data.postal_code || "");
        }
      } catch (e:any) {
        setErr(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [prospectId]);

  const fullAddress = useMemo(() => {
    return [addressLine1, city, state, postalCode].filter(Boolean).join(", ");
  }, [addressLine1, city, state, postalCode]);

  const templateContractHTML = useMemo(() => {
    return renderContractHTML({
      locationName: name || "(Location Name)",
      address: fullAddress || "(Address)",
      commissionModel, pctBps, flatCents, minCents,
    });
  }, [name, fullAddress, commissionModel, pctBps, flatCents, minCents]);

  const contractHTML = useMemo(() => {
    if (isEditingContract && customContractHTML.trim()) {
      return customContractHTML;
    }
    return templateContractHTML;
  }, [isEditingContract, customContractHTML, templateContractHTML]);

  async function handleCreate() {
    setErr(null);
    try {
      // Get current user's org
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("org_id")
        .eq("id", user.id)
        .single();
      
      if (!profile?.org_id) throw new Error("No organization found");
      
      // 1) create location
      const locIns = await supabase.from("locations").insert({
        name,
        address_line1: addressLine1,
        city,
        state,
        postal_code: postalCode,
        commission_model: commissionModel,
        commission_pct_bps: pctBps,
        commission_flat_cents: flatCents,
        commission_min_cents: minCents,
        commission_notes: notes,
      }).select("id").single();
      if (locIns.error) throw locIns.error;
      const locationId = locIns.data.id;

      // 2) create contract draft
      const number = `LOC-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9999)).padStart(4,"0")}`;
      const cIns = await supabase.from("contracts").insert({
        org_id: profile.org_id,
        prospect_id: prospectId || null,
        location_id: locationId,
        contract_number: number,
        status: "draft",
        title: `Contract for ${name}`,
        body_html: contractHTML,
        html: contractHTML,
        commission_flat_cents: flatCents,
        revenue_share_pct: commissionModel === "percent_gross" || commissionModel === "hybrid" ? pctBps / 100 : null,
      }).select("id").single();
      if (cIns.error) throw cIns.error;
      const contractId = cIns.data.id;

      // 3) back-link from location
      await supabase.from("locations").update({ contract_id: contractId }).eq("id", locationId);

      // 4) optionally mark prospect as converted (best-effort)
      if (prospectId) {
        const patch: Any = {
          status: "CONVERTED",
          converted_location_id: locationId,
        };
        await supabase.from("prospects").update(patch).eq("id", prospectId);
      }

      navigate(`/contracts/${contractId}`);
    } catch (e:any) {
      setErr(e.message || String(e));
    }
  }

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold flex items-center gap-2">
        <FileText className="h-5 w-5" /> Convert Prospect → Location + Contract
      </h1>

      {err && <div className="text-sm text-rose-400">{err}</div>}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left: form */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="text-xs text-muted-foreground">Prospect</div>
          <div className="text-sm font-medium">{p?.business_name || p?.name || "(unnamed)"}</div>

          <L label="Location Name">
            <input className="w-full bg-background border border-border rounded-md px-3 py-2"
              value={name} onChange={e=>setName(e.target.value)}/>
          </L>
          
          <L label="Street Address">
            <input className="w-full bg-background border border-border rounded-md px-3 py-2"
              value={addressLine1} onChange={e=>setAddressLine1(e.target.value)}/>
          </L>

          <div className="grid grid-cols-2 gap-2">
            <L label="City">
              <input className="w-full bg-background border border-border rounded-md px-3 py-2"
                value={city} onChange={e=>setCity(e.target.value)}/>
            </L>
            <L label="State">
              <input className="w-full bg-background border border-border rounded-md px-3 py-2"
                value={state} onChange={e=>setState(e.target.value)}/>
            </L>
          </div>

          <L label="Postal Code">
            <input className="w-full bg-background border border-border rounded-md px-3 py-2"
              value={postalCode} onChange={e=>setPostalCode(e.target.value)}/>
          </L>

          <L label="Revenue Share Model">
            <select className="w-full bg-background border border-border rounded-md px-3 py-2"
              value={commissionModel}
              onChange={e=>setCommissionModel(e.target.value as any)}>
              <option value="none">None</option>
              <option value="percent_gross">% of Gross Sales</option>
              <option value="flat_month">Flat $ / Month</option>
              <option value="hybrid">Hybrid (% of Gross + Flat)</option>
            </select>
          </L>

          {(commissionModel === "percent_gross" || commissionModel === "hybrid") && (
            <L label="% of Gross (bps)">
              <input type="number" min={0} max={10000}
                className="w-full bg-background border border-border rounded-md px-3 py-2"
                value={pctBps} onChange={e=>setPctBps(Number(e.target.value)||0)}/>
              <div className="text-xs text-muted-foreground mt-1">
                { (pctBps/100).toFixed(2) }% of gross sales
              </div>
            </L>
          )}

          {(commissionModel === "flat_month" || commissionModel === "hybrid") && (
            <L label="Flat Commission ($/month)">
              <input type="number" min={0}
                className="w-full bg-background border border-border rounded-md px-3 py-2"
                value={(flatCents/100)} onChange={e=>setFlatCents(Math.round((Number(e.target.value)||0)*100))}/>
            </L>
          )}

          <L label="Minimum Payout ($/month — optional)">
            <input type="number" min={0}
              className="w-full bg-background border border-border rounded-md px-3 py-2"
              value={(minCents/100)} onChange={e=>setMinCents(Math.round((Number(e.target.value)||0)*100))}/>
          </L>

          <L label="Notes (optional)">
            <textarea className="w-full bg-background border border-border rounded-md px-3 py-2"
              rows={3} value={notes} onChange={e=>setNotes(e.target.value)} />
          </L>

          <div className="flex gap-2">
            <button onClick={handleCreate}
              className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm hover:bg-primary/90">
              <Save className="h-4 w-4"/> Create Location + Draft Contract
            </button>
          </div>
        </div>

        {/* Right: contract editor/preview */}
        <div className="space-y-4">
          {/* Contract mode toggle */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Contract Preview</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditingContract(!isEditingContract)}
                className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs ${
                  isEditingContract
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card hover:bg-muted"
                }`}
              >
                {isEditingContract ? (
                  <>
                    <Eye className="h-3 w-3" /> Preview Mode
                  </>
                ) : (
                  <>
                    <Edit3 className="h-3 w-3" /> Edit Contract
                  </>
                )}
              </button>
            </div>
          </div>

          {isEditingContract ? (
            /* Contract Editor */
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">
                Edit the contract HTML. Dynamic values like location name and commission details will be inserted when you create the contract.
              </div>
              <textarea
                value={customContractHTML || templateContractHTML}
                onChange={(e) => setCustomContractHTML(e.target.value)}
                className="w-full h-[600px] font-mono text-sm bg-background border border-border rounded-md p-4 resize-none"
                placeholder="Enter contract HTML..."
              />
              <div className="flex gap-2 text-xs">
                <button
                  onClick={() => setCustomContractHTML(templateContractHTML)}
                  className="text-primary hover:underline"
                >
                  Reset to Template
                </button>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">
                  Use placeholders like {"{locationName}"} and {"{commissionText}"} for dynamic content
                </span>
              </div>
            </div>
          ) : (
            /* Contract Preview */
            <div className="rounded-xl border border-border bg-white text-black p-6 overflow-auto max-h-[600px]">
              <div dangerouslySetInnerHTML={{ __html: contractHTML }} />
            </div>
          )}
          
          <div className="text-xs text-neutral-600 flex items-center gap-1 bg-muted/30 p-3 rounded-md">
            <CheckCircle2 className="h-3 w-3" />
            Use your browser's <strong>Print → Save as PDF</strong> to export this draft after creation.
          </div>
        </div>
      </div>
    </div>
  );
}

function L({label, children}:{label:string; children:React.ReactNode}) {
  return (
    <label className="block">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      {children}
    </label>
  );
}

function renderContractHTML(opts:{
  locationName:string; address:string;
  commissionModel:"none"|"percent_gross"|"flat_month"|"hybrid";
  pctBps:number; flatCents:number; minCents:number;
}) {
  const pct = (opts.pctBps/100).toFixed(2);
  const flat = (opts.flatCents/100).toLocaleString(undefined,{style:"currency",currency:"USD"});
  const min  = (opts.minCents/100).toLocaleString(undefined,{style:"currency",currency:"USD"});

  const revShare =
    opts.commissionModel === "percent_gross" ? `Location receives ${pct}% of gross sales each settlement period.`
    : opts.commissionModel === "flat_month" ? `Location receives a flat ${flat} per month.`
    : opts.commissionModel === "hybrid" ? `Location receives ${pct}% of gross sales plus a flat ${flat} per month.`
    : `No commission is payable.`;

  const minTxt = opts.minCents>0 ? ` A minimum monthly payout of ${min} applies.` : "";

  return `
  <style>
    * { font-family: ui-sans-serif, system-ui; }
    h1 { font-size: 20px; margin: 0 0 8px; }
    h2 { font-size: 14px; margin: 16px 0 6px; }
    p  { font-size: 12px; margin: 6px 0; line-height: 1.4; }
    .box { border:1px solid #e5e7eb; padding:12px; border-radius:8px; }
    .sig { margin-top:24px; display:flex; gap:24px; }
    .sig div { flex:1; }
    .muted { color:#6b7280; }
  </style>
  <h1>Vending Services Agreement</h1>
  <p class="muted">This Vending Services Agreement ("Agreement") is between Gotham Vending ("Vendor") and
  <b>${escapeHtml(opts.locationName)}</b> ("Location") at <b>${escapeHtml(opts.address)}</b>.</p>

  <h2>1. Term & Scope</h2>
  <p>Vendor will place, stock, and maintain vending machines at the Location. The initial term is twelve (12) months and
  renews monthly thereafter unless either party provides 30 days' notice of termination.</p>

  <h2>2. Revenue Share</h2>
  <p>${revShare}${minTxt}</p>

  <h2>3. Settlement</h2>
  <p>Settlements occur monthly within 15 days after month-end, based on electronic sales records, less chargebacks and
  processor fees where applicable. Disputes must be raised within 30 days of the statement date.</p>

  <h2>4. Power & Access</h2>
  <p>Location provides standard power and reasonable access during business hours. Vendor retains ownership of machines and
  products.</p>

  <h2>5. Maintenance</h2>
  <p>Vendor will maintain machines in good working order and respond to service issues in a commercially reasonable timeframe.</p>

  <div class="sig">
    <div class="box">
      <p>Vendor Signature __________________________</p>
      <p>Name / Title _____________________________</p>
      <p>Date ________________</p>
    </div>
    <div class="box">
      <p>Location Signature ________________________</p>
      <p>Name / Title _____________________________</p>
      <p>Date ________________</p>
    </div>
  </div>
  `;
}

function escapeHtml(s:string){
  return String(s).replace(/[&<>"']/g,(m)=>({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[m]!));
}