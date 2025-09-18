import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { HelpTooltip } from "@/components/ui/HelpTooltip";

// ---- tiny utils ----
function cents(n?: number | null) {
  const v = typeof n === "number" ? n : 0;
  return (v / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function downloadCSV(filename: string, rows: Array<Record<string, any>>) {
  if (!rows?.length) return;
  const headers = Object.keys(rows[0]);
  const esc = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.setAttribute("download", filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function toISOAtMidnightLocal(d: string) {
  return new Date(d + "T00:00:00").toISOString();
}

function toISOEndOfDayLocal(d: string) {
  return new Date(d + "T23:59:59.999").toISOString();
}

// ---- Date range picker ----
function DateRange({
  start,
  end,
  setStart,
  setEnd,
  onRefresh,
}: {
  start: string;
  end: string;
  setStart: (s: string) => void;
  setEnd: (s: string) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
      <div className="flex flex-col space-y-1">
        <label className="text-sm font-medium text-muted-foreground">Start Date</label>
        <Input 
          type="date" 
          value={start} 
          onChange={(e) => setStart(e.target.value)}
          className="w-auto"
        />
      </div>
      <div className="flex flex-col space-y-1">
        <label className="text-sm font-medium text-muted-foreground">End Date</label>
        <Input 
          type="date" 
          value={end} 
          onChange={(e) => setEnd(e.target.value)}
          className="w-auto"
        />
      </div>
      <Button onClick={onRefresh}>Refresh</Button>
    </div>
  );
}

type RevPerMachine = {
  machine_id: string;
  machine_name: string | null;
  orders: number;
  qty_sold: number;
  gross_revenue_cents: number;
  cost_cents: number;
  net_profit_cents: number;
  profit_pct: number;
};
type RevPerProduct = {
  product_id: string;
  product_name: string | null;
  orders: number;
  qty_sold: number;
  gross_revenue_cents: number;
};
type ProfitPerMachine = {
  machine_id: string;
  machine_name: string | null;
  gross_revenue_cents: number;
  cost_cents: number;
  net_profit_cents: number;
  profit_pct: number;
};
type KPI = {
  gross_revenue_cents: number;
  cost_cents: number;
  net_profit_cents: number;
  profit_pct: number;
};
type OrdersPerDay = { day: string; orders: number };
type QtyPerDay = { day: string; qty_sold: number };
type QtyPerMonth = { month: string; qty_sold: number };
type PurchaseOrder = {
  po_id: string;
  created_at: string;
  status: string;
  supplier_id: string;
  supplier_name: string | null;
  total_amount: number;
};

// ---- Main page ----
const Reports = () => {
  // default to last 30 days
  const today = new Date();
  const dEnd = today.toISOString().slice(0, 10);
  const dStart = new Date(today.getTime() - 29 * 86400000).toISOString().slice(0, 10);

  const [start, setStart] = useState<string>(dStart);
  const [end, setEnd] = useState<string>(dEnd);
  const [loading, setLoading] = useState(false);

  const [kpis, setKpis] = useState<KPI | null>(null);
  const [revMachine, setRevMachine] = useState<RevPerMachine[]>([]);
  const [revProduct, setRevProduct] = useState<RevPerProduct[]>([]);
  const [profitMachine, setProfitMachine] = useState<ProfitPerMachine[]>([]);
  const [ordersDay, setOrdersDay] = useState<OrdersPerDay[]>([]);
  const [qtyDay, setQtyDay] = useState<QtyPerDay[]>([]);
  const [qtyMonth, setQtyMonth] = useState<QtyPerMonth[]>([]);
  const [openPOs, setOpenPOs] = useState<PurchaseOrder[]>([]);
  const [allPOs, setAllPOs] = useState<PurchaseOrder[]>([]);

  async function loadAll() {
    setLoading(true);
    try {
      const p_start = toISOAtMidnightLocal(start);
      const p_end = toISOEndOfDayLocal(end);

      const [
        kpiRes,
        revMRes,
        revPRes,
        profMRes,
        ordDayRes,
        qtyDayRes,
        qtyMonRes,
        openPORes,
        allPORes,
      ] = await Promise.all([
        supabase.rpc("report_financial_kpis", { p_start, p_end }),
        supabase.rpc("report_revenue_per_machine", { p_start, p_end }),
        supabase.rpc("report_revenue_per_product", { p_start, p_end }),
        supabase.rpc("report_profit_per_machine", { p_start, p_end }),
        supabase.rpc("report_orders_per_day", { p_start, p_end }),
        supabase.rpc("report_products_sold_per_day", { p_start, p_end }),
        supabase.rpc("report_products_sold_per_month", { p_start, p_end }),
        supabase.rpc("report_purchase_orders", { p_status: 'OPEN', p_days: 365 }),
        supabase.rpc("report_purchase_orders", { p_status: null, p_days: 90 }),
      ]);

      if (kpiRes.error) throw kpiRes.error;
      if (revMRes.error) throw revMRes.error;
      if (revPRes.error) throw revPRes.error;
      if (profMRes.error) throw profMRes.error;
      if (ordDayRes.error) throw ordDayRes.error;
      if (qtyDayRes.error) throw qtyDayRes.error;
      if (qtyMonRes.error) throw qtyMonRes.error;
      if (openPORes.error) throw openPORes.error;
      if (allPORes.error) throw allPORes.error;

      setKpis(Array.isArray(kpiRes.data) ? (kpiRes.data[0] as KPI) : (kpiRes.data as KPI));
      setRevMachine(revMRes.data || []);
      setRevProduct(revPRes.data || []);
      setProfitMachine(profMRes.data || []);
      setOrdersDay(ordDayRes.data || []);
      setQtyDay(qtyDayRes.data || []);
      setQtyMonth(qtyMonRes.data || []);
      setOpenPOs(openPORes.data || []);
      setAllPOs(allPORes.data || []);
    } catch (e: any) {
      console.error("Failed to load reports:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onExportKPIs = () => {
    if (!kpis) return;
    downloadCSV("financial_kpis.csv", [
      {
        gross_revenue: cents(kpis.gross_revenue_cents),
        cost: cents(kpis.cost_cents),
        net_profit: cents(kpis.net_profit_cents),
        profit_pct: kpis.profit_pct,
        start,
        end,
      },
    ]);
  };

  const onExportRevMachine = () => {
    downloadCSV(
      "revenue_per_machine.csv",
      revMachine.map((r) => ({
        machine: r.machine_name || r.machine_id,
        orders: r.orders,
        qty_sold: r.qty_sold,
        gross_revenue: cents(r.gross_revenue_cents),
        cost: cents(r.cost_cents),
        net_profit: cents(r.net_profit_cents),
        profit_pct: r.profit_pct,
      }))
    );
  };

  const onExportRevProduct = () => {
    downloadCSV(
      "revenue_per_product.csv",
      revProduct.map((r) => ({
        product: r.product_name || r.product_id,
        orders: r.orders,
        qty_sold: r.qty_sold,
        gross_revenue: cents(r.gross_revenue_cents),
      }))
    );
  };

  const onExportProfitMachine = () => {
    downloadCSV(
      "profit_per_machine.csv",
      profitMachine.map((r) => ({
        machine: r.machine_name || r.machine_id,
        gross_revenue: cents(r.gross_revenue_cents),
        cost: cents(r.cost_cents),
        net_profit: cents(r.net_profit_cents),
        profit_pct: r.profit_pct,
      }))
    );
  };

  const onExportOrdersDay = () => {
    downloadCSV(
      "orders_per_day.csv",
      ordersDay.map((r) => ({ day: r.day, orders: r.orders }))
    );
  };

  const onExportQtyDay = () => {
    downloadCSV(
      "products_sold_per_day.csv",
      qtyDay.map((r) => ({ day: r.day, qty_sold: r.qty_sold }))
    );
  };

  const onExportQtyMonth = () => {
    downloadCSV(
      "products_sold_per_month.csv",
      qtyMonth.map((r) => ({ month: r.month, qty_sold: r.qty_sold }))
    );
  };

  const onExportOpenPOs = () => {
    downloadCSV(
      "open_purchase_orders.csv",
      openPOs.map((r) => ({
        po_id: r.po_id,
        created_at: new Date(r.created_at).toLocaleDateString(),
        status: r.status,
        supplier: r.supplier_name || r.supplier_id,
        total_amount: cents(r.total_amount * 100), // Convert to cents for formatting
      }))
    );
  };

  const onExportAllPOs = () => {
    downloadCSV(
      "purchase_order_history.csv",
      allPOs.map((r) => ({
        po_id: r.po_id,
        created_at: new Date(r.created_at).toLocaleDateString(),
        status: r.status,
        supplier: r.supplier_name || r.supplier_id,
        total_amount: cents(r.total_amount * 100), // Convert to cents for formatting
      }))
    );
  };

  const refresh = () => loadAll();

  return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">Reports & Analytics</h1>
            <HelpTooltip content="View comprehensive business reports including financial KPIs, revenue analysis by machine and product, profit margins, sales trends, and purchase order tracking. Use date filters to analyze specific time periods." />
          </div>
          <DateRange 
            start={start} 
            end={end} 
            setStart={setStart} 
            setEnd={setEnd} 
            onRefresh={refresh} 
          />
        </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading reports...</div>
        </div>
      )}

      {!loading && (
        <Tabs defaultValue="kpis" className="space-y-6">
          <TabsList className="grid grid-cols-3 md:grid-cols-9 w-full">
            <TabsTrigger value="kpis" className="flex items-center gap-1">
              KPIs
              <HelpTooltip content="Key Performance Indicators - Revenue, costs, profit margins, and overall financial health" size="sm" />
            </TabsTrigger>
            <TabsTrigger value="rev_machine" className="flex items-center gap-1">
              Revenue/Machine
              <HelpTooltip content="Revenue, costs, and profit analysis broken down by individual machines" size="sm" />
            </TabsTrigger>
            <TabsTrigger value="rev_product" className="flex items-center gap-1">
              Revenue/Product
              <HelpTooltip content="Revenue performance analysis by product showing sales volume and earnings" size="sm" />
            </TabsTrigger>
            <TabsTrigger value="profit_machine" className="flex items-center gap-1">
              Profit/Machine
              <HelpTooltip content="Detailed profit analysis showing which machines are most profitable" size="sm" />
            </TabsTrigger>
            <TabsTrigger value="orders_day" className="flex items-center gap-1">
              Orders/Day
              <HelpTooltip content="Daily transaction trends showing sales patterns over time" size="sm" />
            </TabsTrigger>
            <TabsTrigger value="qty_day" className="flex items-center gap-1">
              Sold/Day
              <HelpTooltip content="Daily product quantity trends showing volume patterns" size="sm" />
            </TabsTrigger>
            <TabsTrigger value="qty_month" className="flex items-center gap-1">
              Sold/Month
              <HelpTooltip content="Monthly product quantity trends showing long-term volume patterns" size="sm" />
            </TabsTrigger>
            <TabsTrigger value="open_pos" className="flex items-center gap-1">
              Open POs
              <HelpTooltip content="Current pending purchase orders that need attention or processing" size="sm" />
            </TabsTrigger>
            <TabsTrigger value="po_history" className="flex items-center gap-1">
              PO History
              <HelpTooltip content="Historical purchase order data showing procurement patterns and supplier performance" size="sm" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="kpis" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Financial KPIs</h2>
              <Button variant="outline" onClick={onExportKPIs}>Export CSV</Button>
            </div>
            {kpis && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Gross Revenue</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold text-primary">{cents(kpis.gross_revenue_cents)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Cost</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold text-destructive">{cents(kpis.cost_cents)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold text-emerald-600">{cents(kpis.net_profit_cents)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Profit Margin</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold">
                      <Badge variant={kpis.profit_pct >= 20 ? "default" : kpis.profit_pct >= 10 ? "secondary" : "destructive"}>
                        {(kpis.profit_pct ?? 0).toFixed(1)}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="rev_machine" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Revenue by Machine</h2>
              <Button variant="outline" onClick={onExportRevMachine}>Export CSV</Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="py-3 px-4 font-medium">Machine</th>
                        <th className="py-3 px-4 font-medium">Orders</th>
                        <th className="py-3 px-4 font-medium">Qty Sold</th>
                        <th className="py-3 px-4 font-medium">Gross Revenue</th>
                        <th className="py-3 px-4 font-medium">Cost</th>
                        <th className="py-3 px-4 font-medium">Net Profit</th>
                        <th className="py-3 px-4 font-medium">Margin %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revMachine.map((r) => (
                        <tr key={r.machine_id} className="border-b last:border-0">
                          <td className="py-3 px-4 font-medium">{r.machine_name || r.machine_id}</td>
                          <td className="py-3 px-4">{r.orders.toLocaleString()}</td>
                          <td className="py-3 px-4">{r.qty_sold.toLocaleString()}</td>
                          <td className="py-3 px-4 text-primary font-medium">{cents(r.gross_revenue_cents)}</td>
                          <td className="py-3 px-4 text-destructive">{cents(r.cost_cents)}</td>
                          <td className="py-3 px-4 text-emerald-600 font-medium">{cents(r.net_profit_cents)}</td>
                          <td className="py-3 px-4">
                            <Badge variant={r.profit_pct >= 20 ? "default" : r.profit_pct >= 10 ? "secondary" : "destructive"}>
                              {(r.profit_pct ?? 0).toFixed(1)}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rev_product" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Revenue by Product</h2>
              <Button variant="outline" onClick={onExportRevProduct}>Export CSV</Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="py-3 px-4 font-medium">Product</th>
                        <th className="py-3 px-4 font-medium">Orders</th>
                        <th className="py-3 px-4 font-medium">Qty Sold</th>
                        <th className="py-3 px-4 font-medium">Gross Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revProduct.map((r) => (
                        <tr key={r.product_id} className="border-b last:border-0">
                          <td className="py-3 px-4 font-medium">{r.product_name || r.product_id}</td>
                          <td className="py-3 px-4">{r.orders.toLocaleString()}</td>
                          <td className="py-3 px-4">{r.qty_sold.toLocaleString()}</td>
                          <td className="py-3 px-4 text-primary font-medium">{cents(r.gross_revenue_cents)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profit_machine" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Profit Analysis by Machine</h2>
              <Button variant="outline" onClick={onExportProfitMachine}>Export CSV</Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="py-3 px-4 font-medium">Machine</th>
                        <th className="py-3 px-4 font-medium">Gross Revenue</th>
                        <th className="py-3 px-4 font-medium">Cost</th>
                        <th className="py-3 px-4 font-medium">Net Profit</th>
                        <th className="py-3 px-4 font-medium">Margin %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profitMachine.map((r) => (
                        <tr key={r.machine_id} className="border-b last:border-0">
                          <td className="py-3 px-4 font-medium">{r.machine_name || r.machine_id}</td>
                          <td className="py-3 px-4 text-primary font-medium">{cents(r.gross_revenue_cents)}</td>
                          <td className="py-3 px-4 text-destructive">{cents(r.cost_cents)}</td>
                          <td className="py-3 px-4 text-emerald-600 font-medium">{cents(r.net_profit_cents)}</td>
                          <td className="py-3 px-4">
                            <Badge variant={r.profit_pct >= 20 ? "default" : r.profit_pct >= 10 ? "secondary" : "destructive"}>
                              {(r.profit_pct ?? 0).toFixed(1)}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders_day" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Daily Orders</h2>
              <Button variant="outline" onClick={onExportOrdersDay}>Export CSV</Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="py-3 px-4 font-medium">Date</th>
                        <th className="py-3 px-4 font-medium">Orders</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordersDay.map((r) => (
                        <tr key={r.day} className="border-b last:border-0">
                          <td className="py-3 px-4 font-medium">{r.day}</td>
                          <td className="py-3 px-4">{r.orders.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="qty_day" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Daily Product Sales</h2>
              <Button variant="outline" onClick={onExportQtyDay}>Export CSV</Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="py-3 px-4 font-medium">Date</th>
                        <th className="py-3 px-4 font-medium">Products Sold</th>
                      </tr>
                    </thead>
                    <tbody>
                      {qtyDay.map((r) => (
                        <tr key={r.day} className="border-b last:border-0">
                          <td className="py-3 px-4 font-medium">{r.day}</td>
                          <td className="py-3 px-4">{r.qty_sold.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="qty_month" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Monthly Product Sales</h2>
              <Button variant="outline" onClick={onExportQtyMonth}>Export CSV</Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="py-3 px-4 font-medium">Month</th>
                        <th className="py-3 px-4 font-medium">Products Sold</th>
                      </tr>
                    </thead>
                    <tbody>
                      {qtyMonth.map((r) => (
                        <tr key={r.month} className="border-b last:border-0">
                          <td className="py-3 px-4 font-medium">{r.month}</td>
                          <td className="py-3 px-4">{r.qty_sold.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="open_pos" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Open Purchase Orders</h2>
              <Button variant="outline" onClick={onExportOpenPOs}>Export CSV</Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="py-3 px-4 font-medium">PO ID</th>
                        <th className="py-3 px-4 font-medium">Created</th>
                        <th className="py-3 px-4 font-medium">Status</th>
                        <th className="py-3 px-4 font-medium">Supplier</th>
                        <th className="py-3 px-4 font-medium">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {openPOs.map((r) => (
                        <tr key={r.po_id} className="border-b last:border-0">
                          <td className="py-3 px-4 font-mono text-sm">
                            {r.po_id.slice(0, 8)}...
                          </td>
                          <td className="py-3 px-4">
                            {new Date(r.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={r.status === 'OPEN' ? 'default' : 'secondary'}>
                              {r.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">{r.supplier_name || r.supplier_id}</td>
                          <td className="py-3 px-4 font-medium text-primary">
                            {cents(r.total_amount * 100)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="po_history" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Purchase Order History (Last 90 Days)</h2>
              <Button variant="outline" onClick={onExportAllPOs}>Export CSV</Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="py-3 px-4 font-medium">PO ID</th>
                        <th className="py-3 px-4 font-medium">Created</th>
                        <th className="py-3 px-4 font-medium">Status</th>
                        <th className="py-3 px-4 font-medium">Supplier</th>
                        <th className="py-3 px-4 font-medium">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allPOs.map((r) => (
                        <tr key={r.po_id} className="border-b last:border-0">
                          <td className="py-3 px-4 font-mono text-sm">
                            {r.po_id.slice(0, 8)}...
                          </td>
                          <td className="py-3 px-4">
                            {new Date(r.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={
                              r.status === 'OPEN' ? 'default' : 
                              r.status === 'RECEIVED' ? 'secondary' : 
                              r.status === 'CANCELLED' ? 'destructive' : 'outline'
                            }>
                              {r.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">{r.supplier_name || r.supplier_id}</td>
                          <td className="py-3 px-4 font-medium text-primary">
                            {cents(r.total_amount * 100)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Reports;