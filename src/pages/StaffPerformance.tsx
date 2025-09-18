import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, TrendingUp, Award } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

interface StaffPerformance {
  id: string;
  staff_name: string;
  total_sales: number;
  total_revenue: number;
  avg_transaction: number;
  transactions_count: number;
}

export default function StaffPerformance() {
  const [staffData, setStaffData] = useState<StaffPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({
    totalStaff: 0,
    totalRevenue: 0,
    totalTransactions: 0,
    avgPerformance: 0
  });

  useEffect(() => {
    fetchStaffPerformance();
  }, []);

  const fetchStaffPerformance = async () => {
    try {
      // Get sales data - since staff_name doesn't exist, we'll show message about adding it
      const { data: salesData } = await supabase
        .from('sales')
        .select('occurred_at, total_amount, qty')
        .gte('occurred_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Since staff_name column doesn't exist yet, show instructional message
      if (!salesData || salesData.length === 0) {
        setLoading(false);
        return;
      }

      // For now, we'll simulate data since staff_name doesn't exist
      // This shows what the page will look like once staff_name is added to sales table
      const mockStaffData = [
        {
          id: "unknown-staff",
          staff_name: "Database Schema Incomplete",
          total_sales: salesData.reduce((sum, sale) => sum + (sale.qty || 0), 0),
          total_revenue: salesData.reduce((sum, sale) => sum + (sale.total_amount || 0), 0),
          avg_transaction: salesData.length > 0 ? salesData.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) / salesData.length : 0,
          transactions_count: salesData.length
        }
      ];

      setStaffData(mockStaffData);
      setTotals({
        totalStaff: 1,
        totalRevenue: mockStaffData[0].total_revenue,
        totalTransactions: mockStaffData[0].transactions_count,
        avgPerformance: mockStaffData[0].total_revenue
      });
    } catch (error) {
      console.error('Error fetching staff performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

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
          <h1 className="text-3xl font-bold">Staff Performance</h1>
          <p className="text-muted-foreground">Track individual staff sales performance and metrics</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalStaff}</div>
            <p className="text-xs text-muted-foreground">With sales activity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totals.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">All staff combined</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <Award className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(totals.avgPerformance)}
            </div>
            <p className="text-xs text-muted-foreground">Revenue per staff</p>
          </CardContent>
        </Card>
      </div>

      {/* Staff Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Individual Staff Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Staff Member</th>
                  <th className="text-right p-3">Revenue</th>
                  <th className="text-right p-3">Units Sold</th>
                  <th className="text-right p-3">Transactions</th>
                  <th className="text-right p-3">Avg Transaction</th>
                  <th className="text-right p-3">Performance</th>
                </tr>
              </thead>
              <tbody>
                {staffData.length > 0 ? (
                  staffData.map((staff, index) => (
                    <tr key={staff.id} className={index % 2 === 0 ? 'bg-muted/50' : ''}>
                      <td className="p-3 font-medium">{staff.staff_name}</td>
                      <td className="p-3 text-right text-green-600 font-medium">
                        {formatCurrency(staff.total_revenue)}
                      </td>
                      <td className="p-3 text-right">{staff.total_sales}</td>
                      <td className="p-3 text-right">{staff.transactions_count}</td>
                      <td className="p-3 text-right">{formatCurrency(staff.avg_transaction)}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {index === 0 && <Award className="h-4 w-4 text-yellow-500" />}
                          {index === 1 && <Award className="h-4 w-4 text-gray-400" />}
                          {index === 2 && <Award className="h-4 w-4 text-amber-600" />}
                          <span className={`text-xs px-2 py-1 rounded ${
                            index === 0 ? 'bg-yellow-100 text-yellow-800' :
                            index < 3 ? 'bg-green-100 text-green-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {index === 0 ? 'Top Performer' :
                             index < 3 ? 'High Performer' :
                             'Active'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground">
                      No staff performance data available. Sales records need staff_name field populated.
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