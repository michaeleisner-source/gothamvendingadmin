import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Package, AlertTriangle, TrendingDown, Clock, Zap } from 'lucide-react';
import { useSupabaseQuery } from '@/hooks/useOptimizedQuery';
import { format, subDays } from 'date-fns';

const InventoryInsights = () => {
  const { data: inventoryLevels = [] } = useSupabaseQuery(
    'inventory_levels',
    'id, machine_id, slot_id, product_id, current_qty, reorder_point, par_level, sales_velocity, days_of_supply, last_restocked_at',
    [],
    undefined,
    ['inventory-insights']
  ) as { data: any[] };

  const { data: products = [] } = useSupabaseQuery(
    'products',
    'id, name, category',
    [],
    undefined,
    ['products-for-inventory']
  ) as { data: any[] };

  const { data: machines = [] } = useSupabaseQuery(
    'machines',
    'id, name',
    [],
    undefined,
    ['machines-for-inventory']
  ) as { data: any[] };

  const { data: sales = [] } = useSupabaseQuery(
    'sales',
    'product_id, quantity_sold, occurred_at',
    [
      { column: 'occurred_at', operator: 'gte', value: subDays(new Date(), 30).toISOString() }
    ],
    { column: 'occurred_at', ascending: false },
    ['sales-for-inventory']
  ) as { data: any[] };

  const inventoryAnalysis = useMemo(() => {
    const productMap = products.reduce((acc, product) => {
      acc[product.id] = product;
      return acc;
    }, {} as Record<string, any>);

    const machineMap = machines.reduce((acc, machine) => {
      acc[machine.id] = machine;
      return acc;
    }, {} as Record<string, any>);

    // Calculate sales velocity for products
    const salesVelocity = sales.reduce((acc, sale) => {
      if (!acc[sale.product_id]) {
        acc[sale.product_id] = { quantity: 0, transactions: 0 };
      }
      acc[sale.product_id].quantity += sale.quantity_sold || 0;
      acc[sale.product_id].transactions += 1;
      return acc;
    }, {} as Record<string, any>);

    return inventoryLevels.map(level => {
      const product = productMap[level.product_id] || { name: 'Unknown Product', category: 'Unknown' };
      const machine = machineMap[level.machine_id] || { name: 'Unknown Machine' };
      const velocity = salesVelocity[level.product_id] || { quantity: 0, transactions: 0 };
      
      const stockLevel = level.current_qty || 0;
      const reorderPoint = level.reorder_point || 0;
      const parLevel = level.par_level || 0;
      const actualVelocity = velocity.quantity / 30; // units per day
      
      let status = 'good';
      if (stockLevel <= 0) status = 'out_of_stock';
      else if (stockLevel <= reorderPoint) status = 'low_stock';
      else if (stockLevel <= reorderPoint * 1.5) status = 'warning';

      return {
        id: level.id,
        productName: product.name,
        category: product.category,
        machineName: machine.name,
        currentQty: stockLevel,
        reorderPoint,
        parLevel,
        salesVelocity: actualVelocity,
        daysOfSupply: actualVelocity > 0 ? stockLevel / actualVelocity : 999,
        lastRestocked: level.last_restocked_at,
        status,
        fillRate: parLevel > 0 ? (stockLevel / parLevel) * 100 : 0,
        turnoverRate: velocity.quantity,
        needsRestock: stockLevel <= reorderPoint
      };
    });
  }, [inventoryLevels, products, machines, sales]);

  // Aggregate metrics
  const totalSlots = inventoryAnalysis.length;
  const outOfStock = inventoryAnalysis.filter(item => item.status === 'out_of_stock').length;
  const lowStock = inventoryAnalysis.filter(item => item.status === 'low_stock').length;
  const needsRestock = inventoryAnalysis.filter(item => item.needsRestock).length;
  const avgFillRate = inventoryAnalysis.reduce((sum, item) => sum + item.fillRate, 0) / totalSlots;

  // Category analysis
  const categoryAnalysis = inventoryAnalysis.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = {
        name: item.category,
        totalSlots: 0,
        outOfStock: 0,
        lowStock: 0,
        avgFillRate: 0,
        totalTurnover: 0
      };
    }
    acc[item.category].totalSlots += 1;
    if (item.status === 'out_of_stock') acc[item.category].outOfStock += 1;
    if (item.status === 'low_stock') acc[item.category].lowStock += 1;
    acc[item.category].avgFillRate += item.fillRate;
    acc[item.category].totalTurnover += item.turnoverRate;
    return acc;
  }, {} as Record<string, any>);

  const categoryData = Object.values(categoryAnalysis).map((cat: any) => ({
    ...cat,
    avgFillRate: cat.avgFillRate / cat.totalSlots,
    stockoutRate: (cat.outOfStock / cat.totalSlots) * 100
  }));

  // Fast/slow movers
  const fastMovers = inventoryAnalysis
    .filter(item => item.salesVelocity > 0.5) // More than 0.5 units per day
    .sort((a, b) => b.salesVelocity - a.salesVelocity)
    .slice(0, 10);

  const slowMovers = inventoryAnalysis
    .filter(item => item.salesVelocity < 0.1 && item.currentQty > 0) // Less than 0.1 units per day
    .sort((a, b) => a.salesVelocity - b.salesVelocity)
    .slice(0, 10);

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'out_of_stock': return <Badge variant="destructive">Out of Stock</Badge>;
      case 'low_stock': return <Badge className="bg-orange-100 text-orange-800">Low Stock</Badge>;
      case 'warning': return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'good': return <Badge className="bg-green-100 text-green-800">Good</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Inventory Insights</h2>
        <p className="text-muted-foreground">Comprehensive inventory analysis and optimization recommendations</p>
      </div>

      {/* Alerts */}
      {needsRestock > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {needsRestock} slot{needsRestock > 1 ? 's' : ''} need{needsRestock === 1 ? 's' : ''} immediate restocking. 
            Review the inventory levels below.
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Slots</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSlots}</div>
            <p className="text-xs text-muted-foreground">
              Inventory tracking points
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Restock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{needsRestock}</div>
            <p className="text-xs text-muted-foreground">
              Below reorder point
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStock}</div>
            <p className="text-xs text-muted-foreground">
              Zero inventory slots
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Fill Rate</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgFillRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Overall inventory level
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Category Performance</CardTitle>
            <CardDescription>Inventory status by product category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Bar dataKey="avgFillRate" fill="hsl(var(--chart-1))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stockout Rate by Category</CardTitle>
            <CardDescription>Percentage of out-of-stock items</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="stockoutRate"
                  label={({ name, value }) => `${name} ${value.toFixed(1)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Fast and Slow Movers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Fast Movers</CardTitle>
            <CardDescription>High-velocity products requiring frequent restocking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fastMovers.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-muted-foreground">{item.machineName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{item.salesVelocity.toFixed(2)} units/day</p>
                    <p className="text-xs text-muted-foreground">{item.currentQty} in stock</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Slow Movers</CardTitle>
            <CardDescription>Low-velocity products that may need attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {slowMovers.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-muted-foreground">{item.machineName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{item.salesVelocity.toFixed(2)} units/day</p>
                    <p className="text-xs text-muted-foreground">{item.currentQty} in stock</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Details */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Status Details</CardTitle>
          <CardDescription>Complete inventory overview with restock recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {inventoryAnalysis
              .sort((a, b) => {
                // Sort by priority: out of stock first, then low stock, then by fill rate
                if (a.status === 'out_of_stock' && b.status !== 'out_of_stock') return -1;
                if (b.status === 'out_of_stock' && a.status !== 'out_of_stock') return 1;
                if (a.status === 'low_stock' && b.status !== 'low_stock' && b.status !== 'out_of_stock') return -1;
                if (b.status === 'low_stock' && a.status !== 'low_stock' && a.status !== 'out_of_stock') return 1;
                return a.fillRate - b.fillRate;
              })
              .slice(0, 20)
              .map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div>
                    <h4 className="font-medium">{item.productName}</h4>
                    <p className="text-sm text-muted-foreground">
                      {item.machineName} • {item.category}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-sm font-medium">{item.currentQty}</p>
                    <p className="text-xs text-muted-foreground">Current</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm font-medium">{item.reorderPoint}</p>
                    <p className="text-xs text-muted-foreground">Reorder</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm font-medium">{item.fillRate.toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">Fill Rate</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm font-medium">{item.salesVelocity.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Velocity/Day</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      {item.daysOfSupply < 999 ? Math.round(item.daysOfSupply) : '∞'}
                    </p>
                    <p className="text-xs text-muted-foreground">Days Supply</p>
                  </div>
                  
                  {getStatusBadge(item.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryInsights;