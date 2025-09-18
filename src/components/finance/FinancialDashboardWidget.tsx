import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  PieChart,
  AlertTriangle,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function FinancialDashboardWidget() {
  const navigate = useNavigate();

  // Mock financial summary data
  const financialSummary = {
    net_income: 13300,
    gross_margin: 43.3,
    operating_margin: 10.2,
    cash_position: 20100,
    cash_runway_days: 180,
    monthly_burn: 3200,
    profit_trend: 18.7,
    commission_pending: 846,
    next_payment_date: '2024-12-15'
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getCashHealthColor = (days: number) => {
    if (days >= 120) return 'text-green-600';
    if (days >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Financial Overview</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Net Income & Margins */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Net Income (YTD)</span>
            <span className="font-bold text-green-600">{formatCurrency(financialSummary.net_income)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Gross Margin</span>
              <div className="font-medium">{financialSummary.gross_margin}%</div>
            </div>
            <div>
              <span className="text-muted-foreground">Operating Margin</span>
              <div className="font-medium">{financialSummary.operating_margin}%</div>
            </div>
          </div>
        </div>

        {/* Cash Position */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Cash Position</span>
            <span className="font-bold">{formatCurrency(financialSummary.cash_position)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Cash Runway</span>
            <span className={`font-medium ${getCashHealthColor(financialSummary.cash_runway_days)}`}>
              {financialSummary.cash_runway_days} days
            </span>
          </div>
          <Progress 
            value={Math.min((financialSummary.cash_runway_days / 365) * 100, 100)} 
            className="w-full h-2" 
          />
        </div>

        {/* Profit Trend */}
        <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">Profit Growth</span>
          </div>
          <span className="text-sm font-bold text-green-600">+{financialSummary.profit_trend}%</span>
        </div>

        {/* Commission Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Pending Commissions</span>
            <Badge variant="secondary" className="text-xs">
              {formatCurrency(financialSummary.commission_pending)}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            Next payment: {financialSummary.next_payment_date}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 border rounded">
            <div className="text-muted-foreground">Monthly Burn</div>
            <div className="font-medium">{formatCurrency(financialSummary.monthly_burn)}</div>
          </div>
          <div className="p-2 border rounded">
            <div className="text-muted-foreground">Break-even</div>
            <div className="font-medium text-green-600">
              <CheckCircle className="h-3 w-3 inline mr-1" />
              Met
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button 
            size="sm" 
            className="w-full justify-between"
            onClick={() => navigate('/finance/profit-loss')}
          >
            View P&L Statement
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="justify-center text-xs"
              onClick={() => navigate('/finance/cash-flow')}
            >
              <PieChart className="h-3 w-3 mr-1" />
              Cash Flow
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="justify-center text-xs"
              onClick={() => navigate('/finance/commissions')}
            >
              <DollarSign className="h-3 w-3 mr-1" />
              Commissions
            </Button>
          </div>
        </div>

        {/* Financial Alerts */}
        <div className="space-y-2">
          <div className="text-xs font-medium">Alerts & Actions</div>
          <div className="space-y-1">
            <div className="flex items-center text-xs p-2 bg-yellow-50 rounded border border-yellow-200">
              <AlertTriangle className="h-3 w-3 text-yellow-600 mr-2" />
              <span className="text-yellow-700">2 invoices due in 5 days</span>
            </div>
            <div className="flex items-center text-xs p-2 bg-green-50 rounded border border-green-200">
              <CheckCircle className="h-3 w-3 text-green-600 mr-2" />
              <span className="text-green-700">All commissions calculated</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}