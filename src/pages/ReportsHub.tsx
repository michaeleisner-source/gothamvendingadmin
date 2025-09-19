import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Package, 
  MapPin, 
  Calendar, 
  Download,
  FileBarChart,
  PieChart,
  LineChart,
  Activity,
  AlertTriangle,
  Users,
  Zap
} from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { HelpTooltip } from "@/components/ui/HelpTooltip";
import SalesAnalytics from '@/components/reports/SalesAnalytics';
import MachinePerformance from '@/components/reports/MachinePerformance';
import LocationAnalytics from '@/components/reports/LocationAnalytics';
import ProductProfitability from '@/components/reports/ProductProfitability';
import RevenueTrends from '@/components/reports/RevenueTrends';
import InventoryInsights from '@/components/reports/InventoryInsights';

// Utility functions from original Reports.tsx
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

// Date Range Component
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
      <Button onClick={onRefresh} className="btn-primary">
        Refresh Data
      </Button>
    </div>
  );
}

// Quick Report Cards Component
function QuickReportCards() {
  const reportCategories = [
    {
      title: "Sales Performance",
      description: "Revenue, transactions, and growth metrics",
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
      reports: ["Sales Analytics", "Revenue Trends", "Transaction Analysis"]
    },
    {
      title: "Operations Efficiency", 
      description: "Machine performance and operational KPIs",
      icon: Activity,
      color: "text-info",
      bgColor: "bg-info/10",
      reports: ["Machine Performance", "Maintenance Analytics", "Uptime Reports"]
    },
    {
      title: "Financial Overview",
      description: "Profit margins, costs, and financial health",
      icon: DollarSign,
      color: "text-revenue",
      bgColor: "bg-revenue/10", 
      reports: ["Profit Analysis", "Cost Breakdown", "Financial KPIs"]
    },
    {
      title: "Inventory Intelligence",
      description: "Stock levels, turnover, and optimization",
      icon: Package,
      color: "text-warning",
      bgColor: "bg-warning/10",
      reports: ["Stock Analytics", "Turnover Analysis", "Reorder Points"]
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {reportCategories.map((category) => (
        <Card key={category.title} className="card-hover cursor-pointer group">
          <CardHeader className="pb-3">
            <div className={`w-12 h-12 rounded-lg ${category.bgColor} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <category.icon className={`h-6 w-6 ${category.color}`} />
            </div>
            <CardTitle className="text-lg">{category.title}</CardTitle>
            <CardDescription className="text-sm">{category.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {category.reports.map((report) => (
                <div key={report} className="text-xs text-muted-foreground flex items-center">
                  <div className="w-1 h-1 bg-primary rounded-full mr-2" />
                  {report}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Legacy Report Data Component (preserving all original functionality)
function LegacyReports() {
  // Default to last 30 days
  const today = new Date();
  const dEnd = today.toISOString().slice(0, 10);
  const dStart = new Date(today.getTime() - 29 * 86400000).toISOString().slice(0, 10);

  const [start, setStart] = useState<string>(dStart);
  const [end, setEnd] = useState<string>(dEnd);
  const [loading, setLoading] = useState(false);
  const [kpis, setKpis] = useState<any>(null);
  const [revMachine, setRevMachine] = useState<any[]>([]);
  const [revProduct, setRevProduct] = useState<any[]>([]);

  async function loadAll() {
    setLoading(true);
    try {
      const p_start = toISOAtMidnightLocal(start);
      const p_end = toISOEndOfDayLocal(end);

      // Try to fetch financial KPIs (may not exist in all schemas)
      try {
        const kpiRes = await supabase.rpc("report_financial_kpis", { p_start, p_end });
        if (kpiRes.data && !kpiRes.error) {
          setKpis(Array.isArray(kpiRes.data) ? kpiRes.data[0] : kpiRes.data);
        }
      } catch (e) {
        console.log("Financial KPIs not available");
      }

      // Try to fetch other reports
      try {
        const [revMRes, revPRes] = await Promise.all([
          supabase.rpc("report_revenue_per_machine", { p_start, p_end }),
          supabase.rpc("report_revenue_per_product", { p_start, p_end }),
        ]);
        
        if (revMRes.data && !revMRes.error) setRevMachine(revMRes.data || []);
        if (revPRes.data && !revPRes.error) setRevProduct(revPRes.data || []);
      } catch (e) {
        console.log("Some reports not available");
      }
    } catch (e: any) {
      console.error("Failed to load reports:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, [start, end]);

  const refresh = () => loadAll();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-xl font-semibold">Financial Data & KPIs</h3>
          <p className="text-muted-foreground">Historical financial and operational data</p>
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
          <div className="text-muted-foreground flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            Loading financial data...
          </div>
        </div>
      )}

      {!loading && kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="gradient-revenue text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/90">Gross Revenue</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{cents(kpis.gross_revenue_cents)}</div>
            </CardContent>
          </Card>
          <Card className="gradient-expense text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/90">Total Cost</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{cents(kpis.cost_cents)}</div>
            </CardContent>
          </Card>
          <Card className="gradient-primary text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/90">Net Profit</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{cents(kpis.net_profit_cents)}</div>
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

      {!loading && revMachine.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Revenue by Machine
            </CardTitle>
            <CardDescription>Performance breakdown by individual machines</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/30">
                  <tr className="text-left">
                    <th className="py-3 px-4 font-medium">Machine</th>
                    <th className="py-3 px-4 font-medium">Orders</th>
                    <th className="py-3 px-4 font-medium">Qty Sold</th>
                    <th className="py-3 px-4 font-medium">Revenue</th>
                    <th className="py-3 px-4 font-medium">Profit</th>
                    <th className="py-3 px-4 font-medium">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {revMachine.slice(0, 10).map((r) => (
                    <tr key={r.machine_id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="py-3 px-4 font-medium">{r.machine_name || r.machine_id}</td>
                      <td className="py-3 px-4">{r.orders?.toLocaleString() || 0}</td>
                      <td className="py-3 px-4">{r.qty_sold?.toLocaleString() || 0}</td>
                      <td className="py-3 px-4 text-success font-medium">{cents(r.gross_revenue_cents)}</td>
                      <td className="py-3 px-4 text-profit font-medium">{cents(r.net_profit_cents)}</td>
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
      )}
    </div>
  );
}

export default function ReportsHub() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Reports Hub</h1>
            <p className="text-muted-foreground">
              Unified analytics and business intelligence center
            </p>
          </div>
          <HelpTooltip content="Access all your business reports, analytics, and data exports in one centralized location. Use the tabs to switch between different report categories." />
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export All Data
        </Button>
      </div>

      {/* Quick Access Cards */}
      <QuickReportCards />

      {/* Main Reports Interface */}
      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-7 h-auto p-1">
          <TabsTrigger value="analytics" className="flex items-center gap-2 text-xs lg:text-sm">
            <TrendingUp className="h-4 w-4" />
            Enhanced Analytics
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-2 text-xs lg:text-sm">
            <DollarSign className="h-4 w-4" />
            Sales
          </TabsTrigger>
          <TabsTrigger value="machines" className="flex items-center gap-2 text-xs lg:text-sm">
            <Zap className="h-4 w-4" />
            Machines
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex items-center gap-2 text-xs lg:text-sm">
            <MapPin className="h-4 w-4" />
            Locations
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2 text-xs lg:text-sm">
            <Package className="h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2 text-xs lg:text-sm">
            <Activity className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="legacy" className="flex items-center gap-2 text-xs lg:text-sm">
            <FileBarChart className="h-4 w-4" />
            Financial Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Enhanced Analytics Dashboard
              </CardTitle>
              <CardDescription>
                Advanced business intelligence with predictive insights and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                <SalesAnalytics />
                <RevenueTrends />
                {/* Additional enhanced analytics components would go here */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sales" className="space-y-6">
          <SalesAnalytics />
        </TabsContent>
        
        <TabsContent value="machines" className="space-y-6">
          <MachinePerformance />
        </TabsContent>
        
        <TabsContent value="locations" className="space-y-6">
          <LocationAnalytics />
        </TabsContent>
        
        <TabsContent value="products" className="space-y-6">
          <ProductProfitability />
        </TabsContent>
        
        <TabsContent value="inventory" className="space-y-6">
          <InventoryInsights />
        </TabsContent>

        <TabsContent value="legacy" className="space-y-6">
          <LegacyReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}