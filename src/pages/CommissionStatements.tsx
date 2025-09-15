import React, { useState, useMemo } from "react";
import { RefreshCw, Receipt, Info, Download } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { OptimizedLoadingState } from "@/components/common/OptimizedLoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { Button } from "@/components/ui/button";
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

function lastFullMonthRange(): { startISO: string; endISO: string; label: string } {
  const now = new Date();
  const firstOfThisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(firstOfThisMonth.getTime() - 1);
  const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
  const label = start.toLocaleDateString(undefined, { year: "numeric", month: "long" });
  return { startISO: start.toISOString(), endISO: end.toISOString(), label };
}

export default function CommissionStatements() {
  const [range] = useState(() => lastFullMonthRange());
  const { data, isLoading, error } = useCommissionData(range.startISO, range.endISO);

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
      "Gross (period)", "Commission Due", "Period"
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
        range.label
      ]),
      [
        "TOTALS", "", "", "", "",
        processedData.totals.gross.toFixed(2),
        processedData.totals.commission.toFixed(2),
        range.label
      ]
    ];

    downloadCsvWithTimestamp("location_commissions", csvData);
  };

  if (isLoading) return <OptimizedLoadingState />;
  if (error) return <ErrorState title="Failed to Load Commission Data" message={error?.message || "Unable to load commission data"} />;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Commission Statements"
        description={`Location commission calculations for ${range.label}`}
        icon={Receipt}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        }
      />

      <div className="text-sm text-muted-foreground flex items-start gap-2 bg-muted/50 p-4 rounded-lg">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <span>
          Commission calculations are based on each location's commission settings 
          (percentage of gross, flat monthly fee, and minimum guarantees) for the period.
        </span>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
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
                    No commission data found for {range.label}
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
      </div>
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