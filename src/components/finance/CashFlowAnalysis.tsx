import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Download,
  Target
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Area, AreaChart } from 'recharts';

interface CashFlowData {
  period: string;
  operating_activities: {
    net_income: number;
    depreciation: number;
    accounts_receivable_change: number;
    inventory_change: number;
    accounts_payable_change: number;
    total_operating: number;
  };
  investing_activities: {
    machine_purchases: number;
    equipment_sales: number;
    total_investing: number;
  };
  financing_activities: {
    loan_proceeds: number;
    loan_payments: number;
    owner_draws: number;
    total_financing: number;
  };
  net_change: number;
  beginning_cash: number;
  ending_cash: number;
  cash_runway_days: number;
}

export function CashFlowAnalysis() {
  // Mock cash flow data - replace with real Supabase queries
  const cashFlowData: CashFlowData = {
    period: "Year to Date 2024",
    operating_activities: {
      net_income: 13300,
      depreciation: 8500,
      accounts_receivable_change: -2200,
      inventory_change: 1800,
      accounts_payable_change: 3100,
      total_operating: 24500
    },
    investing_activities: {
      machine_purchases: -15000,
      equipment_sales: 2500,
      total_investing: -12500
    },
    financing_activities: {
      loan_proceeds: 20000,
      loan_payments: -8400,
      owner_draws: -12000,
      total_financing: -400
    },
    net_change: 11600,
    beginning_cash: 8500,
    ending_cash: 20100,
    cash_runway_days: 180
  };

  // Mock monthly cash flow trends
  const monthlyData = [
    { month: 'Jan', operating: 3200, investing: -2100, financing: 800, net: 1900, cumulative: 10400 },
    { month: 'Feb', operating: 2800, investing: -800, financing: -1200, net: 800, cumulative: 11200 },
    { month: 'Mar', operating: 3500, investing: -5000, financing: 2000, net: 500, cumulative: 11700 },
    { month: 'Apr', operating: 2900, investing: -1200, financing: -800, net: 900, cumulative: 12600 },
    { month: 'May', operating: 3800, investing: -2200, financing: -1000, net: 600, cumulative: 13200 },
    { month: 'Jun', operating: 4200, investing: -600, financing: -1400, net: 2200, cumulative: 15400 },
    { month: 'Jul', operating: 3600, investing: -1800, financing: 1200, net: 3000, cumulative: 18400 },
    { month: 'Aug', operating: 4100, investing: -900, financing: -2000, net: 1200, cumulative: 19600 },
    { month: 'Sep', operating: 3900, investing: -1100, financing: -1800, net: 1000, cumulative: 20600 }
  ];

  // Cash flow forecast
  const forecastData = [
    { period: 'Oct 2024', conservative: 21800, optimistic: 23200, actual: null },
    { period: 'Nov 2024', conservative: 22500, optimistic: 25800, actual: null },
    { period: 'Dec 2024', conservative: 23200, optimistic: 28500, actual: null },
    { period: 'Jan 2025', conservative: 24000, optimistic: 31200, actual: null },
    { period: 'Feb 2025', conservative: 24800, optimistic: 34000, actual: null },
    { period: 'Mar 2025', conservative: 25600, optimistic: 36800, actual: null }
  ];

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

  const getCashHealthIcon = (days: number) => {
    if (days >= 120) return CheckCircle;
    if (days >= 60) return AlertTriangle;
    return AlertTriangle;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cash Flow Analysis</h2>
          <p className="text-muted-foreground">{cashFlowData.period}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Change Period
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Cash Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <DollarSign className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Operating Cash Flow</p>
              <div className="text-2xl font-bold">{formatCurrency(cashFlowData.operating_activities.total_operating)}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <TrendingDown className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Investing Cash Flow</p>
              <div className="text-2xl font-bold">{formatCurrency(cashFlowData.investing_activities.total_investing)}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Target className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Ending Cash</p>
              <div className="text-2xl font-bold">{formatCurrency(cashFlowData.ending_cash)}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            {React.createElement(getCashHealthIcon(cashFlowData.cash_runway_days), { 
              className: `h-8 w-8 ${getCashHealthColor(cashFlowData.cash_runway_days).replace('text-', '')}` 
            })}
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Cash Runway</p>
              <div className={`text-2xl font-bold ${getCashHealthColor(cashFlowData.cash_runway_days)}`}>
                {cashFlowData.cash_runway_days} days
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="statement" className="space-y-6">
        <TabsList>
          <TabsTrigger value="statement">Cash Flow Statement</TabsTrigger>
          <TabsTrigger value="trends">Trends & Analysis</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
        </TabsList>

        <TabsContent value="statement" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Statement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Operating Activities */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-green-700">Cash Flows from Operating Activities</h3>
                  <div className="space-y-2 pl-4">
                    <div className="flex justify-between items-center">
                      <span>Net Income</span>
                      <span className="font-medium">{formatCurrency(cashFlowData.operating_activities.net_income)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Depreciation & Amortization</span>
                      <span className="font-medium">{formatCurrency(cashFlowData.operating_activities.depreciation)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Changes in Accounts Receivable</span>
                      <span className="font-medium">({formatCurrency(Math.abs(cashFlowData.operating_activities.accounts_receivable_change))})</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Changes in Inventory</span>
                      <span className="font-medium">{formatCurrency(cashFlowData.operating_activities.inventory_change)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Changes in Accounts Payable</span>
                      <span className="font-medium">{formatCurrency(cashFlowData.operating_activities.accounts_payable_change)}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between items-center font-semibold text-lg bg-green-50 p-2 rounded">
                        <span>Net Cash from Operating Activities</span>
                        <span className="text-green-600">{formatCurrency(cashFlowData.operating_activities.total_operating)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Investing Activities */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-blue-700">Cash Flows from Investing Activities</h3>
                  <div className="space-y-2 pl-4">
                    <div className="flex justify-between items-center">
                      <span>Purchase of Machines & Equipment</span>
                      <span className="font-medium text-red-600">({formatCurrency(Math.abs(cashFlowData.investing_activities.machine_purchases))})</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Sale of Equipment</span>
                      <span className="font-medium">{formatCurrency(cashFlowData.investing_activities.equipment_sales)}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between items-center font-semibold text-lg bg-blue-50 p-2 rounded">
                        <span>Net Cash from Investing Activities</span>
                        <span className="text-blue-600">{formatCurrency(cashFlowData.investing_activities.total_investing)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financing Activities */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-purple-700">Cash Flows from Financing Activities</h3>
                  <div className="space-y-2 pl-4">
                    <div className="flex justify-between items-center">
                      <span>Loan Proceeds</span>
                      <span className="font-medium">{formatCurrency(cashFlowData.financing_activities.loan_proceeds)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Loan Payments</span>
                      <span className="font-medium text-red-600">({formatCurrency(Math.abs(cashFlowData.financing_activities.loan_payments))})</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Owner Draws</span>
                      <span className="font-medium text-red-600">({formatCurrency(Math.abs(cashFlowData.financing_activities.owner_draws))})</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between items-center font-semibold text-lg bg-purple-50 p-2 rounded">
                        <span>Net Cash from Financing Activities</span>
                        <span className="text-purple-600">{formatCurrency(cashFlowData.financing_activities.total_financing)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Net Change */}
                <div className="bg-gray-50 p-4 rounded-lg border-2">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center font-semibold">
                      <span>Net Increase in Cash</span>
                      <span>{formatCurrency(cashFlowData.net_change)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Cash at Beginning of Period</span>
                      <span>{formatCurrency(cashFlowData.beginning_cash)}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between items-center font-bold text-xl">
                        <span>Cash at End of Period</span>
                        <span className="text-green-600">{formatCurrency(cashFlowData.ending_cash)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Cash Flow Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Line type="monotone" dataKey="operating" stroke="#10B981" name="Operating" strokeWidth={2} />
                    <Line type="monotone" dataKey="investing" stroke="#3B82F6" name="Investing" strokeWidth={2} />
                    <Line type="monotone" dataKey="net" stroke="#8B5CF6" name="Net Change" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cumulative Cash Position</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Area type="monotone" dataKey="cumulative" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-green-700 mb-2">Operating Efficiency</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Operating Cash Ratio</span>
                      <Badge variant="default">184%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Cash Conversion Cycle</span>
                      <span className="text-sm font-medium">12 days</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-blue-700 mb-2">Investment Activity</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Capital Expenditure</span>
                      <span className="text-sm font-medium">{formatCurrency(15000)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Asset Turnover</span>
                      <Badge variant="secondary">2.1x</Badge>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-purple-700 mb-2">Financial Health</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Free Cash Flow</span>
                      <span className="text-sm font-medium">{formatCurrency(12000)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Cash Runway</span>
                      <Badge variant={cashFlowData.cash_runway_days >= 120 ? 'default' : 'destructive'}>
                        {cashFlowData.cash_runway_days} days
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecast" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>6-Month Cash Flow Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Line type="monotone" dataKey="conservative" stroke="#EF4444" name="Conservative" strokeWidth={2} strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="optimistic" stroke="#10B981" name="Optimistic" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Scenario Planning</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-semibold text-green-600 mb-2">Optimistic Scenario</h4>
                    <ul className="text-sm space-y-1">
                      <li>• 15% revenue growth</li>
                      <li>• New location installations</li>
                      <li>• Improved operational efficiency</li>
                    </ul>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-semibold text-red-600 mb-2">Conservative Scenario</h4>
                    <ul className="text-sm space-y-1">
                      <li>• 5% revenue growth</li>
                      <li>• Higher maintenance costs</li>
                      <li>• Market saturation challenges</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cash Management Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-semibold text-green-700 mb-1">Recommended Actions</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Maintain 90+ day cash reserve</li>
                      <li>• Accelerate receivables collection</li>
                      <li>• Optimize inventory levels</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-semibold text-yellow-700 mb-1">Risk Mitigation</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Establish credit line</li>
                      <li>• Diversify revenue streams</li>
                      <li>• Monitor key cash metrics</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}