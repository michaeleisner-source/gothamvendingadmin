import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area, BarChart, Bar, ComposedChart } from 'recharts';
import { TrendingUp, TrendingDown, BarChart as BarChartIcon, Calendar, Download } from 'lucide-react';
import { useSupabaseQuery } from '@/hooks/useOptimizedQuery';
import { format, subDays, startOfWeek, startOfMonth, endOfWeek, endOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';

const RevenueTrends = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [granularity, setGranularity] = useState('daily');
  
  const getDatesForRange = (range: string) => {
    const now = new Date();
    switch (range) {
      case '7d': return { start: subDays(now, 7), end: now };
      case '30d': return { start: subDays(now, 30), end: now };
      case '90d': return { start: subDays(now, 90), end: now };
      case '180d': return { start: subDays(now, 180), end: now };
      case '365d': return { start: subDays(now, 365), end: now };
      default: return { start: subDays(now, 30), end: now };
    }
  };

  const { start, end } = getDatesForRange(timeRange);
  
  const { data: sales = [] } = useSupabaseQuery(
    'sales',
    'total_amount, quantity_sold, occurred_at, product_name',
    [
      { column: 'occurred_at', operator: 'gte', value: start.toISOString() },
      { column: 'occurred_at', operator: 'lte', value: end.toISOString() }
    ],
    { column: 'occurred_at', ascending: true },
    ['revenue-trends', timeRange]
  ) as { data: any[] };

  const { data: previousSales = [] } = useSupabaseQuery(
    'sales',
    'total_amount, occurred_at',
    [
      { column: 'occurred_at', operator: 'gte', value: subDays(start, end.getTime() - start.getTime()).toISOString() },
      { column: 'occurred_at', operator: 'lt', value: start.toISOString() }
    ],
    { column: 'occurred_at', ascending: true },
    ['revenue-trends-previous', timeRange]
  ) as { data: any[] };

  const trendData = useMemo(() => {
    let intervals;
    let formatString;
    
    switch (granularity) {
      case 'weekly':
        intervals = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
        formatString = 'MMM dd';
        break;
      case 'monthly':
        intervals = eachMonthOfInterval({ start, end });
        formatString = 'MMM yyyy';
        break;
      default: // daily
        intervals = eachDayOfInterval({ start, end });
        formatString = 'MMM dd';
        break;
    }

    const groupedData = intervals.map(interval => {
      const intervalStart = granularity === 'weekly' ? startOfWeek(interval) : 
                           granularity === 'monthly' ? startOfMonth(interval) : interval;
      const intervalEnd = granularity === 'weekly' ? endOfWeek(interval) : 
                         granularity === 'monthly' ? endOfMonth(interval) : interval;

      const intervalSales = sales.filter(sale => {
        const saleDate = new Date(sale.occurred_at);
        return saleDate >= intervalStart && saleDate <= intervalEnd;
      });

      const revenue = intervalSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
      const transactions = intervalSales.length;
      const quantity = intervalSales.reduce((sum, sale) => sum + (sale.quantity_sold || 0), 0);
      const avgTransaction = transactions > 0 ? revenue / transactions : 0;

      return {
        date: format(intervalStart, formatString),
        revenue,
        transactions,
        quantity,
        avgTransaction,
        cumulativeRevenue: 0 // Will be calculated below
      };
    });

    // Calculate cumulative revenue
    let cumulative = 0;
    groupedData.forEach(item => {
      cumulative += item.revenue;
      item.cumulativeRevenue = cumulative;
    });

    return groupedData;
  }, [sales, start, end, granularity]);

  // Calculate period-over-period comparison
  const currentPeriodRevenue = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  const previousPeriodRevenue = previousSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  const revenueGrowth = previousPeriodRevenue > 0 
    ? ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 
    : 0;

  const currentPeriodTransactions = sales.length;
  const previousPeriodTransactions = previousSales.length;
  const transactionGrowth = previousPeriodTransactions > 0 
    ? ((currentPeriodTransactions - previousPeriodTransactions) / previousPeriodTransactions) * 100 
    : 0;

  const avgRevenuePerDay = trendData.length > 0 ? currentPeriodRevenue / trendData.length : 0;
  const avgTransactionsPerDay = trendData.length > 0 ? currentPeriodTransactions / trendData.length : 0;

  // Calculate trend line slope for revenue growth indicator
  const revenueValues = trendData.map(d => d.revenue);
  const isGrowingTrend = revenueValues.length > 1 && 
    revenueValues[revenueValues.length - 1] > revenueValues[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Revenue Trends</h2>
          <p className="text-muted-foreground">Track revenue patterns and growth over time</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={granularity} onValueChange={setGranularity}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="180d">Last 6 months</SelectItem>
              <SelectItem value="365d">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${currentPeriodRevenue.toFixed(2)}</div>
            <p className={`text-xs flex items-center ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {revenueGrowth >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {Math.abs(revenueGrowth).toFixed(1)}% vs previous period
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${avgRevenuePerDay.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Revenue per day
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <BarChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentPeriodTransactions}</div>
            <p className={`text-xs flex items-center ${transactionGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {transactionGrowth >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {Math.abs(transactionGrowth).toFixed(1)}% vs previous period
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Trend</CardTitle>
            {isGrowingTrend ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isGrowingTrend ? 'text-green-600' : 'text-red-600'}`}>
              {isGrowingTrend ? 'Growing' : 'Declining'}
            </div>
            <p className="text-xs text-muted-foreground">
              Overall trend direction
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Revenue performance over the selected time period</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="hsl(var(--primary))" 
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Combined Metrics Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Transactions</CardTitle>
            <CardDescription>Dual-axis comparison of revenue and transaction volume</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Bar yAxisId="left" dataKey="revenue" fill="hsl(var(--chart-1))" />
                <Line yAxisId="right" type="monotone" dataKey="transactions" stroke="hsl(var(--chart-2))" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cumulative Revenue</CardTitle>
            <CardDescription>Running total of revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Line 
                  type="monotone" 
                  dataKey="cumulativeRevenue" 
                  stroke="hsl(var(--chart-3))" 
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Details */}
      <Card>
        <CardHeader>
          <CardTitle>Average Transaction Value</CardTitle>
          <CardDescription>Transaction size trends over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Bar dataKey="avgTransaction" fill="hsl(var(--chart-4))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenueTrends;