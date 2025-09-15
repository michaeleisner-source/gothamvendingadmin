import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, TrendingUp, MapPin, Calendar, Users, Calculator } from "lucide-react";
import { HelpTooltip } from "@/components/ui/HelpTooltip";

interface CommissionData {
  location_id: string;
  location_name: string;
  commission_model: string;
  gross_revenue: number;
  commission_amount: number;
  commission_pct_bps: number;
  commission_flat_cents: number;
  commission_min_cents: number;
}

const CommissionDashboard = () => {
  const [commissionData, setCommissionData] = useState<CommissionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(30); // days
  const { toast } = useToast();

  useEffect(() => {
    loadCommissionData();
  }, [dateRange]);

  const loadCommissionData = async () => {
    setLoading(true);
    try {
      // Get locations with commission settings
      const { data: locations, error: locError } = await supabase
        .from("locations")
        .select("id, name, commission_model, commission_pct_bps, commission_flat_cents, commission_min_cents")
        .not("commission_model", "eq", "none");

      if (locError) throw locError;

      // Get sales data for the period
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);

      const { data: sales, error: salesError } = await supabase
        .from("sales")
        .select(`
          qty, unit_price_cents, machine_id,
          machines!inner(location_id)
        `)
        .gte("occurred_at", startDate.toISOString());

      if (salesError) throw salesError;

      // Calculate commissions
      const commissions = locations?.map(location => {
        const locationSales = sales?.filter(sale => 
          sale.machines?.location_id === location.id
        ) || [];

        const gross_revenue = locationSales.reduce((sum, sale) => 
          sum + (sale.qty * sale.unit_price_cents), 0) / 100; // Convert to dollars

        let commission_amount = 0;
        const pctBps = location.commission_pct_bps || 0;
        const flatCents = location.commission_flat_cents || 0;
        const minCents = location.commission_min_cents || 0;

        // Calculate based on commission model
        switch (location.commission_model) {
          case "percent_gross":
            commission_amount = gross_revenue * (pctBps / 10000);
            break;
          case "flat_month":
            commission_amount = (flatCents / 100) * (dateRange / 30); // Pro-rate for period
            break;
          case "hybrid":
            const percentComponent = gross_revenue * (pctBps / 10000);
            const flatComponent = (flatCents / 100) * (dateRange / 30);
            commission_amount = percentComponent + flatComponent;
            break;
        }

        // Apply minimum if set
        const minAmount = (minCents / 100) * (dateRange / 30);
        if (minAmount > 0 && commission_amount < minAmount) {
          commission_amount = minAmount;
        }

        return {
          location_id: location.id,
          location_name: location.name || "Unknown Location",
          commission_model: location.commission_model || "none",
          gross_revenue,
          commission_amount,
          commission_pct_bps: pctBps,
          commission_flat_cents: flatCents,
          commission_min_cents: minCents,
        };
      }) || [];

      setCommissionData(commissions);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to load commission data: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const kpis = useMemo(() => {
    const totalCommissions = commissionData.reduce((sum, item) => sum + item.commission_amount, 0);
    const totalRevenue = commissionData.reduce((sum, item) => sum + item.gross_revenue, 0);
    const avgCommissionRate = totalRevenue > 0 ? (totalCommissions / totalRevenue) * 100 : 0;
    const locationsWithCommissions = commissionData.filter(item => item.commission_amount > 0).length;

    return {
      totalCommissions,
      totalRevenue,
      avgCommissionRate,
      locationsWithCommissions,
      totalLocations: commissionData.length
    };
  }, [commissionData]);

  const formatCurrency = (amount: number) => 
    amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  const formatPercent = (value: number) => `${value.toFixed(2)}%`;

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
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
            <Calculator className="h-6 w-6" />
            Commission Dashboard
          </h1>
          <p className="text-muted-foreground">
            Track commission calculations and payouts for location partners
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
          <Button onClick={loadCommissionData} variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(kpis.totalCommissions)}
            </div>
            <p className="text-xs text-muted-foreground">
              Last {dateRange} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Commission Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercent(kpis.avgCommissionRate)}
            </div>
            <p className="text-xs text-muted-foreground">
              Of gross revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpis.locationsWithCommissions}
            </div>
            <p className="text-xs text-muted-foreground">
              Of {kpis.totalLocations} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(kpis.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Gross sales
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Commission Details Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Commission Details by Location
              <HelpTooltip content="Detailed breakdown of commission calculations for each location based on their contract terms and sales performance." />
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {commissionData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Location</th>
                    <th className="text-left p-2">Model</th>
                    <th className="text-right p-2">Gross Revenue</th>
                    <th className="text-right p-2">Commission Rate</th>
                    <th className="text-right p-2">Commission Amount</th>
                    <th className="text-center p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {commissionData
                    .sort((a, b) => b.commission_amount - a.commission_amount)
                    .map((item) => (
                    <tr key={item.location_id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">{item.location_name}</td>
                      <td className="p-2">
                        <Badge variant="outline">
                          {item.commission_model.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </td>
                      <td className="p-2 text-right">{formatCurrency(item.gross_revenue)}</td>
                      <td className="p-2 text-right">
                        {item.commission_model === 'percent_gross' || item.commission_model === 'hybrid' 
                          ? `${(item.commission_pct_bps / 100).toFixed(2)}%`
                          : item.commission_model === 'flat_month'
                          ? formatCurrency(item.commission_flat_cents / 100) + '/mo'
                          : 'N/A'
                        }
                      </td>
                      <td className="p-2 text-right font-medium text-green-600">
                        {formatCurrency(item.commission_amount)}
                      </td>
                      <td className="p-2 text-center">
                        <Badge variant={item.commission_amount > 0 ? "default" : "secondary"}>
                          {item.commission_amount > 0 ? "Due" : "None"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No commission data found for the selected period</p>
              <p className="text-sm">Locations must have commission models configured and sales data to appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CommissionDashboard;