import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { HelpTooltip } from "@/components/ui/HelpTooltip";
import { 
  TrendingUp, 
  Users, 
  BarChart3,
  AlertTriangle,
  Plus,
  Activity,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useGlobalDays } from '@/hooks/useGlobalDays';
import { invokeReport } from '@/lib/reportsApi';
import { MetricsCards, getRevenueMetrics, getMachineMetrics, getProspectMetrics } from "@/components/dashboard/MetricsCards";
import { ActivityFeed, createSaleActivity, createProspectActivity } from "@/components/dashboard/ActivityFeed";
import { ChartsSection, formatRevenueData, formatSalesVolumeData, formatProductData, formatMachineStatusData } from "@/components/dashboard/ChartsSection";
import { StatCard } from "@/components/enhanced/StatCard";
import { RealtimeSalesWidget } from '@/components/sales/RealtimeSalesWidget';
import { InventoryDashboardWidget } from '@/components/inventory/InventoryDashboardWidget';
import { RouteOptimizerWidget } from '@/components/routes/RouteOptimizerWidget';
import { MachineOpsWidget } from '@/components/machine-ops/MachineOpsWidget';
import { FinancialDashboardWidget } from '@/components/finance/FinancialDashboardWidget';

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
          <p className="text-muted-foreground">
            Your vending machine empire at a glance • Last updated {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" asChild>
            <Link to="/analytics/staff">
              <Users className="h-4 w-4 mr-2" />
              Staff Analytics
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/alerts/low-stock">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Low Stock
            </Link>
          </Button>
          <Button asChild>
            <Link to="/prospects/new">
              <Plus className="h-4 w-4 mr-2" />
              New Prospect
            </Link>
          </Button>
        </div>
      </div>

      {/* Financial KPIs */}
      {data.kpis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Financial Overview</span>
              <span className="text-sm font-normal text-muted-foreground">Last {days} days</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-6">
              <StatCard
                title="Revenue"
                value={`$${data.kpis.revenue.toFixed(2)}`}
                icon={TrendingUp}
                className="border-l-4 border-l-green-500"
              />
              <StatCard
                title="COGS"
                value={`$${data.kpis.cogs.toFixed(2)}`}
                className="border-l-4 border-l-red-500"
              />
              <StatCard
                title="Profit"
                value={`$${data.kpis.profit.toFixed(2)}`}
                className="border-l-4 border-l-emerald-500"
              />
              <StatCard
                title="Profit %"
                value={`${(data.kpis.margin * 100).toFixed(1)}%`}
                className="border-l-4 border-l-emerald-500"
              />
              <StatCard
                title="Orders"
                value={data.kpis.orders}
                className="border-l-4 border-l-blue-500"
              />
              <StatCard
                title="Units"
                value={data.kpis.units}
                className="border-l-4 border-l-blue-500"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Main Metrics */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Today's Performance</h2>
          <MetricsCards 
            metrics={getRevenueMetrics(data.revenueStats)} 
            loading={kpiLoading}
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Machine Status</h2>
          <MetricsCards 
            metrics={getMachineMetrics(data.machineStats)} 
            loading={loading}
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Sales Pipeline</h2>
          <MetricsCards 
            metrics={getProspectMetrics(data.prospectStats)} 
            loading={loading}
          />
        </div>
      </div>

      <Separator />

      {/* Charts Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Analytics Overview</h2>
        <ChartsSection
          revenueData={revenueChartData as any}
          salesData={salesChartData as any}
          productData={productChartData as any}
          machineStatusData={machineChartData as any}
          loading={loading}
        />
      </div>

      <Separator />

      {/* Activity Feed & Inventory */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivityFeed
            activities={activities}
            loading={loading}
            title="Live Activity Feed"
            maxItems={10}
          />
        </div>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InventoryDashboardWidget />
            <RouteOptimizerWidget />
            <MachineOpsWidget />
            <FinancialDashboardWidget />
          </div>
          
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Quick Actions
              </CardTitle>
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
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Manage Inventory
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/prospects/new">
                  <Users className="h-4 w-4 mr-2" />
                  Add Prospect
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/machines/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Machine
                </Link>
              </Button>
              <Separator />
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link to="/reports">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Reports
                  <HelpTooltip content="Access detailed analytics and business intelligence reports" />
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