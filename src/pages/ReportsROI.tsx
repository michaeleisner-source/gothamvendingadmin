import { Header } from "@/components/ui/Header";
import { FiltersBar } from "@/components/ui/FiltersBar";
import { SummaryCards } from "@/components/ui/SummaryCards";
import { DataTable } from "@/components/ui/DataTable";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { money } from "@/lib/utils";

export default function ReportsROI() {
  const { data: roiData, isLoading } = useQuery({
    queryKey: ['reports-roi'],
    queryFn: async () => {
      // Get machines with their finance info
      const { data: machines, error: machinesError } = await supabase
        .from('machines')
        .select(`
          id,
          name,
          created_at,
          machine_finance (
            acquisition_type,
            purchase_price,
            monthly_payment,
            term_months,
            life_months
          )
        `)
        .order('name');
      
      if (machinesError) throw machinesError;

      // Get sales data for ROI calculation (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('machine_id, qty, unit_price_cents, unit_cost_cents')
        .gte('occurred_at', thirtyDaysAgo);

      if (salesError) console.warn('Sales data not available:', salesError);

      // Group sales by machine
      const salesByMachine: Record<string, { revenue: number; cost: number }> = {};
      (salesData || []).forEach(sale => {
        if (!salesByMachine[sale.machine_id]) {
          salesByMachine[sale.machine_id] = { revenue: 0, cost: 0 };
        }
        salesByMachine[sale.machine_id].revenue += sale.qty * sale.unit_price_cents;
        salesByMachine[sale.machine_id].cost += sale.qty * (sale.unit_cost_cents || 0);
      });

      // Calculate ROI metrics for each machine
      const roiRows = (machines || []).map(machine => {
        const financeData = Array.isArray(machine.machine_finance) ? machine.machine_finance[0] : null;
        const invested = financeData?.purchase_price || 0;
        const monthlyPayment = financeData?.monthly_payment || 0;
        const lifeMonths = financeData?.life_months || 60; // Default 5 years
        
        // Calculate depreciation (straight line)
        const monthlyDepreciation = invested > 0 ? invested / lifeMonths : 0;
        const bookValue = Math.max(0, invested - (monthlyDepreciation * getMonthsSincePurchase(machine.created_at)));
        
        // Get profit from sales
        const machineSales = salesByMachine[machine.id] || { revenue: 0, cost: 0 };
        const monthlyProfit = (machineSales.revenue - machineSales.cost) / 100; // Convert from cents
        
        // Calculate break-even in months
        const breakEvenMonths = monthlyProfit > 0 ? invested / monthlyProfit : 999;

        return [
          machine.name,
          'N/A', // Location - TODO: Add location lookup if needed
          money(invested),
          money(bookValue),
          money(monthlyDepreciation),
          money(monthlyProfit),
          breakEvenMonths < 999 ? breakEvenMonths.toFixed(1) : '∞'
        ];
      });

      // Calculate summary metrics
      const totalInvested = (machines || []).reduce((sum, m) => {
        const financeData = Array.isArray(m.machine_finance) ? m.machine_finance[0] : null;
        return sum + (financeData?.purchase_price || 0);
      }, 0);

      const totalMonthlyDepreciation = roiRows.reduce((sum, row) => {
        const depValue = typeof row[4] === 'string' ? 
          parseFloat(row[4].replace('$', '').replace(',', '')) : 0;
        return sum + depValue;
      }, 0);

      const avgBreakEven = roiRows.filter(row => row[6] !== '∞').length > 0 ?
        roiRows
          .filter(row => row[6] !== '∞')
          .reduce((sum, row) => sum + parseFloat(row[6] as string), 0) / 
        roiRows.filter(row => row[6] !== '∞').length : 0;

      const totalOperatingProfit = Object.values(salesByMachine)
        .reduce((sum, sales) => sum + (sales.revenue - sales.cost), 0) / 100;

      return {
        rows: roiRows,
        totalInvested: money(totalInvested),
        monthlyDepreciation: money(totalMonthlyDepreciation),
        avgBreakEven: avgBreakEven > 0 ? `${avgBreakEven.toFixed(1)}` : '—',
        operatingProfit: money(totalOperatingProfit)
      };
    }
  });

  // Helper function to calculate months since purchase
  function getMonthsSincePurchase(createdAt: string): number {
    const purchaseDate = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - purchaseDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30)); // Approximate months
  }

  const { 
    rows = [], 
    totalInvested = '$—', 
    monthlyDepreciation = '$—', 
    avgBreakEven = '—', 
    operatingProfit = '$—' 
  } = roiData || {};

  return (
    <div className="p-4 space-y-4">
      <Header title="ROI & Depreciation" subtitle="Investment, depreciation, break-even by machine" />
      <FiltersBar />
      <SummaryCards items={[
        { label: 'Total Invested', value: totalInvested },
        { label: 'Monthly Depreciation', value: monthlyDepreciation },
        { label: 'Avg Break-even (mo)', value: avgBreakEven },
        { label: 'Operating Profit (period)', value: operatingProfit },
      ]} />
      <DataTable
        columns={["Machine", "Location", "Invested", "Book Value", "Depreciation/mo", "Profit/mo", "Break-even (mo)"]}
        data={rows}
        loading={isLoading}
      />
    </div>
  );
}