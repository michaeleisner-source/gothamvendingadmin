import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { TrendingUp, DollarSign, ShoppingCart, Clock, Receipt, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Sale {
  id: string;
  product_name: string;
  quantity_sold: number;
  unit_price: number;
  total_amount: number;
  occurred_at: string;
}

interface DailyStats {
  total_sales: number;
  total_revenue: number;
  total_transactions: number;
  avg_transaction: number;
}

export default function SalesDashboard() {
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    total_sales: 0,
    total_revenue: 0,
    total_transactions: 0,
    avg_transaction: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch recent sales (last 20)
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .order('occurred_at', { ascending: false })
        .limit(20);

      if (salesError) throw salesError;
      setRecentSales(salesData || []);

      // Calculate today's stats
      const today = new Date().toISOString().split('T')[0];
      const { data: todayData, error: todayError } = await supabase
        .from('sales')
        .select('quantity_sold, total_amount')
        .gte('occurred_at', today + 'T00:00:00')
        .lt('occurred_at', today + 'T23:59:59');

      if (todayError) throw todayError;

      const todaySales = todayData || [];
      const totalSales = todaySales.reduce((sum, sale) => sum + sale.quantity_sold, 0);
      const totalRevenue = todaySales.reduce((sum, sale) => sum + sale.total_amount, 0);
      const totalTransactions = todaySales.length;
      const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

      setDailyStats({
        total_sales: totalSales,
        total_revenue: totalRevenue,
        total_transactions: totalTransactions,
        avg_transaction: avgTransaction
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch sales data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales Dashboard</h1>
          <p className="text-muted-foreground">Track your vending machine sales performance</p>
        </div>
        <Button asChild>
          <Link to="/sales">
            <Plus className="mr-2 h-4 w-4" />
            Record Sale
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dailyStats.total_revenue)}</div>
            <p className="text-xs text-muted-foreground">Total earnings today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailyStats.total_sales}</div>
            <p className="text-xs text-muted-foreground">Products sold today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailyStats.total_transactions}</div>
            <p className="text-xs text-muted-foreground">Sales transactions today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dailyStats.avg_transaction)}</div>
            <p className="text-xs text-muted-foreground">Average sale amount</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Recent Sales</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentSales.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="mx-auto h-12 w-12 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No sales recorded</h3>
              <p className="mb-4">Start recording sales to see them appear here.</p>
              <Button asChild>
                <Link to="/sales">
                  <Plus className="mr-2 h-4 w-4" />
                  Record First Sale
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <h4 className="font-medium">{sale.product_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatTime(sale.occurred_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <Badge variant="outline">
                        Qty: {sale.quantity_sold}
                      </Badge>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-semibold text-primary">
                        {formatCurrency(sale.total_amount)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(sale.unit_price)} each
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {recentSales.length >= 20 && (
                <div className="text-center pt-4">
                  <Button variant="outline" asChild>
                    <Link to="/reports">
                      View All Sales
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}