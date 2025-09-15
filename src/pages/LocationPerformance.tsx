import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { 
  MapPin, DollarSign, TrendingUp, Activity, 
  Users, Calendar, BarChart3, AlertCircle 
} from "lucide-react";
import { HelpTooltip } from "@/components/ui/HelpTooltip";

interface LocationPerformance {
  location_id: string;
  location_name: string;
  machine_count: number;
  total_revenue: number;
  commission_amount: number;
  commission_model: string;
  contract_status: string;
  last_sale_date: string | null;
  avg_daily_revenue: number;
  performance_score: number;
}

const LocationPerformance = () => {
  const [performanceData, setPerformanceData] = useState<LocationPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(30);
  const { toast } = useToast();

  useEffect(() => {
    loadPerformanceData();
  }, [dateRange]);

  const loadPerformanceData = async () => {
    setLoading(true);
    try {
      // Get locations with their contract status
      const { data: locations, error: locError } = await supabase
        .from("locations")
        .select(`
          id, name, commission_model, commission_pct_bps, 
          commission_flat_cents, commission_min_cents,
          contracts(status, signed_at)
        `);

      if (locError) throw locError;

      // Get sales data for the period
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);

      const { data: sales, error: salesError } = await supabase
        .from("sales")
        .select(`
          qty, unit_price_cents, occurred_at, machine_id,
          machines!inner(location_id)
        `)
        .gte("occurred_at", startDate.toISOString());

      if (salesError) throw salesError;

      // Get machine counts per location
      const { data: machines, error: machError } = await supabase
        .from("machines")
        .select("id, location_id");

      if (machError) throw machError;

      // Process performance data
      const performance = locations?.map(location => {
        const locationSales = sales?.filter(sale => 
          sale.machines?.location_id === location.id
        ) || [];

        const machineCount = machines?.filter(m => m.location_id === location.id).length || 0;
        
        const total_revenue = locationSales.reduce((sum, sale) => 
          sum + (sale.qty * sale.unit_price_cents), 0) / 100;

        // Calculate commission
        let commission_amount = 0;
        const pctBps = location.commission_pct_bps || 0;
        const flatCents = location.commission_flat_cents || 0;
        const minCents = location.commission_min_cents || 0;

        switch (location.commission_model) {
          case "percent_gross":
            commission_amount = total_revenue * (pctBps / 10000);
            break;
          case "flat_month":
            commission_amount = (flatCents / 100) * (dateRange / 30);
            break;
          case "hybrid":
            const percentComponent = total_revenue * (pctBps / 10000);
            const flatComponent = (flatCents / 100) * (dateRange / 30);
            commission_amount = percentComponent + flatComponent;
            break;
        }

        // Apply minimum if set
        const minAmount = (minCents / 100) * (dateRange / 30);
        if (minAmount > 0 && commission_amount < minAmount) {
          commission_amount = minAmount;
        }

        const lastSale = locationSales
          .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())[0];

        const avg_daily_revenue = total_revenue / dateRange;
        
        // Calculate performance score (0-100)
        const revenueScore = Math.min(100, (avg_daily_revenue / 50) * 100); // $50/day = 100 score
        const machineUtilization = machineCount > 0 ? Math.min(100, (total_revenue / machineCount / 500) * 100) : 0;
        const recencyScore = lastSale ? Math.max(0, 100 - ((Date.now() - new Date(lastSale.occurred_at).getTime()) / (1000 * 60 * 60 * 24))) : 0;
        
        const performance_score = (revenueScore + machineUtilization + recencyScore) / 3;

        return {
          location_id: location.id,
          location_name: location.name || "Unknown Location",
          machine_count: machineCount,
          total_revenue,
          commission_amount,
          commission_model: location.commission_model || "none",
          contract_status: location.contracts?.[0]?.signed_at ? "signed" : "draft",
          last_sale_date: lastSale?.occurred_at || null,
          avg_daily_revenue,
          performance_score: Math.round(performance_score),
        };
      }) || [];

      setPerformanceData(performance);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to load performance data: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const kpis = useMemo(() => {
    const totalRevenue = performanceData.reduce((sum, item) => sum + item.total_revenue, 0);
    const totalCommissions = performanceData.reduce((sum, item) => sum + item.commission_amount, 0);
    const avgPerformanceScore = performanceData.length > 0 
      ? performanceData.reduce((sum, item) => sum + item.performance_score, 0) / performanceData.length
      : 0;
    const topPerformers = performanceData.filter(item => item.performance_score >= 80).length;
    const underperformers = performanceData.filter(item => item.performance_score < 40).length;

    return {
      totalRevenue,
      totalCommissions,
      avgPerformanceScore: Math.round(avgPerformanceScore),
      topPerformers,
      underperformers,
      totalLocations: performanceData.length
    };
  }, [performanceData]);

  const getPerformanceBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 60) return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
    if (score >= 40) return <Badge className="bg-yellow-100 text-yellow-800">Average</Badge>;
    return <Badge className="bg-red-100 text-red-800">Needs Attention</Badge>;
  };

  const formatCurrency = (amount: number) => 
    amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No sales";
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Location Performance
          </h1>
          <p className="text-muted-foreground">
            Analyze revenue, commissions, and performance across all locations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(Number(e.target.value))}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <Button onClick={loadPerformanceData} variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(kpis.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">Last {dateRange} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.avgPerformanceScore}</div>
            <p className="text-xs text-muted-foreground">Out of 100</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performers</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{kpis.topPerformers}</div>
            <p className="text-xs text-muted-foreground">Score ≥80</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Need Attention</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{kpis.underperformers}</div>
            <p className="text-xs text-muted-foreground">Score &lt;40</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(kpis.totalCommissions)}
            </div>
            <p className="text-xs text-muted-foreground">Period total</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Location Performance Details
            <HelpTooltip content="Performance score is calculated based on revenue generation, machine utilization, and sales recency. Scores: 80+ Excellent, 60-79 Good, 40-59 Average, <40 Needs Attention." />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {performanceData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Location</th>
                    <th className="text-center p-3">Machines</th>
                    <th className="text-right p-3">Revenue</th>
                    <th className="text-right p-3">Avg Daily</th>
                    <th className="text-right p-3">Commission</th>
                    <th className="text-center p-3">Last Sale</th>
                    <th className="text-center p-3">Performance</th>
                    <th className="text-center p-3">Contract</th>
                    <th className="text-center p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceData
                    .sort((a, b) => b.performance_score - a.performance_score)
                    .map((location) => (
                    <tr key={location.location_id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{location.location_name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center">{location.machine_count}</td>
                      <td className="p-3 text-right font-medium">
                        {formatCurrency(location.total_revenue)}
                      </td>
                      <td className="p-3 text-right">
                        {formatCurrency(location.avg_daily_revenue)}
                      </td>
                      <td className="p-3 text-right text-green-600">
                        {formatCurrency(location.commission_amount)}
                      </td>
                      <td className="p-3 text-center">
                        {formatDate(location.last_sale_date)}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-bold">{location.performance_score}</span>
                          {getPerformanceBadge(location.performance_score)}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant={location.contract_status === "signed" ? "default" : "secondary"}>
                          {location.contract_status === "signed" ? "Signed" : "Draft"}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Link to={`/locations/${location.location_id}`}>
                          <Button variant="outline" size="sm">
                            <BarChart3 className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No location data found</p>
              <p className="text-sm">Add locations and start recording sales to see performance metrics.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationPerformance;