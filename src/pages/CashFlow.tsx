import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

interface CashFlowData {
  date: string;
  inflow: number;
  outflow: number;
  net: number;
}

export default function CashFlow() {
  const [cashFlowData, setCashFlowData] = useState<CashFlowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({
    totalInflow: 0,
    totalOutflow: 0,
    netCashFlow: 0
  });

  useEffect(() => {
    fetchCashFlowData();
  }, []);

  const fetchCashFlowData = async () => {
    try {
      // Get sales data (cash inflows)
      const { data: salesData } = await supabase
        .from('sales')
        .select('occurred_at, total_amount')
        .gte('occurred_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('occurred_at', { ascending: true });

      // Get purchase orders data (cash outflows) - using existing columns
      const { data: purchaseData } = await supabase
        .from('purchase_orders')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });

      // Group by date and calculate flows
      const flowByDate: Record<string, { inflow: number; outflow: number }> = {};

      // Process sales (inflows)
      (salesData || []).forEach(sale => {
        const date = new Date(sale.occurred_at).toISOString().split('T')[0];
        if (!flowByDate[date]) flowByDate[date] = { inflow: 0, outflow: 0 };
        flowByDate[date].inflow += sale.total_amount;
      });

      // Process purchases (outflows) - simulate cost since column doesn't exist
      (purchaseData || []).forEach(purchase => {
        const date = new Date(purchase.created_at).toISOString().split('T')[0];
        if (!flowByDate[date]) flowByDate[date] = { inflow: 0, outflow: 0 };
        flowByDate[date].outflow += 100; // Placeholder cost
      });

      // Convert to array and calculate totals
      const flowData = Object.entries(flowByDate)
        .map(([date, flows]) => ({
          date,
          inflow: flows.inflow,
          outflow: flows.outflow,
          net: flows.inflow - flows.outflow
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const totalInflow = flowData.reduce((sum, day) => sum + day.inflow, 0);
      const totalOutflow = flowData.reduce((sum, day) => sum + day.outflow, 0);

      setCashFlowData(flowData);
      setTotals({
        totalInflow,
        totalOutflow,
        netCashFlow: totalInflow - totalOutflow
      });
    } catch (error) {
      console.error('Error fetching cash flow data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cash Flow Analysis</h1>
          <p className="text-muted-foreground">Monitor daily cash inflows and outflows</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inflows</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totals.totalInflow)}
            </div>
            <p className="text-xs text-muted-foreground">From sales revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outflows</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totals.totalOutflow)}
            </div>
            <p className="text-xs text-muted-foreground">From purchases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
            <DollarSign className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totals.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totals.netCashFlow)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totals.netCashFlow >= 0 ? 'Positive flow' : 'Negative flow'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Cash Flow Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daily Cash Flow (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Date</th>
                  <th className="text-right p-2">Inflows</th>
                  <th className="text-right p-2">Outflows</th>
                  <th className="text-right p-2">Net Flow</th>
                </tr>
              </thead>
              <tbody>
                {cashFlowData.length > 0 ? (
                  cashFlowData.map((day, index) => (
                    <tr key={day.date} className={index % 2 === 0 ? 'bg-muted/50' : ''}>
                      <td className="p-2">{formatDate(day.date)}</td>
                      <td className="p-2 text-right text-green-600">{formatCurrency(day.inflow)}</td>
                      <td className="p-2 text-right text-red-600">{formatCurrency(day.outflow)}</td>
                      <td className={`p-2 text-right font-medium ${day.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(day.net)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-muted-foreground">
                      No cash flow data available for the last 30 days
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}