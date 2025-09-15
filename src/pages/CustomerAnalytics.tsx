import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  ShoppingCart, 
  XCircle, 
  CreditCard, 
  Clock, 
  TrendingUp,
  Eye,
  RefreshCw,
  MapPin,
  AlertTriangle,
  Star,
  Download
} from "lucide-react";
import { toast } from "sonner";

interface CustomerMetrics {
  total_interactions: number;
  total_purchases: number;
  total_failed_purchases: number;
  total_browse_sessions: number;
  average_session_duration: number;
  success_rate: number;
  revenue_generated: number;
  peak_hours: { hour: number; count: number }[];
  payment_method_breakdown: { method: string; count: number; percentage: number }[];
  top_products: { product_name: string; purchase_count: number; revenue: number }[];
}

interface MachineCustomerData {
  machine_id: string;
  machine_name: string;
  location_name: string;
  total_interactions: number;
  success_rate: number;
  avg_session_duration: number;
  revenue_generated: number;
  last_interaction: string;
}

interface CustomerInteraction {
  id: string;
  machine_name: string;
  location_name: string;
  interaction_type: string;
  payment_method: string | null;
  amount_cents: number | null;
  occurred_at: string;
  session_duration_seconds: number | null;
  error_code: string | null;
  customer_feedback: string | null;
  product_name: string | null;
}

export default function CustomerAnalytics() {
  const [metrics, setMetrics] = useState<CustomerMetrics | null>(null);
  const [machineData, setMachineData] = useState<MachineCustomerData[]>([]);
  const [recentInteractions, setRecentInteractions] = useState<CustomerInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadCustomerMetrics(),
        loadMachineCustomerData(),
        loadRecentInteractions()
      ]);
    } catch (error) {
      toast.error("Failed to load customer analytics");
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerMetrics = async () => {
    const daysBack = parseInt(dateRange.replace('d', ''));
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    const { data: interactions, error } = await supabase
      .from('customer_interactions')
      .select(`
        *,
        products(name),
        machines!inner(name),
        locations!inner(name)
      `)
      .gte('occurred_at', startDate.toISOString());

    if (error) throw error;

    if (!interactions?.length) {
      setMetrics({
        total_interactions: 0,
        total_purchases: 0,
        total_failed_purchases: 0,
        total_browse_sessions: 0,
        average_session_duration: 0,
        success_rate: 0,
        revenue_generated: 0,
        peak_hours: [],
        payment_method_breakdown: [],
        top_products: []
      });
      return;
    }

    // Calculate metrics
    const totalInteractions = interactions.length;
    const purchases = interactions.filter(i => i.interaction_type === 'purchase');
    const failedPurchases = interactions.filter(i => i.interaction_type === 'failed_purchase');
    const browseSessions = interactions.filter(i => i.interaction_type === 'browse');
    
    const totalPurchases = purchases.length;
    const totalFailedPurchases = failedPurchases.length;
    const totalBrowseSessions = browseSessions.length;
    
    const successRate = totalInteractions > 0 
      ? ((totalPurchases / (totalPurchases + totalFailedPurchases)) * 100) || 0
      : 0;

    const avgSessionDuration = interactions
      .filter(i => i.session_duration_seconds)
      .reduce((sum, i) => sum + (i.session_duration_seconds || 0), 0) / 
      Math.max(1, interactions.filter(i => i.session_duration_seconds).length);

    const revenueGenerated = purchases
      .reduce((sum, p) => sum + (p.amount_cents || 0), 0) / 100;

    // Peak hours analysis
    const hourCounts = new Array(24).fill(0);
    interactions.forEach(i => {
      const hour = new Date(i.occurred_at).getHours();
      hourCounts[hour]++;
    });
    const peakHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Payment method breakdown
    const paymentMethods = new Map<string, number>();
    purchases.forEach(p => {
      const method = p.payment_method || 'unknown';
      paymentMethods.set(method, (paymentMethods.get(method) || 0) + 1);
    });
    const paymentMethodBreakdown = Array.from(paymentMethods.entries())
      .map(([method, count]) => ({
        method,
        count,
        percentage: (count / totalPurchases) * 100
      }))
      .sort((a, b) => b.count - a.count);

    // Top products
    const productSales = new Map<string, { count: number; revenue: number }>();
    purchases.forEach(p => {
      const productName = p.products?.name || 'Unknown Product';
      const existing = productSales.get(productName) || { count: 0, revenue: 0 };
      productSales.set(productName, {
        count: existing.count + 1,
        revenue: existing.revenue + (p.amount_cents || 0) / 100
      });
    });
    const topProducts = Array.from(productSales.entries())
      .map(([product_name, data]) => ({
        product_name,
        purchase_count: data.count,
        revenue: data.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    setMetrics({
      total_interactions: totalInteractions,
      total_purchases: totalPurchases,
      total_failed_purchases: totalFailedPurchases,
      total_browse_sessions: totalBrowseSessions,
      average_session_duration: avgSessionDuration,
      success_rate: successRate,
      revenue_generated: revenueGenerated,
      peak_hours: peakHours,
      payment_method_breakdown: paymentMethodBreakdown,
      top_products: topProducts
    });
  };

  const loadMachineCustomerData = async () => {
    const daysBack = parseInt(dateRange.replace('d', ''));
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('customer_interactions')
      .select(`
        machine_id,
        interaction_type,
        amount_cents,
        session_duration_seconds,
        occurred_at,
        machines!inner(name),
        locations!inner(name)
      `)
      .gte('occurred_at', startDate.toISOString());

    if (error) throw error;

    // Group by machine
    const machineMap = new Map<string, {
      machine_name: string;
      location_name: string;
      interactions: any[];
    }>();

    data?.forEach(interaction => {
      const machineId = interaction.machine_id;
      if (!machineMap.has(machineId)) {
        machineMap.set(machineId, {
          machine_name: interaction.machines?.name || 'Unknown',
          location_name: interaction.locations?.name || 'Unknown',
          interactions: []
        });
      }
      machineMap.get(machineId)!.interactions.push(interaction);
    });

    const machineCustomerData: MachineCustomerData[] = Array.from(machineMap.entries())
      .map(([machineId, data]) => {
        const interactions = data.interactions;
        const purchases = interactions.filter(i => i.interaction_type === 'purchase');
        const failedPurchases = interactions.filter(i => i.interaction_type === 'failed_purchase');
        
        const successRate = (purchases.length + failedPurchases.length) > 0
          ? (purchases.length / (purchases.length + failedPurchases.length)) * 100
          : 0;

        const avgSessionDuration = interactions
          .filter(i => i.session_duration_seconds)
          .reduce((sum, i) => sum + (i.session_duration_seconds || 0), 0) / 
          Math.max(1, interactions.filter(i => i.session_duration_seconds).length);

        const revenueGenerated = purchases
          .reduce((sum, p) => sum + (p.amount_cents || 0), 0) / 100;

        const lastInteraction = interactions
          .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())[0]
          ?.occurred_at || '';

        return {
          machine_id: machineId,
          machine_name: data.machine_name,
          location_name: data.location_name,
          total_interactions: interactions.length,
          success_rate: successRate,
          avg_session_duration: avgSessionDuration,
          revenue_generated: revenueGenerated,
          last_interaction: lastInteraction
        };
      })
      .sort((a, b) => b.revenue_generated - a.revenue_generated);

    setMachineData(machineCustomerData);
  };

  const loadRecentInteractions = async () => {
    const { data, error } = await supabase
      .from('customer_interactions')
      .select(`
        *,
        machines!inner(name),
        locations!inner(name),
        products(name)
      `)
      .order('occurred_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    setRecentInteractions(data?.map(interaction => ({
      ...interaction,
      machine_name: interaction.machines?.name || 'Unknown',
      location_name: interaction.locations?.name || 'Unknown',
      product_name: interaction.products?.name || null
    })) || []);
  };

  const exportAnalytics = () => {
    const csvData = [
      ['Metric', 'Value'],
      ['Total Interactions', metrics?.total_interactions.toString() || '0'],
      ['Total Purchases', metrics?.total_purchases.toString() || '0'],
      ['Failed Purchases', metrics?.total_failed_purchases.toString() || '0'],
      ['Success Rate', `${metrics?.success_rate.toFixed(1)}%` || '0%'],
      ['Revenue Generated', `$${metrics?.revenue_generated.toFixed(2)}` || '$0.00'],
      ['Average Session Duration', `${metrics?.average_session_duration.toFixed(0)}s` || '0s'],
      [''],
      ['Top Products', ''],
      ...((metrics?.top_products || []).map(p => [p.product_name, `$${p.revenue.toFixed(2)}`])),
      [''],
      ['Payment Methods', ''],
      ...((metrics?.payment_method_breakdown || []).map(pm => [pm.method, `${pm.percentage.toFixed(1)}%`]))
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer_analytics_${dateRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customer Analytics</h1>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-border rounded-md"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportAnalytics} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Total Interactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.total_interactions.toLocaleString() || '0'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-emerald-600" />
              Successful Purchases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {metrics?.total_purchases.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.success_rate.toFixed(1)}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              Failed Purchases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics?.total_failed_purchases.toLocaleString() || '0'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Revenue Generated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${metrics?.revenue_generated.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg: ${((metrics?.revenue_generated || 0) / Math.max(1, metrics?.total_purchases || 1)).toFixed(2)} per purchase
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="machines">By Machine</TabsTrigger>
          <TabsTrigger value="products">Top Products</TabsTrigger>
          <TabsTrigger value="interactions">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Peak Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Peak Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics?.peak_hours.map(({ hour, count }) => (
                    <div key={hour} className="flex items-center justify-between">
                      <span className="text-sm">
                        {hour === 0 ? '12 AM' : 
                         hour < 12 ? `${hour} AM` : 
                         hour === 12 ? '12 PM' : `${hour - 12} PM`}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ 
                              width: `${(count / Math.max(...(metrics?.peak_hours.map(h => h.count) || [1]))) * 100}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Methods
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics?.payment_method_breakdown.map(({ method, count, percentage }) => (
                    <div key={method} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{method}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div 
                            className="bg-emerald-500 h-2 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Additional Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {metrics?.average_session_duration.toFixed(0)}s
                  </div>
                  <p className="text-sm text-muted-foreground">Average Session Duration</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {metrics?.total_browse_sessions.toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">Browse Sessions</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {((metrics?.total_purchases || 0) / Math.max(1, (metrics?.total_interactions || 1)) * 100).toFixed(1)}%
                  </div>
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="machines" className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="p-3 font-semibold">Machine</th>
                  <th className="p-3 font-semibold">Location</th>
                  <th className="p-3 font-semibold">Interactions</th>
                  <th className="p-3 font-semibold">Success Rate</th>
                  <th className="p-3 font-semibold">Avg Session</th>
                  <th className="p-3 font-semibold">Revenue</th>
                  <th className="p-3 font-semibold">Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {machineData.map(machine => (
                  <tr key={machine.machine_id} className="border-b last:border-b-0 hover:bg-muted/50">
                    <td className="p-3 font-medium">{machine.machine_name}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {machine.location_name}
                      </div>
                    </td>
                    <td className="p-3">{machine.total_interactions}</td>
                    <td className="p-3">
                      <span className={`font-medium ${
                        machine.success_rate >= 80 ? 'text-emerald-600' :
                        machine.success_rate >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {machine.success_rate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-3">{machine.avg_session_duration.toFixed(0)}s</td>
                    <td className="p-3 font-medium">${machine.revenue_generated.toFixed(2)}</td>
                    <td className="p-3 text-sm">
                      {machine.last_interaction 
                        ? new Date(machine.last_interaction).toLocaleDateString()
                        : 'Never'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics?.top_products.map((product, index) => (
              <Card key={product.product_name}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{product.product_name}</CardTitle>
                    <Badge variant={index < 3 ? 'default' : 'secondary'}>
                      #{index + 1}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Sales</span>
                      <div className="font-semibold">{product.purchase_count}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Revenue</span>
                      <div className="font-semibold text-emerald-600">${product.revenue.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-xs text-muted-foreground">Avg per sale: </span>
                    <span className="text-xs font-medium">
                      ${(product.revenue / product.purchase_count).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="interactions" className="space-y-4">
          <div className="space-y-3">
            {recentInteractions.slice(0, 20).map(interaction => (
              <Card key={interaction.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        interaction.interaction_type === 'purchase' ? 'bg-emerald-500' :
                        interaction.interaction_type === 'failed_purchase' ? 'bg-red-500' :
                        interaction.interaction_type === 'browse' ? 'bg-blue-500' : 'bg-gray-500'
                      }`} />
                      
                      <div>
                        <h3 className="font-medium">
                          {interaction.interaction_type === 'purchase' ? 'Purchase' :
                           interaction.interaction_type === 'failed_purchase' ? 'Failed Purchase' :
                           interaction.interaction_type === 'browse' ? 'Browse Session' : 
                           interaction.interaction_type}
                        </h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          {interaction.machine_name} - {interaction.location_name}
                          <span>•</span>
                          {new Date(interaction.occurred_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      {interaction.product_name && (
                        <span className="text-muted-foreground">{interaction.product_name}</span>
                      )}
                      {interaction.payment_method && (
                        <Badge variant="outline" className="capitalize">
                          {interaction.payment_method}
                        </Badge>
                      )}
                      {interaction.amount_cents && (
                        <span className="font-medium text-emerald-600">
                          ${(interaction.amount_cents / 100).toFixed(2)}
                        </span>
                      )}
                      {interaction.session_duration_seconds && (
                        <span className="text-muted-foreground">
                          {interaction.session_duration_seconds}s
                        </span>
                      )}
                    </div>
                  </div>

                  {interaction.error_code && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                      <AlertTriangle className="h-3 w-3 inline mr-1" />
                      Error: {interaction.error_code}
                    </div>
                  )}

                  {interaction.customer_feedback && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                      <Star className="h-3 w-3 inline mr-1" />
                      <strong>Feedback:</strong> {interaction.customer_feedback}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}