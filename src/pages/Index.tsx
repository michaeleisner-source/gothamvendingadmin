import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  AlertTriangle, 
  Users, 
  MapPin, 
  Package, 
  Cog,
  Plus,
  Activity,
  Clock,
  Target,
  Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface DashboardStats {
  revenue: {
    today: number;
    week: number;
    month: number;
    growth: number;
  };
  machines: {
    total: number;
    online: number;
    offline: number;
    needsMaintenance: number;
  };
  inventory: {
    lowStockAlerts: number;
    outOfStockSlots: number;
    totalProducts: number;
  };
  prospects: {
    total: number;
    qualified: number;
    inNegotiation: number;
    conversionRate: number;
  };
  sales: {
    todayTransactions: number;
    todayItems: number;
    avgTransaction: number;
  };
}

interface RecentActivity {
  id: string;
  type: 'sale' | 'prospect' | 'machine' | 'inventory';
  description: string;
  timestamp: string;
  amount?: number;
}

interface TopPerformer {
  id: string;
  name: string;
  value: number;
  metric: string;
}

const Index = () => {
  const [stats, setStats] = useState<DashboardStats>({
    revenue: { today: 0, week: 0, month: 0, growth: 0 },
    machines: { total: 0, online: 0, offline: 0, needsMaintenance: 0 },
    inventory: { lowStockAlerts: 0, outOfStockSlots: 0, totalProducts: 0 },
    prospects: { total: 0, qualified: 0, inNegotiation: 0, conversionRate: 0 },
    sales: { todayTransactions: 0, todayItems: 0, avgTransaction: 0 }
  });
  
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [topLocations, setTopLocations] = useState<TopPerformer[]>([]);
  const [topProducts, setTopProducts] = useState<TopPerformer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      await Promise.all([
        fetchRevenueStats(),
        fetchMachineStats(),
        fetchInventoryStats(),
        fetchProspectStats(),
        fetchSalesStats(),
        fetchRecentActivity(),
        fetchTopPerformers()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueStats = async () => {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [todayData, weekData, monthData] = await Promise.all([
      supabase.from('sales').select('total_amount').gte('occurred_at', today + 'T00:00:00'),
      supabase.from('sales').select('total_amount').gte('occurred_at', weekAgo + 'T00:00:00'),
      supabase.from('sales').select('total_amount').gte('occurred_at', monthAgo + 'T00:00:00')
    ]);

    const todayRevenue = (todayData.data || []).reduce((sum, sale) => sum + sale.total_amount, 0);
    const weekRevenue = (weekData.data || []).reduce((sum, sale) => sum + sale.total_amount, 0);
    const monthRevenue = (monthData.data || []).reduce((sum, sale) => sum + sale.total_amount, 0);

    setStats(prev => ({
      ...prev,
      revenue: {
        today: todayRevenue,
        week: weekRevenue,
        month: monthRevenue,
        growth: weekRevenue > 0 ? ((todayRevenue - (weekRevenue / 7)) / (weekRevenue / 7)) * 100 : 0
      }
    }));
  };

  const fetchMachineStats = async () => {
    const { data: machines } = await supabase.from('machines').select('status');
    const machineData = machines || [];
    
    const total = machineData.length;
    const online = machineData.filter(m => m.status === 'ONLINE').length;
    const offline = machineData.filter(m => m.status === 'OFFLINE').length;
    const needsMaintenance = machineData.filter(m => m.status === 'SERVICE' || m.status === 'MAINTENANCE').length;

    setStats(prev => ({
      ...prev,
      machines: { total, online, offline, needsMaintenance }
    }));
  };

  const fetchInventoryStats = async () => {
    const { data: products } = await supabase.from('products').select('id');
    const { data: inventory } = await supabase.from('inventory_levels').select('current_qty, reorder_point');
    
    const totalProducts = (products || []).length;
    const inventoryData = inventory || [];
    const lowStockAlerts = inventoryData.filter(item => item.current_qty <= item.reorder_point && item.current_qty > 0).length;
    const outOfStockSlots = inventoryData.filter(item => item.current_qty === 0).length;

    setStats(prev => ({
      ...prev,
      inventory: { totalProducts, lowStockAlerts, outOfStockSlots }
    }));
  };

  const fetchProspectStats = async () => {
    const { data: prospects } = await supabase.from('prospects').select('stage');
    const prospectData = prospects || [];
    
    const total = prospectData.length;
    const qualified = prospectData.filter(p => p.stage === 'QUALIFIED').length;
    const inNegotiation = prospectData.filter(p => p.stage === 'NEGOTIATION' || p.stage === 'PROPOSAL').length;
    const converted = prospectData.filter(p => p.stage === 'CONVERTED').length;
    const conversionRate = total > 0 ? (converted / total) * 100 : 0;

    setStats(prev => ({
      ...prev,
      prospects: { total, qualified, inNegotiation, conversionRate }
    }));
  };

  const fetchSalesStats = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data: todaySales } = await supabase
      .from('sales')
      .select('quantity_sold, total_amount')
      .gte('occurred_at', today + 'T00:00:00');

    const salesData = todaySales || [];
    const todayTransactions = salesData.length;
    const todayItems = salesData.reduce((sum, sale) => sum + sale.quantity_sold, 0);
    const todayRevenue = salesData.reduce((sum, sale) => sum + sale.total_amount, 0);
    const avgTransaction = todayTransactions > 0 ? todayRevenue / todayTransactions : 0;

    setStats(prev => ({
      ...prev,
      sales: { todayTransactions, todayItems, avgTransaction }
    }));
  };

  const fetchRecentActivity = async () => {
    // Get recent sales
    const { data: recentSales } = await supabase
      .from('sales')
      .select('id, product_name, total_amount, occurred_at')
      .order('occurred_at', { ascending: false })
      .limit(5);

    // Get recent prospects
    const { data: recentProspects } = await supabase
      .from('prospects')
      .select('id, business_name, created_at')
      .order('created_at', { ascending: false })
      .limit(3);

    const activities: RecentActivity[] = [];

    // Add sales activities
    (recentSales || []).forEach(sale => {
      activities.push({
        id: sale.id,
        type: 'sale',
        description: `Sale: ${sale.product_name}`,
        timestamp: sale.occurred_at,
        amount: sale.total_amount
      });
    });

    // Add prospect activities
    (recentProspects || []).forEach(prospect => {
      activities.push({
        id: prospect.id,
        type: 'prospect',
        description: `New prospect: ${prospect.business_name}`,
        timestamp: prospect.created_at
      });
    });

    // Sort by timestamp and take top 8
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setRecentActivity(activities.slice(0, 8));
  };

  const fetchTopPerformers = async () => {
    // For now, we'll create mock data since we don't have location-sales relationships yet
    setTopLocations([
      { id: '1', name: 'Corporate Plaza', value: 1250, metric: 'revenue' },
      { id: '2', name: 'University Center', value: 980, metric: 'revenue' },
      { id: '3', name: 'Hospital Main', value: 750, metric: 'revenue' }
    ]);

    // Get top products from recent sales
    const { data: productSales } = await supabase
      .from('sales')
      .select('product_name, total_amount')
      .gte('occurred_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const productTotals = (productSales || []).reduce((acc, sale) => {
      acc[sale.product_name] = (acc[sale.product_name] || 0) + sale.total_amount;
      return acc;
    }, {} as Record<string, number>);

    const topProductsList = Object.entries(productTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([name, value], index) => ({
        id: index.toString(),
        name,
        value,
        metric: 'revenue'
      }));

    setTopProducts(topProductsList);
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'sale': return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'prospect': return <Users className="h-4 w-4 text-blue-600" />;
      case 'machine': return <Cog className="h-4 w-4 text-orange-600" />;
      case 'inventory': return <Package className="h-4 w-4 text-purple-600" />;
      default: return <Activity className="h-4 w-4" />;
    }
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
          <h1 className="text-3xl font-bold">Business Dashboard</h1>
          <p className="text-muted-foreground">Your vending machine empire at a glance</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" asChild>
            <Link to="/sales">
              <Plus className="mr-2 h-4 w-4" />
              Quick Sale
            </Link>
          </Button>
          <Button asChild>
            <Link to="/prospects/new">
              <Plus className="mr-2 h-4 w-4" />
              New Prospect
            </Link>
          </Button>
        </div>
      </div>

      {/* Revenue & Performance Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.revenue.today)}</div>
            <div className="flex items-center space-x-2 text-xs">
              <Badge variant={stats.revenue.growth >= 0 ? "default" : "destructive"} className="text-xs">
                {stats.revenue.growth >= 0 ? '↗' : '↘'} {Math.abs(stats.revenue.growth).toFixed(1)}%
              </Badge>
              <span className="text-muted-foreground">vs avg daily</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Machines</CardTitle>
            <Cog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.machines.online}/{stats.machines.total}</div>
            <div className="flex items-center space-x-2 text-xs">
              <Progress value={(stats.machines.online / Math.max(stats.machines.total, 1)) * 100} className="h-1 flex-1" />
              <span className="text-muted-foreground">{Math.round((stats.machines.online / Math.max(stats.machines.total, 1)) * 100)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.inventory.lowStockAlerts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.inventory.outOfStockSlots} out of stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Health</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.prospects.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.prospects.inNegotiation} active deals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Performance Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Weekly Revenue */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Revenue Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Today</p>
                  <p className="text-xl font-bold">{formatCurrency(stats.revenue.today)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">This Week</p>
                  <p className="text-xl font-bold">{formatCurrency(stats.revenue.week)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-xl font-bold">{formatCurrency(stats.revenue.month)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Machine Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Online</span>
                  </span>
                  <span className="font-medium">{stats.machines.online}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm">Offline</span>
                  </span>
                  <span className="font-medium">{stats.machines.offline}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">Maintenance</span>
                  </span>
                  <span className="font-medium">{stats.machines.needsMaintenance}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Today's Sales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Transactions</span>
                  <span className="font-medium">{stats.sales.todayTransactions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Items Sold</span>
                  <span className="font-medium">{stats.sales.todayItems}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg Transaction</span>
                  <span className="font-medium">{formatCurrency(stats.sales.avgTransaction)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performers */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topLocations.map((location, index) => (
                    <div key={location.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                          {index + 1}
                        </Badge>
                        <span className="text-sm font-medium">{location.name}</span>
                      </div>
                      <span className="font-semibold">{formatCurrency(location.value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topProducts.length > 0 ? topProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                          {index + 1}
                        </Badge>
                        <span className="text-sm font-medium">{product.name}</span>
                      </div>
                      <span className="font-semibold">{formatCurrency(product.value)}</span>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground">No sales data yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column - Activity & Alerts */}
        <div className="space-y-6">
          {/* Critical Alerts */}
          {(stats.inventory.lowStockAlerts > 0 || stats.machines.offline > 0 || stats.machines.needsMaintenance > 0) && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-orange-800">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Action Required</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.inventory.lowStockAlerts > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-orange-700">Low stock alerts</span>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/machines">View</Link>
                    </Button>
                  </div>
                )}
                {stats.machines.offline > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-orange-700">{stats.machines.offline} machines offline</span>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/machines">Check</Link>
                    </Button>
                  </div>
                )}
                {stats.machines.needsMaintenance > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-orange-700">Maintenance needed</span>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/machines">Schedule</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Recent Activity</span>
                </span>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/sales/dashboard">View All</Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      {getActivityIcon(activity.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{activity.description}</p>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <span>{formatTime(activity.timestamp)}</span>
                          {activity.amount && (
                            <>
                              <span>•</span>
                              <span className="font-semibold text-green-600">
                                {formatCurrency(activity.amount)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link to="/sales">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Record Sale
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link to="/prospects/new">
                  <Users className="mr-2 h-4 w-4" />
                  Add Prospect
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link to="/machines">
                  <Cog className="mr-2 h-4 w-4" />
                  Check Machines
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link to="/products/new">
                  <Package className="mr-2 h-4 w-4" />
                  Add Product
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;