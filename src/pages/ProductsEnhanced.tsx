import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Pencil, Trash2, Upload, Search, Download, Package, 
  DollarSign, TrendingUp, Tag, Activity, Plus 
} from "lucide-react";

type Product = {
  id: string;
  sku: string;
  name: string;
  category: string | null;
  manufacturer: string | null;
  cost: number | null;
  price: number | null;
  image_url: string | null;
  description: string | null;
  size_oz: number | null;
  size_ml: number | null;
  created_at: string | null;
  updated_at: string | null;
};

interface ProductMetrics {
  total: number;
  categories: number;
  avgCost: number;
  avgPrice: number;
  avgMargin: number;
  totalValue: number;
}

const ProductsEnhanced = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [metrics, setMetrics] = useState<ProductMetrics>({
    total: 0,
    categories: 0,
    avgCost: 0,
    avgPrice: 0,
    avgMargin: 0,
    totalValue: 0
  });
  const [loading, setLoading] = useState(true);

  const { data: products = [] } = useQuery({
    queryKey: ["products", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,manufacturer.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  useEffect(() => {
    if (products.length > 0) {
      const categories = new Set(products.map(p => p.category).filter(Boolean)).size;
      const totalCost = products.reduce((sum, p) => sum + (p.cost || 0), 0);
      const totalPrice = products.reduce((sum, p) => sum + (p.price || 0), 0);
      const avgCost = products.length > 0 ? totalCost / products.length : 0;
      const avgPrice = products.length > 0 ? totalPrice / products.length : 0;
      const avgMargin = avgPrice > 0 ? ((avgPrice - avgCost) / avgPrice) * 100 : 0;

      setMetrics({
        total: products.length,
        categories,
        avgCost,
        avgPrice,
        avgMargin,
        totalValue: totalPrice
      });
    }
    setLoading(false);
  }, [products]);

  if (loading && products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Product Catalog</h1>
          <p className="text-muted-foreground">Manage your product inventory and pricing</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{metrics.total}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{metrics.categories}</p>
              </div>
              <Tag className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Avg. Margin</p>
                <p className="text-2xl font-bold text-green-800">{metrics.avgMargin.toFixed(1)}%</p>
                <p className="text-xs text-green-600">Profitability</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Portfolio Value</p>
                <p className="text-2xl font-bold">${metrics.totalValue.toFixed(0)}</p>
                <p className="text-xs text-blue-600">Total retail value</p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Pricing Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-blue-600">${metrics.avgCost.toFixed(2)}</div>
              <p className="text-sm text-muted-foreground">Average Cost</p>
              <p className="text-xs text-blue-600">Per unit COGS</p>
            </div>
            
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-600">${metrics.avgPrice.toFixed(2)}</div>
              <p className="text-sm text-muted-foreground">Average Price</p>
              <p className="text-xs text-green-600">Per unit retail</p>
            </div>
            
            <div className="space-y-2">
              <div className="text-2xl font-bold text-purple-600">
                ${(metrics.avgPrice - metrics.avgCost).toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground">Average Markup</p>
              <p className="text-xs text-purple-600">Per unit profit</p>
            </div>
          </div>

          {metrics.avgMargin < 20 && metrics.total > 0 && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 text-orange-700">
                <TrendingUp className="w-4 h-4" />
                <span className="font-medium">Low margin alert</span>
              </div>
              <p className="text-sm text-orange-600 mt-1">
                Consider reviewing product pricing to improve profitability
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 max-w-md">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products by name, SKU, category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Table - Keep existing product functionality */}
      <Card>
        <CardHeader>
          <CardTitle>
            Product Catalog ({products.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No products found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "No products match your search." : "Add your first product to get started."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Margin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => {
                    const margin = product.price && product.cost 
                      ? ((product.price - product.cost) / product.price) * 100
                      : 0;
                    
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.category || "-"}</TableCell>
                        <TableCell>${product.cost?.toFixed(2) || "-"}</TableCell>
                        <TableCell>${product.price?.toFixed(2) || "-"}</TableCell>
                        <TableCell>
                          <span className={`text-sm ${
                            margin > 30 ? 'text-green-600' :
                            margin > 20 ? 'text-yellow-600' : 
                            'text-red-600'
                          }`}>
                            {margin.toFixed(1)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductsEnhanced;
