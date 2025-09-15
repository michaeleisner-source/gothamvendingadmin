import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useFeeRuleCache, aggregateWithFees, money, pct } from "@/utils/fees";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, BarChart3, Info, Package, TrendingUp, DollarSign, Activity } from "lucide-react";
import { HelpTooltip } from "@/components/ui/HelpTooltip";

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

  // Calculate KPI metrics
  const kpiMetrics = useMemo(() => {
    const totalProducts = aggs.length;
    const totalUnits = aggs.reduce((sum, p) => sum + p.units, 0);
    const totalGross = aggs.reduce((sum, p) => sum + p.gross, 0);
    const totalNet = aggs.reduce((sum, p) => sum + p.net, 0);
    const totalFees = aggs.reduce((sum, p) => sum + p.fees, 0);
    const avgNetMargin = totalGross > 0 ? (totalNet / totalGross) * 100 : 0;
    const topPerformers = aggs.filter(p => p.net_margin_pct >= 45).length;

    return {
      totalProducts,
      totalUnits,
      totalGross,
      totalNet,
      totalFees,
      avgNetMargin,
      topPerformers
    };
  }, [aggs]);

  if (loading || feeLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">Loading Product Profitability...</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || feeError) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Error Loading Data</h1>
        <div className="text-sm text-rose-400">
          {(error || feeError) ?? "Unknown error"}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              Product Profitability (Net)
              <HelpTooltip 
                content="Shows net profit for each product after deducting costs of goods sold (COGS), payment processing fees, and other expenses. Based on last 30 days of sales data."
                size="md"
              />
            </h1>
            <p className="text-muted-foreground">Detailed profit analysis for the last 30 days</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  Products Sold
                  <HelpTooltip content="Number of unique products that generated sales in the last 30 days" size="sm" />
                </p>
                <p className="text-2xl font-bold">{kpiMetrics.totalProducts}</p>
                <p className="text-xs text-blue-600">Active SKUs</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 flex items-center gap-2">
                  Net Revenue
                  <HelpTooltip content="Total revenue after deducting COGS, payment processing fees, and other expenses" size="sm" />
                </p>
                <p className="text-2xl font-bold text-green-800">{fmt(kpiMetrics.totalNet)}</p>
                <p className="text-xs text-green-600">After fees & costs</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  Avg Net Margin
                  <HelpTooltip content="Average net profit margin across all products. Calculated as (Net Profit ÷ Gross Revenue) × 100" size="sm" />
                </p>
                <p className="text-2xl font-bold">{kpiMetrics.avgNetMargin.toFixed(1)}%</p>
                <p className="text-xs text-purple-600">Profitability</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Top Performers</p>
                <p className="text-2xl font-bold">{kpiMetrics.topPerformers}</p>
                <p className="text-xs text-orange-600">≥45% net margin</p>
              </div>
              <Activity className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Financial Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-6 text-center">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-blue-600">{fmt(kpiMetrics.totalGross)}</div>
              <p className="text-sm text-muted-foreground">Gross Revenue</p>
              <p className="text-xs text-blue-600">Total sales value</p>
            </div>
            
            <div className="space-y-2">
              <div className="text-2xl font-bold text-red-600">{fmt(kpiMetrics.totalFees)}</div>
              <p className="text-sm text-muted-foreground">Processing Fees</p>
              <p className="text-xs text-red-600">Payment processor costs</p>
            </div>
            
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-600">{fmt(kpiMetrics.totalNet)}</div>
              <p className="text-sm text-muted-foreground">Net Profit</p>
              <p className="text-xs text-green-600">After all costs</p>
            </div>

            <div className="space-y-2">
              <div className="text-2xl font-bold text-purple-600">{kpiMetrics.totalUnits.toLocaleString()}</div>
              <p className="text-sm text-muted-foreground">Units Sold</p>
              <p className="text-xs text-purple-600">Total quantity</p>
            </div>
          </div>

          {kpiMetrics.avgNetMargin < 20 && kpiMetrics.totalGross > 0 && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 text-orange-700">
                <TrendingUp className="w-4 h-4" />
                <span className="font-medium">Low margin alert</span>
              </div>
              <p className="text-sm text-orange-600 mt-1">
                Average net margin is below 20%. Consider reviewing pricing or reducing costs.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-2 text-blue-700">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span className="text-sm">
              Fees are estimated from your latest processor fee rule per machine. If a product sells
              across multiple machines, rules are applied per-machine then aggregated. Cash sales (if
              tracked) will show lower fee impact when you add a tender column and set cash on those rows.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Product Profitability Table */}
      {aggs.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No product sales</h3>
            <p className="text-muted-foreground">No product sales recorded in the last 30 days.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Product Performance ({aggs.length} products)</CardTitle>
          </CardHeader>
          <CardContent>
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
                  {aggs.map((r) => (
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
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
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