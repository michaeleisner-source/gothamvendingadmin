import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useFeeRuleCache, aggregateWithFees, money, pct } from "@/utils/fees";
import { RefreshCw, BarChart3, Info } from "lucide-react";

/**
 * Product Profitability (Net) — last 30 days
 * - Aggregates sales by product across all machines
 * - Applies each machine's latest processor fee rule (if mapped)
 * - Shows Gross, COGS, Fees (est), Net, Margin %, Net Margin %
 * - Handles missing optional columns (sku, category) gracefully
 */

type SaleRow = {
  machine_id: string;
  product_id: string;
  qty: number;
  unit_price_cents: number;
  unit_cost_cents: number;
  occurred_at: string;
};

type ProductRow = {
  id: string;
  name: string | null;
  sku?: string | null;
  category?: string | null;
};

type ProductAgg = {
  product_id: string;
  name: string;
  sku?: string | null;
  category?: string | null;
  units: number;
  avg_price: number; // $
  avg_cost: number;  // $
  gross: number;     // $
  cogs: number;      // $
  fees: number;      // $
  net: number;       // $
  margin_pct: number;
  net_margin_pct: number;
};

const fmt = (n: number) => money(Number.isFinite(n) ? n : 0);

export default function ProductProfitabilityNet() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SaleRow[]>([]);
  const [products, setProducts] = useState<Record<string, ProductRow>>({});
  const [error, setError] = useState<string | null>(null);
  const sinceISO = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString();
  }, []);
  const { feeFor, loading: feeLoading, error: feeError } = useFeeRuleCache();

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // 1) sales rows (last 30d)
        const s = await supabase
          .from("sales")
          .select("machine_id,product_id,qty,unit_price_cents,unit_cost_cents,occurred_at")
          .gte("occurred_at", sinceISO)
          .limit(50000);
        if (s.error) throw s.error;
        setRows((s.data || []) as SaleRow[]);

        // 2) products lookup (select all to avoid missing-column errors)
        const p = await supabase.from("products").select("*").limit(10000);
        if (p.error) throw p.error;
        const map: Record<string, ProductRow> = {};
        (p.data || []).forEach((r: any) => { map[r.id] = r as ProductRow; });
        setProducts(map);
      } catch (e: any) {
        setError(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [sinceISO]);

  const aggs = useMemo<ProductAgg[]>(() => {
    if (!rows.length) return [];
    // group sales by product
    const byProd = new Map<string, SaleRow[]>();
    for (const r of rows) {
      if (!r.product_id) continue;
      if (!byProd.has(r.product_id)) byProd.set(r.product_id, []);
      byProd.get(r.product_id)!.push(r);
    }

    const out: ProductAgg[] = [];
    for (const [pid, list] of byProd.entries()) {
      // totals for weighted averages
      let units = 0;
      let priceCentsTotal = 0;
      let costCentsTotal = 0;

      for (const r of list) {
        const q = Number(r.qty) || 0;
        units += q;
        priceCentsTotal += q * (Number(r.unit_price_cents) || 0);
        costCentsTotal  += q * (Number(r.unit_cost_cents) || 0);
      }

      const { gross, cogs, fees, net, margin_pct, net_margin_pct } =
        aggregateWithFees(
          list.map((r) => ({
            machine_id: r.machine_id,
            qty: Number(r.qty) || 0,
            unit_price_cents: Number(r.unit_price_cents) || 0,
            unit_cost_cents: Number(r.unit_cost_cents) || 0,
          })),
          feeFor
        );

      const avg_price = units > 0 ? (priceCentsTotal / 100) / units : 0;
      const avg_cost  = units > 0 ? (costCentsTotal  / 100) / units : 0;

      const p = products[pid];
      out.push({
        product_id: pid,
        name: p?.name || pid,
        sku: "sku" in (p || {}) ? p?.sku ?? null : null,
        category: "category" in (p || {}) ? p?.category ?? null : null,
        units,
        avg_price,
        avg_cost,
        gross,
        cogs,
        fees,
        net,
        margin_pct,
        net_margin_pct,
      });
    }

    // sort by net desc
    out.sort((a, b) => b.net - a.net);
    return out;
  }, [rows, products, feeFor]);

  if (loading || feeLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Loading data… (sales, products{feeLoading ? ", fee rules" : ""})
      </div>
    );
  }

  if (error || feeError) {
    return (
      <div className="p-6">
        <div className="text-sm text-rose-400">
          {(error || feeError) ?? "Unknown error"}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Product Profitability — Net (Last 30 Days)
        </h1>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="text-xs text-muted-foreground flex items-start gap-2">
        <Info className="h-4 w-4 mt-0.5" />
        <span>
          Fees are estimated from your latest processor fee rule per machine. If a product sells
          across multiple machines, rules are applied per-machine then aggregated. Cash sales (if
          tracked) will show lower fee impact when you add a tender column and set cash on those rows.
        </span>
      </div>

      <div className="rounded-xl border border-border overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <Th>Product</Th>
              <Th>SKU</Th>
              <Th>Category</Th>
              <Th className="text-right">Units</Th>
              <Th className="text-right">Avg Price</Th>
              <Th className="text-right">Avg Cost</Th>
              <Th className="text-right">Gross</Th>
              <Th className="text-right">COGS</Th>
              <Th className="text-right">Fees (est.)</Th>
              <Th className="text-right">Net</Th>
              <Th className="text-right">Margin %</Th>
              <Th className="text-right">Net Margin %</Th>
              <Th>Performance</Th>
            </tr>
          </thead>
          <tbody>
            {aggs.length ? aggs.map((r) => (
              <tr key={r.product_id} className="odd:bg-card/50">
                <Td>{r.name}</Td>
                <Td>{r.sku ?? "—"}</Td>
                <Td>{r.category ?? "—"}</Td>
                <Td className="text-right">{r.units}</Td>
                <Td className="text-right">{fmt(r.avg_price)}</Td>
                <Td className="text-right">{fmt(r.avg_cost)}</Td>
                <Td className="text-right">{fmt(r.gross)}</Td>
                <Td className="text-right">{fmt(r.cogs)}</Td>
                <Td className="text-right">{fmt(r.fees)}</Td>
                <Td className="text-right">{fmt(r.net)}</Td>
                <Td className="text-right">{pct(r.margin_pct)}</Td>
                <Td className="text-right">{pct(r.net_margin_pct)}</Td>
                <Td>{perfBadge(r.net_margin_pct)}</Td>
              </tr>
            )) : (
              <tr>
                <Td colSpan={13}>
                  <div className="py-6 text-center text-muted-foreground">
                    No sales in the last 30 days.
                  </div>
                </Td>
              </tr>
            )}
          </tbody>
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

function perfBadge(netMarginPct: number) {
  const n = Number.isFinite(netMarginPct) ? netMarginPct : 0;
  if (n >= 45) return <span className="inline-flex items-center rounded-full bg-emerald-500/15 text-emerald-400 px-2 py-0.5 text-xs">Excellent</span>;
  if (n >= 30) return <span className="inline-flex items-center rounded-full bg-sky-500/15 text-sky-400 px-2 py-0.5 text-xs">Good</span>;
  if (n >= 20) return <span className="inline-flex items-center rounded-full bg-amber-500/15 text-amber-400 px-2 py-0.5 text-xs">OK</span>;
  return <span className="inline-flex items-center rounded-full bg-rose-500/15 text-rose-400 px-2 py-0.5 text-xs">Review</span>;
}