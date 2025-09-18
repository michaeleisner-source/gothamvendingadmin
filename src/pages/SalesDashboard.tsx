import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  BarChart3,
  RefreshCw,
  Calendar,
  MapPin,
  Package,
  Users,
  Clock,
  Activity,
  Plus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { RealtimeSalesWidget } from "@/components/sales/RealtimeSalesWidget";
import { ChartsSection } from "@/components/dashboard/ChartsSection";
import { formatRevenueData, formatSalesVolumeData, formatProductData } from "@/components/dashboard/ChartsSection";
import { Link } from "react-router-dom";

interface SalesMetric {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
}

interface TopPerformer {
  id: string;
  name: string;
  value: number;
  count: number;
  type: 'product' | 'machine' | 'location';
}

export default function SalesDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [metrics, setMetrics] = useState<SalesMetric[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [chartData, setChartData] = useState({
    revenue: [] as any[],
    volume: [] as any[],
    products: [] as any[]
  });

  useEffect(() => {
    fetchDashboardData();
    
    // Set up real-time subscription
    const salesChannel = supabase
      .channel('sales-dashboard')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sales'
        },
        () => {
          // Refresh data when new sale comes in
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(salesChannel);
    };
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    if (!refreshing) setLoading(true);
    
    try {
      // Calculate date range based on selected period
      const now = new Date();
      let startDate = new Date();
      
      switch (selectedPeriod) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
      }

      // Fetch sales data
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select(`
          *,
          machines(name),
          products(name, category)
        `)
        .gte('occurred_at', startDate.toISOString())
        .order('occurred_at', { ascending: false });

      if (salesError) throw salesError;

      setSalesData(sales || []);

      // Calculate metrics
      const totalRevenue = (sales || []).reduce((sum, sale) => 
        sum + (sale.total_amount || 0), 0
      );
      
      const totalTransactions = (sales || []).length;
      const totalItems = (sales || []).reduce((sum, sale) => 
        sum + (sale.qty || sale.quantity_sold || 0), 0
      );
      
      const avgTransactionValue = totalTransactions > 0 
        ? totalRevenue / totalTransactions 
        : 0;

      // Calculate previous period for comparison
      const prevStartDate = new Date(startDate);
      prevStartDate.setTime(prevStartDate.getTime() - (now.getTime() - startDate.getTime()));
      
      const { data: prevSales } = await supabase
        .from('sales')
        .select('total_amount, qty, quantity_sold')
        .gte('occurred_at', prevStartDate.toISOString())
        .lt('occurred_at', startDate.toISOString());

      const prevRevenue = (prevSales || []).reduce((sum, sale) => 
        sum + (sale.total_amount || 0), 0
      );
      
      const revenueChange = prevRevenue > 0 
        ? ((totalRevenue - prevRevenue) / prevRevenue * 100)
        : 0;

      setMetrics([
        {
          title: 'Total Revenue',
          value: `$${totalRevenue.toFixed(2)}`,
          change: `${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(1)}%`,
          trend: revenueChange >= 0 ? 'up' : 'down',
          icon: <DollarSign className="h-5 w-5" />
        },
        {
          title: 'Transactions',
          value: totalTransactions.toString(),
          change: '+12.3%', // Placeholder - would calculate similarly
          trend: 'up',
          icon: <ShoppingCart className="h-5 w-5" />
        },
        {
          title: 'Items Sold',
          value: totalItems.toString(),
          change: '+8.7%', // Placeholder
          trend: 'up',
          icon: <Package className="h-5 w-5" />
        },
        {
          title: 'Avg. Transaction',
          value: `$${avgTransactionValue.toFixed(2)}`,
          change: '+5.2%', // Placeholder
          trend: 'up',
          icon: <TrendingUp className="h-5 w-5" />
        }
      ]);

      // Calculate top performers
      const productPerformance = new Map();
      const machinePerformance = new Map();

      (sales || []).forEach(sale => {
        // Products
        const productName = sale.product_name || 'Unknown';
        if (!productPerformance.has(productName)) {
          productPerformance.set(productName, { value: 0, count: 0, id: sale.product_id });
        }
        const product = productPerformance.get(productName);
        product.value += sale.total_amount || 0;
        product.count += sale.qty || 1;

        // Machines
        const machineName = sale.machines?.name || 'Unknown Machine';
        if (!machinePerformance.has(machineName)) {
          machinePerformance.set(machineName, { value: 0, count: 0, id: sale.machine_id });
        }
        const machine = machinePerformance.get(machineName);
        machine.value += sale.total_amount || 0;
        machine.count += 1;
      });

      const topProducts = Array.from(productPerformance.entries())
        .map(([name, data]) => ({
          id: data.id,
          name,
          value: data.value,
          count: data.count,
          type: 'product' as const
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      const topMachines = Array.from(machinePerformance.entries())
        .map(([name, data]) => ({
          id: data.id,
          name,
          value: data.value,
          count: data.count,
          type: 'machine' as const
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      setTopPerformers([...topProducts, ...topMachines]);

      // Prepare chart data
      const revenueChartData = formatRevenueData(sales || []);
      const volumeChartData = formatSalesVolumeData(sales || []);
      const productChartData = formatProductData(sales || []);

      setChartData({
        revenue: revenueChartData,
        volume: volumeChartData,
        products: productChartData
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
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Activity className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Sales Dashboard</h1>
            <p className="text-muted-foreground">Real-time sales analytics and performance metrics</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link to="/sales">
              <Plus className="mr-2 h-4 w-4" />
              Record Sale
            </Link>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {/* Period selector */}
          <div className="flex border rounded-lg p-1">
            {[
              { key: 'today', label: 'Today' },
              { key: 'week', label: '7D' },
              { key: 'month', label: '30D' },
              { key: 'quarter', label: '90D' }
            ].map(period => (
              <Button
                key={period.key}
                variant={selectedPeriod === period.key ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedPeriod(period.key)}
                className="h-8 px-3"
              >
                {period.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Key Metrics */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-20 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))
            ) : (
              metrics.map((metric, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-muted-foreground">{metric.icon}</div>
                      <Badge 
                        variant={metric.trend === 'up' ? 'default' : metric.trend === 'down' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {metric.change}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold">{metric.value}</div>
                      <div className="text-sm text-muted-foreground">{metric.title}</div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Charts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Sales Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-80 bg-muted rounded animate-pulse"></div>
              ) : (
                <ChartsSection
                  revenueData={chartData.revenue}
                  salesData={chartData.volume}
                  productData={chartData.products}
                  machineStatusData={[]} // Not needed for this view
                  loading={false}
                />
              )}
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="products">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="products">Products</TabsTrigger>
                  <TabsTrigger value="machines">Machines</TabsTrigger>
                </TabsList>
                
                <TabsContent value="products" className="space-y-3 mt-4">
                  {topPerformers
                    .filter(p => p.type === 'product')
                    .map((product, index) => (
                      <div key={product.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline">#{index + 1}</Badge>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {product.count} units sold
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">
                            ${product.value.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                </TabsContent>
                
                <TabsContent value="machines" className="space-y-3 mt-4">
                  {topPerformers
                    .filter(p => p.type === 'machine')
                    .map((machine, index) => (
                      <div key={machine.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline">#{index + 1}</Badge>
                          <div>
                            <div className="font-medium">{machine.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {machine.count} transactions
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">
                            ${machine.value.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <RealtimeSalesWidget />
          
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/sales">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Record New Sale
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/reports/sales-summary">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Reports
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/inventory">
                  <Package className="h-4 w-4 mr-2" />
                  Check Inventory
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}