import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HelpTooltip, HelpTooltipProvider } from "@/components/ui/HelpTooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Percent,
  Download
} from "lucide-react";
import { toast } from "sonner";

type ProductAnalysis = {
  product_id: string;
  product_name: string;
  product_sku: string;
  cost: number;
  price: number;
  margin_amount: number;
  margin_percent: number;
  qty_sold: number;
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  category: string;
};

type CategoryAnalysis = {
  category: string;
  product_count: number;
  avg_margin_percent: number;
  total_revenue: number;
  total_profit: number;
};

type ProfitabilityMetrics = {
  total_products: number;
  avg_margin_percent: number;
  highest_margin_product: string;
  lowest_margin_product: string;
  most_profitable_category: string;
  total_revenue: number;
  total_profit: number;
};

const fetchCostAnalysis = async (): Promise<{
  products: ProductAnalysis[];
  categories: CategoryAnalysis[];
  metrics: ProfitabilityMetrics;
}> => {
  // Fetch products with cost/price analysis
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .order('name');

  if (productsError) throw productsError;

  // Calculate margins and profitability
  const productAnalysis: ProductAnalysis[] = (products || []).map(product => {
    const cost = product.cost || 0;
    const price = product.price || 0;
    const marginAmount = price - cost;
    const marginPercent = cost > 0 ? (marginAmount / cost) * 100 : 0;

    return {
      product_id: product.id,
      product_name: product.name,
      product_sku: product.sku || '',
      cost,
      price,
      margin_amount: marginAmount,
      margin_percent: marginPercent,
      qty_sold: 0, // TODO: Get from sales data
      total_revenue: 0,
      total_cost: 0,
      total_profit: 0,
      category: product.category || 'Uncategorized',
    };
  });

  // Group by category
  const categoryMap = new Map<string, CategoryAnalysis>();
  productAnalysis.forEach(product => {
    const category = product.category || 'Uncategorized';
    if (!categoryMap.has(category)) {
      categoryMap.set(category, {
        category,
        product_count: 0,
        avg_margin_percent: 0,
        total_revenue: 0,
        total_profit: 0,
      });
    }
    const cat = categoryMap.get(category)!;
    cat.product_count++;
  });

  // Calculate category averages
  categoryMap.forEach((cat, category) => {
    const categoryProducts = productAnalysis.filter(p => p.category === category);
    cat.avg_margin_percent = categoryProducts.reduce((sum, p) => sum + p.margin_percent, 0) / categoryProducts.length;
  });

  const categories = Array.from(categoryMap.values()).sort((a, b) => b.avg_margin_percent - a.avg_margin_percent);

  // Calculate metrics
  const validMargins = productAnalysis.filter(p => p.cost > 0);
  const metrics: ProfitabilityMetrics = {
    total_products: productAnalysis.length,
    avg_margin_percent: validMargins.length > 0 
      ? validMargins.reduce((sum, p) => sum + p.margin_percent, 0) / validMargins.length
      : 0,
    highest_margin_product: validMargins.length > 0 
      ? validMargins.reduce((max, p) => p.margin_percent > max.margin_percent ? p : max).product_name
      : 'N/A',
    lowest_margin_product: validMargins.length > 0 
      ? validMargins.reduce((min, p) => p.margin_percent < min.margin_percent ? p : min).product_name
      : 'N/A',
    most_profitable_category: categories.length > 0 ? categories[0].category : 'N/A',
    total_revenue: 0,
    total_profit: 0,
  };

  return { products: productAnalysis, categories, metrics };
};

