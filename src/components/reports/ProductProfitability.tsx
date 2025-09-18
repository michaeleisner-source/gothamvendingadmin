import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ScatterChart, Scatter, PieChart, Pie, Cell } from 'recharts';
import { Package, DollarSign, TrendingUp, Target, Download } from 'lucide-react';
import { useSupabaseQuery } from '@/hooks/useOptimizedQuery';
import { subDays } from 'date-fns';

const ProductProfitability = () => {
  const [timeRange, setTimeRange] = useState('30d');
  
  const getDaysBack = (range: string) => {
    switch (range) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      default: return 30;
    }
  };

  const { data: products = [] } = useSupabaseQuery(
    'products',
    'id, name, category, sku, price_cents, cost_cents',
    [],
    { column: 'name', ascending: true },
    ['products-profitability']
  ) as { data: any[] };

  const { data: sales = [] } = useSupabaseQuery(
    'sales',
    'product_id, product_name, total_amount, quantity_sold, occurred_at',
    [
      { column: 'occurred_at', operator: 'gte', value: subDays(new Date(), getDaysBack(timeRange)).toISOString() }
    ],
    { column: 'occurred_at', ascending: false },
    ['product-sales', timeRange]
  ) as { data: any[] };

  const productAnalysis = useMemo(() => {
    const productMap = products.reduce((acc, product) => {
      acc[product.id] = {
        ...product,
        margin: product.price_cents && product.cost_cents 
          ? ((product.price_cents - product.cost_cents) / product.price_cents) * 100 
          : 0
      };
      return acc;
    }, {} as Record<string, any>);

    const salesByProduct = sales.reduce((acc, sale) => {
      const productId = sale.product_id || 'unknown';
      const productName = sale.product_name || 'Unknown Product';
      
      if (!acc[productId]) {
        acc[productId] = {
          id: productId,
          name: productName,
          category: productMap[productId]?.category || 'Uncategorized',
          sku: productMap[productId]?.sku || '',
          revenue: 0,
          quantity: 0,
          transactions: 0,
          cost: 0,
          profit: 0,
          margin: 0,
          price: productMap[productId]?.price_cents || 0,
          avgPrice: 0
        };
      }
      
      const quantity = sale.quantity_sold || 1;
      const revenue = sale.total_amount || 0;
      const unitCost = productMap[productId]?.cost_cents || 0;
      const cost = (unitCost / 100) * quantity;
      
      acc[productId].revenue += revenue;
      acc[productId].quantity += quantity;
      acc[productId].transactions += 1;
      acc[productId].cost += cost;
      acc[productId].profit += (revenue - cost);
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(salesByProduct).map((product: any) => ({
      ...product,
      avgPrice: product.transactions > 0 ? product.revenue / product.quantity : 0,
      margin: product.revenue > 0 ? (product.profit / product.revenue) * 100 : 0,
      profitPerUnit: product.quantity > 0 ? product.profit / product.quantity : 0,
      velocityScore: product.quantity / getDaysBack(timeRange), // units per day
      profitability: product.profit > 20 ? 'high' : product.profit > 5 ? 'medium' : 'low'
    }));
  }, [products, sales, timeRange]);

  const totalRevenue = productAnalysis.reduce((sum, p) => sum + p.revenue, 0);
  const totalProfit = productAnalysis.reduce((sum, p) => sum + p.profit, 0);
  const totalQuantity = productAnalysis.reduce((sum, p) => sum + p.quantity, 0);
  const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  const topPerformers = productAnalysis
    .filter(p => p.revenue > 0)
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 10);

  const categoryAnalysis = productAnalysis.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = {
        name: product.category,
        revenue: 0,
        profit: 0,
        quantity: 0,
        products: 0
      };
    }
    acc[product.category].revenue += product.revenue;
    acc[product.category].profit += product.profit;
    acc[product.category].quantity += product.quantity;
    acc[product.category].products += 1;
    return acc;
  }, {} as Record<string, any>);

  const categoryData = Object.values(categoryAnalysis);

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  const getProfitabilityBadge = (profitability: string) => {
    switch (profitability) {
      case 'high': return <Badge className="bg-green-100 text-green-800">High</Badge>;
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'low': return <Badge className="bg-red-100 text-red-800">Low</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Product Profitability</h2>
          <p className="text-muted-foreground">Analyze product performance and profit margins</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
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
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From {productAnalysis.length} products
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalProfit.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {avgMargin.toFixed(1)}% average margin
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Units Sold</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuantity}</div>
            <p className="text-xs text-muted-foreground">
              Across all products
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Performer</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {topPerformers[0]?.name.slice(0, 8) || 'N/A'}...
            </div>
            <p className="text-xs text-muted-foreground">
              ${topPerformers[0]?.profit.toFixed(2) || '0'} profit
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Profitable Products</CardTitle>
            <CardDescription>Products with highest profit margins</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topPerformers}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Bar dataKey="profit" fill="hsl(var(--chart-1))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profit vs Volume</CardTitle>
            <CardDescription>Product performance matrix</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart data={productAnalysis.slice(0, 20)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="quantity" name="Quantity" />
                <YAxis dataKey="profit" name="Profit" />
                <Scatter data={productAnalysis.slice(0, 20)} fill="hsl(var(--chart-2))" />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Category Performance</CardTitle>
            <CardDescription>Revenue distribution by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="revenue"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Profit Analysis</CardTitle>
            <CardDescription>Profit by product category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Bar dataKey="profit" fill="hsl(var(--chart-3))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Product Details */}
      <Card>
        <CardHeader>
          <CardTitle>Product Performance Details</CardTitle>
          <CardDescription>Comprehensive profitability analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {productAnalysis
              .sort((a, b) => b.profit - a.profit)
              .slice(0, 20)
              .map((product) => (
              <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div>
                    <h4 className="font-medium">{product.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {product.category} • SKU: {product.sku}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-sm font-medium">${product.revenue.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm font-medium">${product.profit.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Profit</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm font-medium">{product.margin.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">Margin</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm font-medium">{product.quantity}</p>
                    <p className="text-xs text-muted-foreground">Units Sold</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm font-medium">{product.velocityScore.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Daily Velocity</p>
                  </div>
                  
                  {getProfitabilityBadge(product.profitability)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductProfitability;