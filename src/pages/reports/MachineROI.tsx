import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, Percent, Calendar, Trophy, AlertTriangle, Target, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { HelpTooltip } from "@/components/ui/HelpTooltip";

interface MachineROIData {
  machine_id: string;
  machine_name: string;
  total_investment: number;
  monthly_revenue: number;
  monthly_costs: number;
  net_profit: number;
  roi_percentage: number;
  payback_months: number;
  status: 'positive' | 'negative' | 'breaking_even';
}

export default function MachineROI() {
  const { data: machineROIData, isLoading, error } = useQuery({
    queryKey: ['machine-roi'],
    queryFn: async () => {
      // Fetch machines and their financial data
      const { data: machines, error: machinesError } = await supabase
        .from('machines')
        .select(`
          id,
          name,
          machine_finance!inner (
            purchase_price,
            monthly_payment,
            other_onetime_costs,
            insurance_monthly,
            telemetry_monthly,
            monthly_software_cost
          )
        `);

      if (machinesError) throw machinesError;

      // Fetch recent sales data (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('machine_id, qty, unit_price_cents, unit_cost_cents')
        .gte('occurred_at', thirtyDaysAgo.toISOString());

      if (salesError) throw salesError;

      // Calculate ROI for each machine
      const roiData: MachineROIData[] = machines?.map((machine: any) => {
        const finance = Array.isArray(machine.machine_finance) ? machine.machine_finance[0] : machine.machine_finance;
        const machineSales = salesData?.filter(sale => sale.machine_id === machine.id) || [];

        // Calculate total investment
        const purchasePrice = finance?.purchase_price || 0;
        const otherCosts = finance?.other_onetime_costs || 0;
        const totalInvestment = Number(purchasePrice) + Number(otherCosts);

        // Calculate monthly revenue from sales
        const totalRevenue = machineSales.reduce((sum, sale) => 
          sum + (sale.qty * (sale.unit_price_cents / 100)), 0
        );

        // Calculate monthly costs
        const monthlyPayment = finance?.monthly_payment || 0;
        const insurance = finance?.insurance_monthly || 0;
        const telemetry = finance?.telemetry_monthly || 0;
        const software = finance?.monthly_software_cost || 0;
        const monthlyCosts = Number(monthlyPayment) + Number(insurance) + Number(telemetry) + Number(software);

        // Calculate COGS
        const totalCOGS = machineSales.reduce((sum, sale) => 
          sum + (sale.qty * ((sale.unit_cost_cents || 0) / 100)), 0
        );

        const netProfit = totalRevenue - monthlyCosts - totalCOGS;
        const roiPercentage = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;
        const paybackMonths = netProfit > 0 ? totalInvestment / netProfit : Infinity;

        let status: 'positive' | 'negative' | 'breaking_even' = 'breaking_even';
        if (roiPercentage > 5) status = 'positive';
        else if (roiPercentage < -5) status = 'negative';

        return {
          machine_id: machine.id,
          machine_name: machine.name || 'Unnamed Machine',
          total_investment: totalInvestment,
          monthly_revenue: totalRevenue,
          monthly_costs: monthlyCosts + totalCOGS,
          net_profit: netProfit,
          roi_percentage: roiPercentage,
          payback_months: isFinite(paybackMonths) ? paybackMonths : 0,
          status
        };
      }) || [];

      return roiData.sort((a, b) => b.roi_percentage - a.roi_percentage);
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'positive':
        return <Badge variant="default" className="bg-green-100 text-green-800">Profitable</Badge>;
      case 'negative':
        return <Badge variant="destructive">Unprofitable</Badge>;
      default:
        return <Badge variant="secondary">Break Even</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Machine ROI Analysis</h1>
        </div>
        <div className="text-center py-8">Loading ROI data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Machine ROI Analysis</h1>
        </div>
        <div className="text-center py-8 text-red-500">
          Error loading ROI data: {error.message}
        </div>
      </div>
    );
  }

  const totalInvestment = machineROIData?.reduce((sum, machine) => sum + machine.total_investment, 0) || 0;
  const totalNetProfit = machineROIData?.reduce((sum, machine) => sum + machine.net_profit, 0) || 0;
  const totalRevenue = machineROIData?.reduce((sum, machine) => sum + machine.monthly_revenue, 0) || 0;
  const averageROI = machineROIData?.length ? 
    machineROIData.reduce((sum, machine) => sum + machine.roi_percentage, 0) / machineROIData.length : 0;
  
  // Advanced KPIs
  const bestPerformingMachine = machineROIData?.reduce((best, machine) => 
    machine.roi_percentage > (best?.roi_percentage || -Infinity) ? machine : best, null);
  const worstPerformingMachine = machineROIData?.reduce((worst, machine) => 
    machine.roi_percentage < (worst?.roi_percentage || Infinity) ? machine : worst, null);
  
  const profitableMachines = machineROIData?.filter(m => m.status === 'positive').length || 0;
  const unprofitableMachines = machineROIData?.filter(m => m.status === 'negative').length || 0;
  const breakEvenMachines = machineROIData?.filter(m => m.status === 'breaking_even').length || 0;
  
  const averagePayback = machineROIData?.filter(m => isFinite(m.payback_months) && m.payback_months > 0)
    .reduce((sum, machine, _, arr) => sum + machine.payback_months / arr.length, 0) || 0;
  
  const averageRevenuePerMachine = machineROIData?.length ? totalRevenue / machineROIData.length : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Machine ROI Analysis</h1>
        <HelpTooltip 
          content="Calculate return on investment for each vending machine. ROI is calculated as (Net Profit ÷ Total Investment) × 100. Data shows last 30 days of performance including revenue, costs, and payback periods."
          size="md"
        />
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Total Investment
              <HelpTooltip content="Sum of all machine purchase prices and one-time setup costs" size="sm" />
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInvestment)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {machineROIData?.length || 0} machines
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Total Net Profit
              <HelpTooltip content="Revenue minus all costs (COGS, financing, insurance, software) for the last 30 days" size="sm" />
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalNetProfit)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Monthly performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Average ROI
              <HelpTooltip content="Average return on investment across all machines. Positive ROI indicates profitable operations" size="sm" />
            </CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(averageROI)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Portfolio average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Avg Payback Period
              <HelpTooltip content="Average time in months to recover the initial investment at current profit rates" size="sm" />
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averagePayback > 0 ? `${averagePayback.toFixed(1)}mo` : '—'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Time to break even
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Performer</CardTitle>
            <Trophy className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {bestPerformingMachine ? formatPercentage(bestPerformingMachine.roi_percentage) : '—'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {bestPerformingMachine?.machine_name || 'No data'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Worst Performer</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {worstPerformingMachine ? formatPercentage(worstPerformingMachine.roi_percentage) : '—'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {worstPerformingMachine?.machine_name || 'No data'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue per Machine</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{formatCurrency(averageRevenuePerMachine)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Monthly average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Machine Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Machine Performance Distribution</CardTitle>
          <CardDescription>
            Breakdown of machine profitability status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950">
              <div className="text-2xl font-bold text-green-600">{profitableMachines}</div>
              <p className="text-sm text-green-700 dark:text-green-300">Profitable Machines</p>
              <p className="text-xs text-muted-foreground mt-1">ROI {'>'} 5%</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950">
              <div className="text-2xl font-bold text-yellow-600">{breakEvenMachines}</div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">Break-Even Machines</p>
              <p className="text-xs text-muted-foreground mt-1">ROI -5% to 5%</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-950">
              <div className="text-2xl font-bold text-red-600">{unprofitableMachines}</div>
              <p className="text-sm text-red-700 dark:text-red-300">Unprofitable Machines</p>
              <p className="text-xs text-muted-foreground mt-1">ROI {'<'} -5%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Machine ROI Table */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Machine Performance</CardTitle>
          <CardDescription>
            ROI analysis based on last 30 days of sales data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Machine</th>
                  <th className="text-right p-2">Investment</th>
                  <th className="text-right p-2">Revenue</th>
                  <th className="text-right p-2">Costs</th>
                  <th className="text-right p-2">Net Profit</th>
                  <th className="text-right p-2">ROI %</th>
                  <th className="text-right p-2">Payback (Months)</th>
                  <th className="text-center p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {machineROIData?.map((machine) => (
                  <tr key={machine.machine_id} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      <Link 
                        to={`/machines/${machine.machine_id}`}
                        className="font-medium hover:underline"
                      >
                        {machine.machine_name}
                      </Link>
                    </td>
                    <td className="text-right p-2">{formatCurrency(machine.total_investment)}</td>
                    <td className="text-right p-2">{formatCurrency(machine.monthly_revenue)}</td>
                    <td className="text-right p-2">{formatCurrency(machine.monthly_costs)}</td>
                    <td className="text-right p-2 font-medium">
                      {formatCurrency(machine.net_profit)}
                    </td>
                    <td className="text-right p-2 font-medium">
                      {formatPercentage(machine.roi_percentage)}
                    </td>
                    <td className="text-right p-2">
                      {machine.payback_months > 0 && isFinite(machine.payback_months) 
                        ? machine.payback_months.toFixed(1) 
                        : '—'
                      }
                    </td>
                    <td className="text-center p-2">
                      {getStatusBadge(machine.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}