const CostAnalysis = () => {
  const {
    data: analysisData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["cost-analysis"],
    queryFn: fetchCostAnalysis,
  });

  const exportAnalysisCSV = () => {
    if (!analysisData?.products.length) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      'Product', 'SKU', 'Category', 'Cost', 'Price', 'Margin $', 'Margin %'
    ];
    
    const csvContent = [
      headers.join(','),
      ...analysisData.products.map(product => [
        product.product_name,
        product.product_sku,
        product.category,
        product.cost.toFixed(2),
        product.price.toFixed(2),
        product.margin_amount.toFixed(2),
        product.margin_percent.toFixed(1) + '%'
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cost-analysis.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getMarginBadge = (marginPercent: number) => {
    if (marginPercent >= 50) {
      return <Badge className="bg-green-500">Excellent</Badge>;
    } else if (marginPercent >= 25) {
      return <Badge className="bg-blue-500">Good</Badge>;
    } else if (marginPercent >= 10) {
      return <Badge variant="secondary">Fair</Badge>;
    } else {
      return <Badge variant="destructive">Poor</Badge>;
    }
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Cost Analysis</h1>
        <p className="text-destructive">Error loading cost analysis: {error.message}</p>
      </div>
    );
  }

  const { products = [], categories = [], metrics } = analysisData || {};

  return (
    <HelpTooltipProvider>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Cost & Margin Analysis
            <HelpTooltip content="Analyze product profitability by comparing costs vs. prices to optimize your product mix and pricing strategy." />
          </h1>
          <Button onClick={exportAnalysisCSV} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1">
                Total Products
                <HelpTooltip content="Total number of products in your catalog with cost and price information." />
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.total_products || 0}</div>
              <p className="text-xs text-muted-foreground">In catalog</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1">
                Avg Margin
                <HelpTooltip content="Average profit margin percentage across all products. Higher percentages indicate better profitability." />
              </CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(metrics?.avg_margin_percent || 0).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">Across all products</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1">
                Best Performer
                <HelpTooltip content="Product with the highest profit margin percentage. Consider promoting these high-margin items." />
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold truncate">
                {metrics?.highest_margin_product || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">Highest margin</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1">
                Needs Attention
                <HelpTooltip content="Product with the lowest profit margin. Consider repricing or discontinuing if unprofitable." />
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold truncate">
                {metrics?.lowest_margin_product || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">Lowest margin</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList>
            <TabsTrigger value="products">Product Analysis</TabsTrigger>
            <TabsTrigger value="categories">Category Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Product Profitability Analysis
                  <HelpTooltip content="Detailed breakdown of each product's cost, price, and profit margin to identify your most and least profitable items." />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No products found.</p>
                    <p className="text-sm mt-2">Add products with cost and price information to see analysis.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Cost</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Margin $</TableHead>
                          <TableHead className="text-right">Margin %</TableHead>
                          <TableHead>Performance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products
                          .sort((a, b) => b.margin_percent - a.margin_percent)
                          .map((product) => (
                          <TableRow key={product.product_id}>
                            <TableCell className="font-medium">{product.product_name}</TableCell>
                            <TableCell className="text-muted-foreground">{product.product_sku || '-'}</TableCell>
                            <TableCell>{product.category}</TableCell>
                            <TableCell className="text-right">${product.cost.toFixed(2)}</TableCell>
                            <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-medium">
                              <span className={product.margin_amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                                ${product.margin_amount.toFixed(2)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              <span className={product.margin_percent >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {product.margin_percent.toFixed(1)}%
                              </span>
                            </TableCell>
                            <TableCell>{getMarginBadge(product.margin_percent)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Category Performance
                  <HelpTooltip content="Compare profitability across product categories to identify which types of products are most successful." />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {categories.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No category data available.</p>
                    <p className="text-sm mt-2">Add categories to your products to see category analysis.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Products</TableHead>
                          <TableHead className="text-right">Avg Margin %</TableHead>
                          <TableHead>Performance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categories.map((category) => (
                          <TableRow key={category.category}>
                            <TableCell className="font-medium">{category.category}</TableCell>
                            <TableCell className="text-right">{category.product_count}</TableCell>
                            <TableCell className="text-right font-bold">
                              <span className={category.avg_margin_percent >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {category.avg_margin_percent.toFixed(1)}%
                              </span>
                            </TableCell>
                            <TableCell>{getMarginBadge(category.avg_margin_percent)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </HelpTooltipProvider>
  );
};

export default CostAnalysis;