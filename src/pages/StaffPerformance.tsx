import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, Package, DollarSign, Target, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type StaffMember = {
  user_id: string | null;
  email: string | null;
  orders: number;
  qty_sold: number;
  gross_revenue_cents: number;
  cost_cents: number;
  net_profit_cents: number;
  profit_pct: number;
};

function formatCurrency(cents?: number | null) { 
  const value = typeof cents === "number" ? cents : 0; 
  return (value / 100).toLocaleString(undefined, { style: "currency", currency: "USD" }); 
}

function isoStart(dateStr: string) { 
  return new Date(dateStr + "T00:00:00").toISOString(); 
}

function isoEnd(dateStr: string) { 
  return new Date(dateStr + "T23:59:59.999").toISOString(); 
}

export default function StaffPerformance() {
  const today = new Date();
  const defaultEnd = today.toISOString().slice(0, 10);
  const defaultStart = new Date(today.getTime() - 29 * 86400000).toISOString().slice(0, 10);
  
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);
  const [staffData, setStaffData] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);

  const totals = staffData.reduce((acc, member) => ({
    orders: acc.orders + (member.orders || 0),
    quantity: acc.quantity + (member.qty_sold || 0),
    gross: acc.gross + (member.gross_revenue_cents || 0),
    cost: acc.cost + (member.cost_cents || 0),
    net: acc.net + (member.net_profit_cents || 0),
  }), { orders: 0, quantity: 0, gross: 0, cost: 0, net: 0 });

  const averageProfit = totals.gross > 0 ? ((totals.net / totals.gross) * 100) : 0;

  async function loadData() {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("report_staff_performance", { 
        p_start: isoStart(start), 
        p_end: isoEnd(end) 
      });
      
      if (error) {
        console.error("Error loading staff performance:", error);
        toast({
          title: "Error",
          description: "Failed to load staff performance data.",
          variant: "destructive",
        });
      } else {
        setStaffData(data || []);
      }
    } catch (error: any) {
      console.error('Error loading staff performance:', error);
      toast({
        title: "Error",
        description: "Failed to load staff performance data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    loadData(); 
  }, []);

  const getPerformanceRank = (member: StaffMember, index: number) => {
    if (index === 0) return { variant: "default" as const, label: "#1 Top Performer" };
    if (index === 1) return { variant: "secondary" as const, label: "#2 High Performer" };
    if (index === 2) return { variant: "outline" as const, label: "#3 Good Performer" };
    return { variant: "outline" as const, label: `#${index + 1}` };
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Staff Performance</h1>
          <p className="text-muted-foreground">Track team sales performance and productivity</p>
        </div>
      </div>

      {/* Date Range Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Performance Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button onClick={loadData} disabled={loading} className="shrink-0">
              {loading ? "Loading..." : "Refresh Data"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-info">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">{totals.orders.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All team members</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Units Sold</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totals.quantity.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total quantity moved</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(totals.gross)}</div>
            <p className="text-xs text-muted-foreground">Total sales value</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
            <Target className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{formatCurrency(totals.cost)}</div>
            <p className="text-xs text-muted-foreground">Cost of goods sold</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(totals.net)}</div>
            <p className="text-xs text-muted-foreground">
              {averageProfit.toFixed(1)}% margin
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Staff Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Individual Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : staffData.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No staff performance data for the selected period.</p>
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-border">
                    <th className="py-3 pr-4 font-medium">Staff Member</th>
                    <th className="py-3 pr-4 font-medium">Rank</th>
                    <th className="py-3 pr-4 font-medium">Orders</th>
                    <th className="py-3 pr-4 font-medium">Qty Sold</th>
                    <th className="py-3 pr-4 font-medium">Gross Revenue</th>
                    <th className="py-3 pr-4 font-medium">Costs</th>
                    <th className="py-3 pr-4 font-medium">Net Profit</th>
                    <th className="py-3 font-medium">Profit %</th>
                  </tr>
                </thead>
                <tbody>
                  {staffData
                    .sort((a, b) => (b.gross_revenue_cents || 0) - (a.gross_revenue_cents || 0))
                    .map((member, index) => {
                      const rank = getPerformanceRank(member, index);
                      return (
                        <tr key={member.user_id || `unknown-${index}`} className="border-b border-border last:border-0 hover:bg-muted/50">
                          <td className="py-3 pr-4">
                            <div className="font-medium">
                              {member.email || member.user_id || "Unknown User"}
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            <Badge variant={rank.variant}>
                              {rank.label}
                            </Badge>
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground">{member.orders}</td>
                          <td className="py-3 pr-4 font-semibold">{member.qty_sold}</td>
                          <td className="py-3 pr-4 text-success font-semibold">
                            {formatCurrency(member.gross_revenue_cents)}
                          </td>
                          <td className="py-3 pr-4 text-warning">
                            {formatCurrency(member.cost_cents)}
                          </td>
                          <td className="py-3 pr-4 text-success font-semibold">
                            {formatCurrency(member.net_profit_cents)}
                          </td>
                          <td className="py-3">
                            <Badge variant={member.profit_pct >= 20 ? "default" : member.profit_pct >= 10 ? "secondary" : "outline"}>
                              {(member.profit_pct ?? 0).toFixed(1)}%
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}