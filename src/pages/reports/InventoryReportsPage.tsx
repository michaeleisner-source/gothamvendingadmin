import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Activity, AlertTriangle, Package, Calendar, BarChart3 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type RevPerProduct = { 
  product_id: string; 
  product_name: string | null; 
  orders: number; 
  qty_sold: number; 
  gross_revenue_cents: number; 
};

type Velocity = { 
  product_id: string; 
  product_name: string | null; 
  days: number; 
  qty_sold: number; 
  avg_per_day: number; 
};

type Dead = { 
  product_id: string; 
  product_name: string | null; 
};

function formatCurrency(cents?: number | null) { 
  const value = typeof cents === "number" ? cents : 0; 
  return (value / 100).toLocaleString(undefined, { style: "currency", currency: "USD" }); 
}

function isoStart(dateStr: string) { 
  return new Date(dateStr + "T00:00:00").toISOString(); 
}

function isoEnd(dateStr: string) { 
  return new Date(dateStr + "T23:59:59.999").toISOString(); 
}

export default function InventoryReportsPage() {
  const today = new Date();
  const defaultEnd = today.toISOString().slice(0, 10);
  const defaultStart = new Date(today.getTime() - 29 * 86400000).toISOString().slice(0, 10);
  
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);
  const [topSellers, setTopSellers] = useState<RevPerProduct[]>([]);
  const [velocity, setVelocity] = useState<Velocity[]>([]);
  const [deadStock, setDeadStock] = useState<Dead[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [topResult, velocityResult, deadResult] = await Promise.all([
        supabase.rpc("report_revenue_per_product", { 
          p_start: isoStart(start), 
          p_end: isoEnd(end) 
        }),
        supabase.rpc("report_inventory_velocity", { 
          p_start: isoStart(start), 
          p_end: isoEnd(end) 
        }),
        supabase.rpc("report_dead_stock", { 
          p_start: isoStart(start), 
          p_end: isoEnd(end) 
        }),
      ]);

      if (topResult.error) {
        console.error("Error loading top sellers:", topResult.error);
        toast({
          title: "Error",
          description: "Failed to load top sellers data.",
          variant: "destructive",
        });
      } else {
        setTopSellers(topResult.data || []);
      }

      if (velocityResult.error) {
        console.error("Error loading velocity data:", velocityResult.error);
        toast({
          title: "Error", 
          description: "Failed to load velocity data.",
          variant: "destructive",
        });
      } else {
        setVelocity(velocityResult.data || []);
      }

      if (deadResult.error) {
        console.error("Error loading dead stock:", deadResult.error);
        toast({
          title: "Error",
          description: "Failed to load dead stock data.",
          variant: "destructive",
        });
      } else {
        setDeadStock(deadResult.data || []);
      }

    } catch (error: any) {
      console.error('Error loading inventory reports:', error);
      toast({
        title: "Error",
        description: "Failed to load inventory reports.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    loadData(); 
  }, []);

  const totalRevenue = topSellers.reduce((sum, product) => sum + product.gross_revenue_cents, 0);
  const totalUnitsSold = topSellers.reduce((sum, product) => sum + product.qty_sold, 0);
  const avgVelocity = velocity.length > 0 ? velocity.reduce((sum, p) => sum + p.avg_per_day, 0) / velocity.length : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory Reports</h1>
          <p className="text-muted-foreground">Analyze product performance and inventory velocity</p>
        </div>
      </div>

      {/* Date Range Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Analysis Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button onClick={loadData} disabled={loading} className="shrink-0">
              {loading ? "Loading..." : "Refresh Data"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-success">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">From all products</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-info">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Units Sold</CardTitle>
            <Package className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">{totalUnitsSold.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total quantity moved</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Daily Velocity</CardTitle>
            <Activity className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{avgVelocity.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Units per day per product</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dead Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{deadStock.length}</div>
            <p className="text-xs text-muted-foreground">Products with no sales</p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5" />
            Product Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="top-sellers" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="top-sellers">Top Sellers</TabsTrigger>
              <TabsTrigger value="velocity">Sales Velocity</TabsTrigger>
              <TabsTrigger value="dead-stock">Dead Stock</TabsTrigger>
            </TabsList>

            <TabsContent value="top-sellers" className="mt-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : topSellers.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No sales data for the selected period.</p>
                </div>
              ) : (
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b border-border">
                        <th className="py-3 pr-4 font-medium">Product</th>
                        <th className="py-3 pr-4 font-medium">Orders</th>
                        <th className="py-3 pr-4 font-medium">Qty Sold</th>
                        <th className="py-3 font-medium">Gross Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topSellers.map((product, index) => (
                        <tr key={product.product_id} className="border-b border-border last:border-0 hover:bg-muted/50">
                          <td className="py-3 pr-4">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">#{index + 1}</Badge>
                              <span className="font-medium">{product.product_name || product.product_id}</span>
                            </div>
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground">{product.orders}</td>
                          <td className="py-3 pr-4 font-semibold">{product.qty_sold}</td>
                          <td className="py-3 text-success font-semibold">{formatCurrency(product.gross_revenue_cents)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="velocity" className="mt-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : velocity.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No velocity data for the selected period.</p>
                </div>
              ) : (
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b border-border">
                        <th className="py-3 pr-4 font-medium">Product</th>
                        <th className="py-3 pr-4 font-medium">Period (Days)</th>
                        <th className="py-3 pr-4 font-medium">Total Sold</th>
                        <th className="py-3 font-medium">Daily Average</th>
                      </tr>
                    </thead>
                    <tbody>
                      {velocity.map((product) => (
                        <tr key={product.product_id} className="border-b border-border last:border-0 hover:bg-muted/50">
                          <td className="py-3 pr-4 font-medium">{product.product_name || product.product_id}</td>
                          <td className="py-3 pr-4 text-muted-foreground">{product.days}</td>
                          <td className="py-3 pr-4 font-semibold">{product.qty_sold}</td>
                          <td className="py-3">
                            <Badge variant={product.avg_per_day >= 1 ? "default" : "secondary"}>
                              {product.avg_per_day.toFixed(2)}/day
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="dead-stock" className="mt-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : deadStock.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-success mx-auto mb-4" />
                  <p className="text-success font-medium">Great! No dead stock found.</p>
                  <p className="text-muted-foreground text-sm">All products have sales in the selected period.</p>
                </div>
              ) : (
                <div className="overflow-auto">
                  <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-sm text-destructive">
                      <AlertTriangle className="inline h-4 w-4 mr-1" />
                      Found {deadStock.length} products with no sales in the selected period.
                    </p>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b border-border">
                        <th className="py-3 font-medium">Product</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deadStock.map((product) => (
                        <tr key={product.product_id} className="border-b border-border last:border-0 hover:bg-muted/50">
                          <td className="py-3">
                            <div className="flex items-center space-x-2">
                              <Badge variant="destructive">Dead Stock</Badge>
                              <span>{product.product_name || product.product_id}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}