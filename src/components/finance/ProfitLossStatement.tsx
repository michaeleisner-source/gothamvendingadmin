import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  PieChart,
  Download,
  Calendar,
  BarChart3
} from 'lucide-react';
import { useOptimizedQuery } from '@/hooks/useOptimizedQuery';
import { supabase } from '@/integrations/supabase/client';

interface ProfitLossData {
  period: string;
  revenue: {
    gross_sales: number;
    returns_allowances: number;
    net_sales: number;
  };
  cost_of_goods: {
    product_costs: number;
    inventory_adjustments: number;
    total_cogs: number;
  };
  gross_profit: number;
  operating_expenses: {
    machine_costs: number;
    route_expenses: number;
    maintenance: number;
    insurance: number;
    commissions: number;
    other_expenses: number;
    total_expenses: number;
  };
  operating_income: number;
  other_income: number;
  net_income: number;
  margins: {
    gross_margin: number;
    operating_margin: number;
    net_margin: number;
  };
}

export function ProfitLossStatement() {
  // Mock comprehensive P&L data - replace with real Supabase queries
  const plData: ProfitLossData = {
    period: "Year to Date 2024",
    revenue: {
      gross_sales: 125000,
      returns_allowances: 2500,
      net_sales: 122500
    },
    cost_of_goods: {
      product_costs: 68250,
      inventory_adjustments: 1200,
      total_cogs: 69450
    },
    gross_profit: 53050,
    operating_expenses: {
      machine_costs: 12500,
      route_expenses: 8200,
      maintenance: 4800,
      insurance: 3200,
      commissions: 9800,
      other_expenses: 2100,
      total_expenses: 40600
    },
    operating_income: 12450,
    other_income: 850,
    net_income: 13300,
    margins: {
      gross_margin: 43.3,
      operating_margin: 10.2,
      net_margin: 10.9
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercent = (percent: number) => {
    return `${percent.toFixed(1)}%`;
  };

  const getPerformanceColor = (value: number, benchmark: number) => {
    if (value >= benchmark) return 'text-green-600';
    if (value >= benchmark * 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Profit & Loss Statement</h2>
          <p className="text-muted-foreground">{plData.period}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Change Period
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <DollarSign className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Net Sales</p>
              <div className="text-2xl font-bold">{formatCurrency(plData.revenue.net_sales)}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <PieChart className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Gross Profit</p>
              <div className="text-2xl font-bold">{formatCurrency(plData.gross_profit)}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <BarChart3 className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Operating Income</p>
              <div className="text-2xl font-bold">{formatCurrency(plData.operating_income)}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <TrendingUp className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Net Income</p>
              <div className="text-2xl font-bold">{formatCurrency(plData.net_income)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed P&L Statement */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Statement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Revenue Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Revenue</h3>
              <div className="space-y-2 pl-4">
                <div className="flex justify-between items-center">
                  <span>Gross Sales</span>
                  <span className="font-medium">{formatCurrency(plData.revenue.gross_sales)}</span>
                </div>
                <div className="flex justify-between items-center text-red-600">
                  <span>Less: Returns & Allowances</span>
                  <span className="font-medium">({formatCurrency(plData.revenue.returns_allowances)})</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center font-semibold text-lg">
                    <span>Net Sales</span>
                    <span>{formatCurrency(plData.revenue.net_sales)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cost of Goods Sold */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Cost of Goods Sold</h3>
              <div className="space-y-2 pl-4">
                <div className="flex justify-between items-center">
                  <span>Product Costs</span>
                  <span className="font-medium">{formatCurrency(plData.cost_of_goods.product_costs)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Inventory Adjustments</span>
                  <span className="font-medium">{formatCurrency(plData.cost_of_goods.inventory_adjustments)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Total COGS</span>
                    <span>{formatCurrency(plData.cost_of_goods.total_cogs)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Gross Profit */}
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-lg font-semibold">Gross Profit</span>
                  <div className="text-sm text-muted-foreground">
                    Margin: {formatPercent(plData.margins.gross_margin)}
                  </div>
                </div>
                <span className="text-xl font-bold text-green-600">
                  {formatCurrency(plData.gross_profit)}
                </span>
              </div>
              <Progress value={plData.margins.gross_margin} className="mt-2" />
            </div>

            {/* Operating Expenses */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Operating Expenses</h3>
              <div className="space-y-2 pl-4">
                <div className="flex justify-between items-center">
                  <span>Machine Costs (Lease/Depreciation)</span>
                  <span className="font-medium">{formatCurrency(plData.operating_expenses.machine_costs)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Route & Delivery Expenses</span>
                  <span className="font-medium">{formatCurrency(plData.operating_expenses.route_expenses)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Maintenance & Repairs</span>
                  <span className="font-medium">{formatCurrency(plData.operating_expenses.maintenance)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Insurance</span>
                  <span className="font-medium">{formatCurrency(plData.operating_expenses.insurance)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Commissions</span>
                  <span className="font-medium">{formatCurrency(plData.operating_expenses.commissions)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Other Operating Expenses</span>
                  <span className="font-medium">{formatCurrency(plData.operating_expenses.other_expenses)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Total Operating Expenses</span>
                    <span>{formatCurrency(plData.operating_expenses.total_expenses)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Operating Income */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-lg font-semibold">Operating Income</span>
                  <div className="text-sm text-muted-foreground">
                    Margin: {formatPercent(plData.margins.operating_margin)}
                  </div>
                </div>
                <span className="text-xl font-bold text-blue-600">
                  {formatCurrency(plData.operating_income)}
                </span>
              </div>
              <Progress value={plData.margins.operating_margin * 4} className="mt-2" />
            </div>

            {/* Other Income & Net Income */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Other Income</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(plData.other_income)}
                </span>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xl font-bold">Net Income</span>
                    <div className="text-sm text-muted-foreground">
                      Net Margin: {formatPercent(plData.margins.net_margin)}
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-purple-600">
                    {formatCurrency(plData.net_income)}
                  </span>
                </div>
                <Progress value={plData.margins.net_margin * 4} className="mt-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Margin Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Gross Margin</span>
              <Badge variant={plData.margins.gross_margin >= 40 ? 'default' : 'secondary'}>
                {formatPercent(plData.margins.gross_margin)}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Operating Margin</span>
              <Badge variant={plData.margins.operating_margin >= 10 ? 'default' : 'secondary'}>
                {formatPercent(plData.margins.operating_margin)}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Net Margin</span>
              <Badge variant={plData.margins.net_margin >= 8 ? 'default' : 'secondary'}>
                {formatPercent(plData.margins.net_margin)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance Trends</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Revenue Growth</span>
              <div className="flex items-center text-green-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">+12.5%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Cost Control</span>
              <div className="flex items-center text-green-600">
                <TrendingDown className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">-3.2%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Profit Growth</span>
              <div className="flex items-center text-green-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">+18.7%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Key Ratios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">COGS Ratio</span>
              <span className="text-sm font-medium">56.7%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">OpEx Ratio</span>
              <span className="text-sm font-medium">33.1%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Break-even Sales</span>
              <span className="text-sm font-medium">{formatCurrency(109200)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
