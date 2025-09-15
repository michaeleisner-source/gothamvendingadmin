import React, { useState, useMemo } from "react";
import { Download, Receipt, Info, Calendar } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { OptimizedLoadingState } from "@/components/common/OptimizedLoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCommissionData } from "@/hooks/useCommissionData";
import { money } from "@/lib/utils";
import { downloadCsvWithTimestamp } from "@/lib/csv-utils";

interface CommissionRow {
  location_id: string;
  location_name: string;
  model: string;
  pct_bps: number;
  flat_month: number;
  min_month: number;
  gross: number;
  commission_due: number;
}

interface DateRange {
  startISO: string;
  endISO: string;
  label: string;
}

function getDateRanges(): Record<string, DateRange> {
  const now = new Date();
  
  // Last full month
  const firstOfThisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const lastMonth = new Date(firstOfThisMonth.getTime() - 1);
  const startLastMonth = new Date(Date.UTC(lastMonth.getUTCFullYear(), lastMonth.getUTCMonth(), 1));
  
  // Current month (month-to-date)
  const startThisMonth = firstOfThisMonth;
  const endThisMonth = now;
  
  // Last 3 months
  const start3Months = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 3, 1));
  
  // Year-to-date
  const startYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  
  return {
    lastMonth: {
      startISO: startLastMonth.toISOString(),
      endISO: lastMonth.toISOString(),
      label: startLastMonth.toLocaleDateString(undefined, { year: "numeric", month: "long" })
    },
    thisMonth: {
      startISO: startThisMonth.toISOString(),
      endISO: endThisMonth.toISOString(),
      label: "Month to Date"
    },
    last3Months: {
      startISO: start3Months.toISOString(),
      endISO: now.toISOString(),
      label: "Last 3 Months"
    },
    yearToDate: {
      startISO: startYear.toISOString(),
      endISO: now.toISOString(),
      label: "Year to Date"
    }
  };
}

export default function LocationCommission() {
  const dateRanges = getDateRanges();
  const [selectedPeriod, setSelectedPeriod] = useState<string>("lastMonth");
  const currentRange = dateRanges[selectedPeriod];
  
  const { data, isLoading, error } = useCommissionData(currentRange.startISO, currentRange.endISO);

  const processedData = useMemo(() => {
    if (!data || !data.sales || !data.machines || !data.locations) {
      return { rows: [], totals: { gross: 0, commission: 0 } };
    }

    const { sales, machines, locations } = data;
    
    // Create lookup maps for better performance
    const machineMap = new Map(machines.map(m => [m.id, m]));
    const locationMap = new Map(locations.map(l => [l.id, l]));
    
    // Calculate gross revenue by location
    const grossByLocation = new Map<string, number>();
    
    for (const sale of sales) {
      const machine = machineMap.get(sale.machine_id);
      if (!machine?.location_id) continue;
      
      const locationId = machine.location_id;
      const grossCents = (sale.qty || 0) * (sale.unit_price_cents || 0);
      const currentGross = grossByLocation.get(locationId) || 0;
      grossByLocation.set(locationId, currentGross + grossCents / 100);
    }

    const rows: CommissionRow[] = [];
    let totalGross = 0;
    let totalCommission = 0;

    // Process locations with sales
    for (const [locationId, gross] of grossByLocation.entries()) {
      const location = locationMap.get(locationId);
      if (!location) continue;

      const commission = calculateCommission(location, gross);
      
      rows.push({
        location_id: locationId,
        location_name: location.name || locationId,
        model: location.commission_model || "none",
        pct_bps: location.commission_pct_bps || 0,
        flat_month: (location.commission_flat_cents || 0) / 100,
        min_month: (location.commission_min_cents || 0) / 100,
        gross,
        commission_due: commission,
      });

      totalGross += gross;
      totalCommission += commission;
    }

    // Process locations with no sales but minimum guarantees
    for (const location of locations) {
      if (grossByLocation.has(location.id)) continue;
      
      const hasMinimum = (location.commission_min_cents || 0) > 0;
      const hasFlat = location.commission_model === "flat_month" || location.commission_model === "hybrid";
      
      if (hasMinimum || hasFlat) {
        const commission = calculateCommission(location, 0);
        
        if (commission > 0) {
          rows.push({
            location_id: location.id,
            location_name: location.name || location.id,
            model: location.commission_model || "none",
            pct_bps: location.commission_pct_bps || 0,
            flat_month: (location.commission_flat_cents || 0) / 100,
            min_month: (location.commission_min_cents || 0) / 100,
            gross: 0,
            commission_due: commission,
          });
          
          totalCommission += commission;
        }
      }
    }

    rows.sort((a, b) => b.commission_due - a.commission_due);
    
    return {
      rows,
      totals: { gross: totalGross, commission: totalCommission }
    };
  }, [data]);

  const handleExport = () => {
    const headers = [
      "Location", "Model", "% (bps)", "Flat/mo", "Min/mo", 
      "Gross Revenue", "Commission Due", "Period"
    ];
    
    const csvData = [
      headers,
      ...processedData.rows.map(row => [
        row.location_name,
        labelModel(row.model),
        row.pct_bps.toString(),
        row.flat_month.toFixed(2),
        row.min_month.toFixed(2),
        row.gross.toFixed(2),
        row.commission_due.toFixed(2),
        currentRange.label
      ]),
      [
        "TOTALS", "", "", "", "",
        processedData.totals.gross.toFixed(2),
        processedData.totals.commission.toFixed(2),
        currentRange.label
      ]
    ];

    downloadCsvWithTimestamp("location_commission_report", csvData);
  };

  if (isLoading) return <OptimizedLoadingState />;
  if (error) return <ErrorState title="Failed to Load Commission Data" message={error?.message || "Unable to load commission data"} />;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Location Commission Report"
        description="Detailed commission calculations by location and time period"
        icon={Receipt}
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lastMonth">Last Full Month</SelectItem>
                  <SelectItem value="thisMonth">Month to Date</SelectItem>
                  <SelectItem value="last3Months">Last 3 Months</SelectItem>
                  <SelectItem value="yearToDate">Year to Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleExport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentRange.label}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Gross Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{money(processedData.totals.gross)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Commission Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{money(processedData.totals.commission)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="text-sm text-muted-foreground flex items-start gap-2 bg-muted/50 p-4 rounded-lg">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <span>
          Commission calculations are based on each location's commission settings 
          (percentage of gross, flat monthly fee, and minimum guarantees) for the selected period.
          Monthly fees are prorated based on the selected time period.
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commission Details by Location</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Location</th>
                  <th className="px-4 py-3 text-left font-medium">Model</th>
                  <th className="px-4 py-3 text-right font-medium">% (bps)</th>
                  <th className="px-4 py-3 text-right font-medium">Flat / mo</th>
                  <th className="px-4 py-3 text-right font-medium">Min / mo</th>
                  <th className="px-4 py-3 text-right font-medium">Gross Revenue</th>
                  <th className="px-4 py-3 text-right font-medium">Commission Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {processedData.rows.length > 0 ? (
                  processedData.rows.map((row, index) => (
                    <tr key={row.location_id} className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      <td className="px-4 py-3 font-medium">{row.location_name}</td>
                      <td className="px-4 py-3">{labelModel(row.model)}</td>
                      <td className="px-4 py-3 text-right">{row.pct_bps}</td>
                      <td className="px-4 py-3 text-right">{money(row.flat_month)}</td>
                      <td className="px-4 py-3 text-right">{money(row.min_month)}</td>
                      <td className="px-4 py-3 text-right">{money(row.gross)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-primary">
                        {money(row.commission_due)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No commission data found for {currentRange.label}
                    </td>
                  </tr>
                )}
              </tbody>
              {processedData.rows.length > 0 && (
                <tfoot className="bg-muted font-medium">
                  <tr>
                    <td className="px-4 py-3">Totals</td>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3 text-right">{money(processedData.totals.gross)}</td>
                    <td className="px-4 py-3 text-right font-bold text-primary">
                      {money(processedData.totals.commission)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function calculateCommission(location: any, gross: number): number {
  const model = location.commission_model || "none";
  const pctBps = location.commission_pct_bps || 0;
  const flatCents = location.commission_flat_cents || 0;
  const minCents = location.commission_min_cents || 0;
  
  const percentCommission = (model === "percent_gross" || model === "hybrid") 
    ? gross * (pctBps / 10000) : 0;
  const flatCommission = (model === "flat_month" || model === "hybrid") 
    ? flatCents / 100 : 0;
  const baseCommission = percentCommission + flatCommission;
  const minCommission = minCents / 100;
  
  return Math.max(baseCommission, minCommission);
}

function labelModel(model: string): string {
  switch (model) {
    case "percent_gross": return "% of Gross";
    case "flat_month": return "Flat Monthly";
    case "hybrid": return "Hybrid";
    default: return "None";
  }
}