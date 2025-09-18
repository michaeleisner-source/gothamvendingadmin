import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";

type Row = { 
  day: string; 
  cash_in_cents: number; 
  cash_out_cents: number; 
  net_cents: number; 
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

export default function CashFlow() {
  const today = new Date();
  const defaultEnd = today.toISOString().slice(0, 10);
  const defaultStart = new Date(today.getTime() - 29 * 86400000).toISOString().slice(0, 10);
  
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const totals = rows.reduce((acc, row) => ({
    cashIn: acc.cashIn + (row.cash_in_cents || 0),
    cashOut: acc.cashOut + (row.cash_out_cents || 0),
    net: acc.net + (row.net_cents || 0)
  }), { cashIn: 0, cashOut: 0, net: 0 });

  async function loadData() {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("report_cash_flow", { 
        p_start: isoStart(start), 
        p_end: isoEnd(end) 
      });
      if (error) {
        console.error("Error loading cash flow data:", error);
      }
      setRows(data || []);
    } catch (error) {
      console.error("Error loading cash flow data:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    loadData(); 
  }, []);

  const avgDailyNet = rows.length > 0 ? totals.net / rows.length : 0;
  const isPositiveTrend = totals.net >= 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cash Flow Analysis</h1>
          <p className="text-muted-foreground">Track daily cash inflow and outflow patterns</p>
        </div>
      </div>

      {/* Date Range Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Date Range
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
              {loading ? "Loading..." : "Refresh"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-success">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cash In</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(totals.cashIn)}</div>
            <p className="text-xs text-muted-foreground">Sales revenue</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cash Out</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(totals.cashOut)}</div>
            <p className="text-xs text-muted-foreground">Purchase orders</p>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${isPositiveTrend ? 'border-l-success' : 'border-l-destructive'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
            <DollarSign className={`h-4 w-4 ${isPositiveTrend ? 'text-success' : 'text-destructive'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isPositiveTrend ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(totals.net)}
            </div>
            <p className="text-xs text-muted-foreground">
              {isPositiveTrend ? "Positive" : "Negative"} cash flow
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(avgDailyNet)}</div>
            <p className="text-xs text-muted-foreground">
              Over {rows.length} days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Cash Flow Details</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No cash flow data for the selected period.</p>
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-border">
                    <th className="py-3 pr-4 font-medium">Date</th>
                    <th className="py-3 pr-4 font-medium">Cash In</th>
                    <th className="py-3 pr-4 font-medium">Cash Out</th>
                    <th className="py-3 font-medium">Net Flow</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.day} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="py-3 pr-4 font-medium">
                        {new Date(row.day).toLocaleDateString()}
                      </td>
                      <td className="py-3 pr-4 text-success">
                        {formatCurrency(row.cash_in_cents)}
                      </td>
                      <td className="py-3 pr-4 text-destructive">
                        {formatCurrency(row.cash_out_cents)}
                      </td>
                      <td className={`py-3 font-semibold ${
                        row.net_cents >= 0 ? 'text-success' : 'text-destructive'
                      }`}>
                        {formatCurrency(row.net_cents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}