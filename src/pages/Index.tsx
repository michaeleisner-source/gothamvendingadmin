import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { HelpTooltip } from "@/components/ui/HelpTooltip";
import { 
  TrendingUp, 
  Users, 
  BarChart3,
  AlertTriangle,
  Plus,
  Activity,
  RefreshCw,
  DollarSign,
  ShoppingCart,
  Package,
  Zap,
  MapPin,
  Clock,
  Target,
  TrendingDown,
  ArrowUpRight,
  ArrowRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useGlobalDays } from '@/hooks/useGlobalDays';
import { invokeReport } from '@/lib/reportsApi';
import { MetricsCards, getRevenueMetrics, getMachineMetrics, getProspectMetrics } from "@/components/dashboard/MetricsCards";
import { ActivityFeed, createSaleActivity, createProspectActivity } from "@/components/dashboard/ActivityFeed";
import { ChartsSection, formatRevenueData, formatSalesVolumeData, formatProductData, formatMachineStatusData } from "@/components/dashboard/ChartsSection";
import { StatCard } from "@/components/enhanced/StatCard";
import { PageLayout } from "@/components/ui/PageLayout";
import { ChartCard } from "@/components/enhanced/ChartCard";
import { QuickFilters } from "@/components/enhanced/QuickFilters";

interface DashboardData {
  kpis: {
    revenue: number;
    cogs: number;
    profit: number;
    orders: number;
    units: number;
    margin: number;
  } | null;
  revenueStats: {
    today: number;
    transactions: number;
    itemsSold: number;
    avgTransaction: number;
    growth: number;
  };
  machineStats: {
    total: number;
    online: number;
    offline: number;
    uptimePercentage: number;
  };
  prospectStats: {
    total: number;
    qualified: number;
    inNegotiation: number;
    conversionRate: number;
  };
  rawData: {
    sales: any[];
    machines: any[];
    prospects: any[];
  };
}

const Index = () => {
  const days = useGlobalDays();
  const [data, setData] = useState<DashboardData>({
    kpis: null,
    revenueStats: { today: 0, transactions: 0, itemsSold: 0, avgTransaction: 0, growth: 0 },
    machineStats: { total: 0, online: 0, offline: 0, uptimePercentage: 0 },
    prospectStats: { total: 0, qualified: 0, inNegotiation: 0, conversionRate: 0 },
    rawData: { sales: [], machines: [], prospects: [] }
  });
  
  const [loading, setLoading] = useState(true);
  const [kpiLoading, setKpiLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time subscriptions
    const salesChannel = supabase
      .channel('dashboard-sales')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, () => {
        loadDashboardData();
      })
      .subscribe();

    const machinesChannel = supabase
      .channel('dashboard-machines')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'machines' }, () => {
        loadDashboardData();
      })
      .subscribe();

    const leadsChannel = supabase
      .channel('dashboard-leads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        loadDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(salesChannel);
      supabase.removeChannel(machinesChannel);
      supabase.removeChannel(leadsChannel);
    };
  }, [days]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadKPIData(),
        loadRevenueData(),
        loadMachineData(),
        loadProspectData(),
        loadRawData()
      ]);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadKPIData = async () => {
    setKpiLoading(true);
    try {
      const { data: kpiData, error } = await invokeReport('reports-sales-summary', { days });
      if (error) throw new Error(error.message);
      
      const revenue = Number(kpiData.revenue || 0);
      const cogs = Number(kpiData.cogs || 0);
      const profit = revenue - cogs;
      const margin = revenue ? profit / revenue : 0;
      
      setData(prev => ({
        ...prev,
        kpis: {
          revenue,
          cogs,
          profit,
          orders: Number(kpiData.orders || 0),
          units: Number(kpiData.units || 0),
          margin
        }
      }));
    } catch (error: any) {
      console.error('KPI Error:', error);
    } finally {
      setKpiLoading(false);
    }
  };

  const loadRevenueData = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data: todaySales } = await supabase
      .from('sales')
      .select('qty, unit_price_cents, occurred_at')
      .gte('occurred_at', today + 'T00:00:00');

    const salesData = todaySales || [];
    const todayRevenue = salesData.reduce((sum, sale) => sum + (sale.unit_price_cents * sale.qty), 0) / 100;
    const transactions = salesData.length;
    const itemsSold = salesData.reduce((sum, sale) => sum + sale.qty, 0);
    const avgTransaction = transactions > 0 ? todayRevenue / transactions : 0;

    setData(prev => ({
      ...prev,
      revenueStats: {
        today: todayRevenue,
        transactions,
        itemsSold,
        avgTransaction,
        growth: 5.2 // Mock growth for now
      }
    }));
  };

  const loadMachineData = async () => {
    const { data: machines } = await supabase
      .from('machines')
      .select('status');

    const machineData = machines || [];
    const total = machineData.length;
    const online = machineData.filter(m => m.status === 'ONLINE').length;
    const offline = machineData.filter(m => m.status === 'OFFLINE').length;
    const uptimePercentage = total > 0 ? (online / total) * 100 : 0;

    setData(prev => ({
      ...prev,
      machineStats: { total, online, offline, uptimePercentage }
    }));
  };

  const loadProspectData = async () => {
    const { data: prospects } = await supabase
      .from('leads')
      .select('status');

    const prospectData = prospects || [];
    const total = prospectData.length;
    const qualified = prospectData.filter(p => p.status === 'qualified').length;
    const inNegotiation = prospectData.filter(p => p.status === 'contacted').length;
    const won = prospectData.filter(p => p.status === 'won').length;
    const conversionRate = total > 0 ? (won / total) * 100 : 0;

    setData(prev => ({
      ...prev,
      prospectStats: { total, qualified, inNegotiation, conversionRate }
    }));
  };

  const loadRawData = async () => {
    const [salesResponse, machinesResponse, prospectsResponse] = await Promise.all([
      supabase.from('sales').select('*').order('occurred_at', { ascending: false }).limit(50),
      supabase.from('machines').select('*'),
      supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(20)
    ]);

    setData(prev => ({
      ...prev,
      rawData: {
        sales: salesResponse.data || [],
        machines: machinesResponse.data || [],
        prospects: prospectsResponse.data || []
      }
    }));
  };

  // Generate chart data
  const revenueChartData = formatRevenueData(data.rawData.sales);
  const salesChartData = formatSalesVolumeData(data.rawData.sales);
  const productChartData = formatProductData(data.rawData.sales);
  const machineChartData = formatMachineStatusData(data.rawData.machines);

  // Generate activity feed
  const activities = [
    ...data.rawData.sales.slice(0, 5).map(createSaleActivity),
    ...data.rawData.prospects.slice(0, 3).map(createProspectActivity)
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handleRefresh = () => {
    loadDashboardData();
  };

  if (loading && !data.kpis) {
    return (
      <div className="container-mobile page-padding">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <PageLayout
      title="Business Dashboard"
      description="Your vending machine empire at a glance"
      icon={BarChart3}
      badges={[
        { text: `Last ${days} days`, variant: 'outline' },
        { text: `Updated ${lastUpdated.toLocaleTimeString()}`, variant: 'secondary' }
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button asChild>
            <Link to="/prospects/new">
              <Plus className="h-4 w-4 mr-2" />
              New Prospect
            </Link>
          </Button>
        </div>
      }
    >
      {/* Critical KPIs at the top */}
      {data.kpis && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatCard
            title="Revenue"
            value={`$${data.kpis.revenue.toLocaleString()}`}
            icon={DollarSign}
            trend={{ value: 12.3, direction: "up", label: "vs last period" }}
            className="border-l-4 border-l-success"
          />
          <StatCard
            title="Profit"
            value={`$${data.kpis.profit.toLocaleString()}`}
            icon={TrendingUp}
            trend={{ value: 8.7, direction: "up", label: "vs last period" }}
            className="border-l-4 border-l-profit"
          />
          <StatCard
            title="Profit Margin"
            value={`${(data.kpis.margin * 100).toFixed(1)}%`}
            icon={Target}
            trend={{ value: 2.1, direction: "up", label: "vs last period" }}
            className="border-l-4 border-l-primary"
          />
          <StatCard
            title="Orders"
            value={data.kpis.orders.toLocaleString()}
            icon={ShoppingCart}
            trend={{ value: 15.2, direction: "up", label: "vs last period" }}
            className="border-l-4 border-l-info"
          />
          <StatCard
            title="Units Sold"
            value={data.kpis.units.toLocaleString()}
            icon={Package}
            trend={{ value: 9.4, direction: "up", label: "vs last period" }}
            className="border-l-4 border-l-info"
          />
          <StatCard
            title="COGS"
            value={`$${data.kpis.cogs.toLocaleString()}`}
            icon={TrendingDown}
            trend={{ value: 5.1, direction: "down", label: "vs last period" }}
            className="border-l-4 border-l-expense"
          />
        </div>
      )}

      {/* Operational Status Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Today's Performance</CardTitle>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
              <span className="text-xs text-muted-foreground">Live</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Revenue</span>
              <span className="text-xl font-bold text-success">${data.revenueStats.today.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Transactions</span>
              <span className="font-semibold">{data.revenueStats.transactions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Items Sold</span>
              <span className="font-semibold">{data.revenueStats.itemsSold}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Avg. Transaction</span>
              <span className="font-semibold">${data.revenueStats.avgTransaction.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Machine Health</CardTitle>
            <Badge variant={data.machineStats.uptimePercentage >= 95 ? "default" : data.machineStats.uptimePercentage >= 85 ? "secondary" : "destructive"}>
              {data.machineStats.uptimePercentage.toFixed(1)}% Uptime
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Machines</span>
              <span className="text-xl font-bold">{data.machineStats.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-success flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-success"></div>
                Online
              </span>
              <span className="font-semibold text-success">{data.machineStats.online}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-expense flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-expense"></div>
                Offline
              </span>
              <span className="font-semibold text-expense">{data.machineStats.offline}</span>
            </div>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to="/machines">
                <Zap className="h-4 w-4 mr-2" />
                Manage Machines
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Sales Pipeline</CardTitle>
            <Badge variant="outline">
              {data.prospectStats.conversionRate.toFixed(1)}% Conv. Rate
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Prospects</span>
              <span className="text-xl font-bold">{data.prospectStats.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Qualified</span>
              <span className="font-semibold text-info">{data.prospectStats.qualified}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">In Negotiation</span>
              <span className="font-semibold text-warning">{data.prospectStats.inNegotiation}</span>
            </div>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to="/prospects">
                <Users className="h-4 w-4 mr-2" />
                View Pipeline
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <ChartCard
          title="Revenue Trends"
          description="Daily revenue performance over time"
          onExport={() => {}}
        >
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Revenue Chart Placeholder
          </div>
        </ChartCard>

        <ChartCard
          title="Machine Performance"
          description="Sales volume and machine utilization"
          onExport={() => {}}
        >
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Machine Performance Chart Placeholder
          </div>
        </ChartCard>
      </div>

      {/* Action Center and Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityFeed
                activities={activities}
                loading={loading}
                maxItems={8}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" asChild>
                <Link to="/sales">
                  <Plus className="h-4 w-4 mr-2" />
                  Record Sale
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/inventory">
                  <Package className="h-4 w-4 mr-2" />
                  Manage Inventory
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/prospects/new">
                  <Users className="h-4 w-4 mr-2" />
                  Add Prospect
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Alerts & Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Alerts
                <Badge variant="destructive">3</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-lg bg-destructive/10">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="text-sm">Low Stock</span>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/alerts/low-stock">
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-warning/10">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-warning" />
                  <span className="text-sm">Maintenance Due</span>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/maintenance">
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Reports Shortcut */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Business Intelligence</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full justify-between" asChild>
                <Link to="/reports">
                  <span className="flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View All Reports
                  </span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default Index;