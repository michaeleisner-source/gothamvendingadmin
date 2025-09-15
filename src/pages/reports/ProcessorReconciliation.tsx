import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useScope } from "@/context/Scope";
import { useFeeRuleCache, aggregateWithFees, money as fmtMoney } from "@/utils/fees";
import { Scale, RefreshCw, Info, Plus, Download } from "lucide-react";

type Any = Record<string, any>;
const money = (n:number)=> fmtMoney(Number.isFinite(n)?n:0);
const csvCell = (s:any)=> {
  const v = String(s ?? "");
  return (v.includes(",") || v.includes('"') || v.includes("\n")) ? `"${v.replace(/"/g,'""')}"` : v;
};

export default function ProcessorReconciliation() {
  const scope = useScope();
  const { feeFor, loading: feeLoading } = useFeeRuleCache();

  const [processors, setProcessors] = useState<Any[]>([]);
  const [mapping, setMapping]   = useState<Any[]>([]);
  const [machines, setMachines] = useState<Any[]>([]);
  const [sales, setSales]       = useState<Any[]>([]);
  const [settlements, setSettlements] = useState<Any[]>([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string|null>(null);

  // Add-settlement form state
  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState<{processor_id?: string, period_start?: string, period_end?: string, gross?: string, fees?: string, net?: string, payout_date?: string, reference?: string, notes?: string}>({});

  useEffect(() => {
    (async () => {
      setLoading(true); setErr(null);
      try {
        // Processors + mappings
        const p = await supabase.from("payment_processors").select("id,name").limit(10000);
        if (p.error) throw p.error;
        setProcessors(p.data || []);

        const map = await supabase.from("machine_processor_mappings").select("machine_id, processor_id").limit(100000);
        if (map.error) throw map.error;
        setMapping(map.data || []);

        // Machines (respect location scope if set)
        const mq = supabase.from("machines").select("id,name,location_id").limit(100000);
        if (scope.locationId) mq.eq("location_id", scope.locationId);
        const m = await mq;
        if (m.error) throw m.error;
        const mRows = m.data || [];
        setMachines(mRows);
        const ids = mRows.map((r:any)=>r.id);

        // Sales within scope for those machines
        let sRes:any = { data: [] };
        if (ids.length) {
          sRes = await supabase
            .from("sales")
            .select("machine_id, qty, unit_price_cents, unit_cost_cents, occurred_at")
            .in("machine_id", ids)
            .gte("occurred_at", scope.startISO)
            .lte("occurred_at", scope.endISO)
            .limit(500000);
          if (sRes.error) throw sRes.error;
        }
        setSales(sRes.data || []);

        // Settlements overlapping scope (if period touches the scope window)
        const st = await supabase
          .from("processor_settlements")
          .select("*")
          .lte("period_start", scope.endISO.slice(0,10))
          .gte("period_end", scope.startISO.slice(0,10))
          .limit(100000);
        if (st.error) throw st.error;
        setSettlements(st.data || []);

      } catch (e:any) {
        setErr(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [scope.startISO, scope.endISO, scope.locationId]);

  // Calculated fees by processor for scoped sales
  const calcByProcessor = useMemo(() => {
    // build machine -> processor map
    const procByMachine = new Map<string,string>();
    for (const row of mapping) procByMachine.set(String(row.machine_id), String(row.processor_id));

    // Group sales by processor and calculate totals manually
    const byProc: Record<string, {gross:number, fees:number, net:number}> = {};
    for (const s of (sales || [])) {
      const mid = String(s.machine_id);
      const pid = procByMachine.get(mid) || "__unmapped__";
      const qty = Number(s.qty)||0;
      const unitPrice = Number(s.unit_price_cents)||0;
      const unitCost = Number(s.unit_cost_cents)||0;
      
      const grossCents = unitPrice * qty;
      const cogsCents = unitCost * qty;
      const feeCents = feeFor(mid, unitPrice, qty);
      
      const gross = grossCents / 100;
      const fees = feeCents / 100;
      const net = (grossCents - feeCents) / 100; // Net is gross - fees (not including COGS for reconciliation)

      if (!byProc[pid]) byProc[pid] = {gross:0, fees:0, net:0};
      byProc[pid].gross += gross;
      byProc[pid].fees  += fees;
      byProc[pid].net   += net;
    }
    return byProc;
  }, [sales, mapping, feeFor]);

  // Settlements summed by processor (for the overlapping scope)
  const stmtByProcessor = useMemo(() => {
    const out: Record<string, {gross:number, fees:number, net:number, items:any[]}> = {};
    for (const st of settlements || []) {
      const pid = String(st.processor_id);
      if (!out[pid]) out[pid] = { gross:0, fees:0, net:0, items:[] };
      out[pid].gross += (Number(st.gross_cents)||0)/100;
      out[pid].fees  += (Number(st.fees_cents)||0)/100;
      out[pid].net   += (Number(st.net_cents)||0)/100;
      out[pid].items.push(st);
    }
    return out;
  }, [settlements]);

  const rows = useMemo(() => {
    const nameById = new Map<string,string>();
    for (const p of processors || []) nameById.set(String(p.id), p.name || String(p.id));

    const ids = new Set<string>([
      ...Object.keys(calcByProcessor || {}),
      ...Object.keys(stmtByProcessor || {}),
    ]);

    const out: Array<{
      processor_id: string;
      processor_name: string;
      calc_gross: number;
      calc_fees: number;
      calc_net: number;
      stmt_gross: number;
      stmt_fees: number;
      stmt_net: number;
      var_fees: number;
      var_net: number;
      count_sales: number;
      count_settlements: number;
    }> = [];

    // quick sale counts per processor (for context)
    const procByMachine = new Map<string,string>();
    for (const row of mapping) procByMachine.set(String(row.machine_id), String(row.processor_id));
    const saleCountByProc = new Map<string, number>();
    for (const s of (sales||[])) {
      const pid = procByMachine.get(String(s.machine_id)) || "__unmapped__";
      saleCountByProc.set(pid, (saleCountByProc.get(pid)||0)+1);
    }

    for (const pid of ids) {
      const calc = calcByProcessor[pid] || { gross:0, fees:0, net:0 };
      const stmt = stmtByProcessor[pid] || { gross:0, fees:0, net:0, items:[] };
      out.push({
        processor_id: pid,
        processor_name: pid === "__unmapped__" ? "(Unmapped machines)" : (nameById.get(pid) || pid),
        calc_gross: calc.gross,
        calc_fees: calc.fees,
        calc_net: calc.net,
        stmt_gross: stmt.gross,
        stmt_fees: stmt.fees,
        stmt_net: stmt.net,
        var_fees: calc.fees - stmt.fees,
        var_net:  calc.net  - stmt.net,
        count_sales: saleCountByProc.get(pid)||0,
        count_settlements: (stmt.items||[]).length,
      });
    }

    // sort by absolute variance in fees (largest discrepancy first)
    out.sort((a,b)=> Math.abs(b.var_fees) - Math.abs(a.var_fees));
    return out;
  }, [processors, calcByProcessor, stmtByProcessor, mapping, sales]);

  const totals = useMemo(() => rows.reduce((acc,r)=>({
    calc_gross: acc.calc_gross + r.calc_gross,
    calc_fees:  acc.calc_fees  + r.calc_fees,
    calc_net:   acc.calc_net   + r.calc_net,
    stmt_gross: acc.stmt_gross + r.stmt_gross,
    stmt_fees:  acc.stmt_fees  + r.stmt_fees,
    stmt_net:   acc.stmt_net   + r.stmt_net,
    var_fees:   acc.var_fees   + r.var_fees,
    var_net:    acc.var_net    + r.var_net,
  }), { calc_gross:0, calc_fees:0, calc_net:0, stmt_gross:0, stmt_fees:0, stmt_net:0, var_fees:0, var_net:0 }), [rows]);

  async function submitSettlement() {
    if (!form.processor_id || !form.period_start || !form.period_end) return alert("Choose processor and period.");
    const gross_cents = Math.round((Number(form.gross||0))*100);
    const fees_cents  = Math.round((Number(form.fees||0))*100);
    const net_cents   = Math.round((Number(form.net|| (Number(form.gross||0) - Number(form.fees||0))))*100);
    // Get current org for insert
    const { data: profile } = await supabase.from("profiles").select("org_id").single();
    if (!profile?.org_id) {
      alert("Could not determine organization");
      return;
    }
    
    const { error } = await supabase.from("processor_settlements").insert([{
      org_id: profile.org_id,
      processor_id: form.processor_id,
      period_start: form.period_start,
      period_end:   form.period_end,
      gross_cents, fees_cents, net_cents,
      payout_date: form.payout_date || null,
      reference: form.reference || null,
      notes: form.notes || null,
    }]);
    if (error) { alert(error.message); return; }
    setForm({});
    setOpenForm(false);
    // reload settlements
    const st = await supabase
      .from("processor_settlements")
      .select("*")
      .lte("period_start", scope.endISO.slice(0,10))
      .gte("period_end", scope.startISO.slice(0,10))
      .limit(100000);
    if (!st.error) setSettlements(st.data || []);
  }

  function exportCSV() {
    const headers = ["Processor","Calc Gross","Calc Fees","Calc Net","Stmt Gross","Stmt Fees","Stmt Net","Var Fees","Var Net","Scope"];
    const lines = [headers.join(",")];
    for (const r of rows) {
      lines.push([
        csvCell(r.processor_name),
        r.calc_gross.toFixed(2),
        r.calc_fees.toFixed(2),
        r.calc_net.toFixed(2),
        r.stmt_gross.toFixed(2),
        r.stmt_fees.toFixed(2),
        r.stmt_net.toFixed(2),
        r.var_fees.toFixed(2),
        r.var_net.toFixed(2),
        csvCell(scope.label),
      ].join(","));
    }
    lines.push(["TOTALS",
      totals.calc_gross.toFixed(2),
      totals.calc_fees.toFixed(2),
      totals.calc_net.toFixed(2),
      totals.stmt_gross.toFixed(2),
      totals.stmt_fees.toFixed(2),
      totals.stmt_net.toFixed(2),
      totals.var_fees.toFixed(2),
      totals.var_net.toFixed(2),
      csvCell(scope.label)
    ].join(","));
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `processor_reconciliation_${scope.label.replace(/\s+/g,"_").toLowerCase()}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  if (loading || feeLoading) return <div className="p-6 text-sm text-muted-foreground">Reconciling…</div>;
  if (err) return <div className="p-6 text-sm text-destructive">Error: {err}</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Scale className="h-5 w-5" />
          Processor Reconciliation — <span className="text-base text-muted-foreground">{scope.label}</span>
        </h1>
        <div className="flex gap-2">
          <button onClick={()=>window.location.reload()} className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button onClick={exportCSV} className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted">
            <Download className="h-4 w-4" /> CSV
          </button>
          <button onClick={()=>setOpenForm(v=>!v)} className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted">
            <Plus className="h-4 w-4" /> Add Settlement
          </button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground flex items-start gap-2">
        <Info className="h-4 w-4 mt-0.5" />
        <span>
          Calculated fees use your fee rules per processor (from <b>Finance → Payment Processors</b>) and machine mappings. Enter statement totals to compare.
          {scope.locationId ? " Only sales from machines at the selected location are included." : ""}
        </span>
      </div>

      {openForm && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm font-medium mb-2">Add Settlement</div>
          <div className="grid gap-2 md:grid-cols-3">
            <select className="bg-background border border-border rounded-md px-2 py-1 text-sm"
              value={form.processor_id || ""} onChange={e=>setForm({...form, processor_id:e.target.value})}>
              <option value="">Select processor…</option>
              {processors.map(p => <option key={p.id} value={p.id}>{p.name || p.id}</option>)}
            </select>
            <input type="date" className="bg-background border border-border rounded-md px-2 py-1 text-sm"
              value={form.period_start || ""} onChange={e=>setForm({...form, period_start:e.target.value})} />
            <input type="date" className="bg-background border border-border rounded-md px-2 py-1 text-sm"
              value={form.period_end || ""} onChange={e=>setForm({...form, period_end:e.target.value})} />
            <input placeholder="Gross ($)" className="bg-background border border-border rounded-md px-2 py-1 text-sm"
              value={form.gross || ""} onChange={e=>setForm({...form, gross:e.target.value})} />
            <input placeholder="Fees ($)" className="bg-background border border-border rounded-md px-2 py-1 text-sm"
              value={form.fees || ""} onChange={e=>setForm({...form, fees:e.target.value})} />
            <input placeholder="Net ($)" className="bg-background border border-border rounded-md px-2 py-1 text-sm"
              value={form.net || ""} onChange={e=>setForm({...form, net:e.target.value})} />
            <input type="date" placeholder="Payout date" className="bg-background border border-border rounded-md px-2 py-1 text-sm"
              value={form.payout_date || ""} onChange={e=>setForm({...form, payout_date:e.target.value})} />
            <input placeholder="Reference / URL" className="bg-background border border-border rounded-md px-2 py-1 text-sm"
              value={form.reference || ""} onChange={e=>setForm({...form, reference:e.target.value})} />
            <input placeholder="Notes" className="bg-background border border-border rounded-md px-2 py-1 text-sm md:col-span-3"
              value={form.notes || ""} onChange={e=>setForm({...form, notes:e.target.value})} />
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={submitSettlement} className="rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted">Save</button>
            <button onClick={()=>setOpenForm(false)} className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:underline">Cancel</button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <Th>Processor</Th>
              <Th className="text-right">Calc Gross</Th>
              <Th className="text-right">Calc Fees</Th>
              <Th className="text-right">Calc Net</Th>
              <Th className="text-right">Stmt Gross</Th>
              <Th className="text-right">Stmt Fees</Th>
              <Th className="text-right">Stmt Net</Th>
              <Th className="text-right">Var Fees</Th>
              <Th className="text-right">Var Net</Th>
              <Th className="text-right"># Sales</Th>
              <Th className="text-right"># Settles</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map(r => {
              const warn = Math.abs(r.var_fees) > 1e-2; // > $0.01 variance
              return (
                <tr key={r.processor_id} className="odd:bg-card/50">
                  <Td>{r.processor_name}</Td>
                  <Td className="text-right">{money(r.calc_gross)}</Td>
                  <Td className="text-right">{money(r.calc_fees)}</Td>
                  <Td className="text-right">{money(r.calc_net)}</Td>
                  <Td className="text-right">{money(r.stmt_gross)}</Td>
                  <Td className={`text-right ${warn ? "text-amber-600 dark:text-amber-400 font-medium":""}`}>{money(r.stmt_fees)}</Td>
                  <Td className="text-right">{money(r.stmt_net)}</Td>
                  <Td className={`text-right ${warn ? "text-destructive font-semibold":""}`}>{money(r.var_fees)}</Td>
                  <Td className="text-right">{money(r.var_net)}</Td>
                  <Td className="text-right">{r.count_sales}</Td>
                  <Td className="text-right">{r.count_settlements}</Td>
                </tr>
              );
            }) : (
              <tr><Td colSpan={11}><div className="py-6 text-center text-muted-foreground">No card activity in this scope.</div></Td></tr>
            )}
          </tbody>
          <tfoot>
            <tr className="bg-muted/50">
              <Td className="font-medium">Totals</Td>
              <Td className="text-right font-medium">{money(totals.calc_gross)}</Td>
              <Td className="text-right font-medium">{money(totals.calc_fees)}</Td>
              <Td className="text-right font-medium">{money(totals.calc_net)}</Td>
              <Td className="text-right font-medium">{money(totals.stmt_gross)}</Td>
              <Td className="text-right font-medium">{money(totals.stmt_fees)}</Td>
              <Td className="text-right font-medium">{money(totals.stmt_net)}</Td>
              <Td className={`text-right font-semibold ${Math.abs(totals.var_fees)>1e-2?"text-destructive":""}`}>{money(totals.var_fees)}</Td>
              <Td className="text-right font-semibold">{money(totals.var_net)}</Td>
              <Td className="text-right">—</Td>
              <Td className="text-right">—</Td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2 text-left ${className}`}>{children}</th>;
}
function Td({ children, className = "", colSpan }: { children: React.ReactNode; className?: string; colSpan?: number }) {
  return <td className={`px-3 py-2 ${className}`} colSpan={colSpan}>{children}</td>;
}