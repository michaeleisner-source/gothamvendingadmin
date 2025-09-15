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
          <AddProductDialog />
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
                        <TableHead className="text-right">Actions</TableHead>
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
                            <TableCell className="text-right">
                              <div className="flex items-center gap-2 justify-end">
                                <EditProductDialog product={product} />
                                <DeleteProductButton productId={product.id} />
                              </div>
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

// Add Product Dialog Component
function AddProductDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: '',
    manufacturer: '',
    cost: '',
    price: '',
    description: '',
    size_oz: '',
    size_ml: ''
  });
  const queryClient = useQueryClient();

  const addProduct = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('products').insert([{
        ...data,
        cost: data.cost ? parseFloat(data.cost) : null,
        price: data.price ? parseFloat(data.price) : null,
        size_oz: data.size_oz ? parseFloat(data.size_oz) : null,
        size_ml: data.size_ml ? parseFloat(data.size_ml) : null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setOpen(false);
      setFormData({
        sku: '', name: '', category: '', manufacturer: '', cost: '', 
        price: '', description: '', size_oz: '', size_ml: ''
      });
      toast.success('Product added successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to add product: ${error.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addProduct.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Plus className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({...formData, sku: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label htmlFor="cost">Cost ($)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({...formData, cost: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="size_oz">Size (oz)</Label>
              <Input
                id="size_oz"
                type="number"
                step="0.1"
                value={formData.size_oz}
                onChange={(e) => setFormData({...formData, size_oz: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="size_ml">Size (ml)</Label>
              <Input
                id="size_ml"
                type="number"
                step="1"
                value={formData.size_ml}
                onChange={(e) => setFormData({...formData, size_ml: e.target.value})}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addProduct.isPending}>
              {addProduct.isPending ? 'Adding...' : 'Add Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Product Dialog Component
function EditProductDialog({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    sku: product.sku || '',
    name: product.name || '',
    category: product.category || '',
    manufacturer: product.manufacturer || '',
    cost: product.cost?.toString() || '',
    price: product.price?.toString() || '',
    description: product.description || '',
    size_oz: product.size_oz?.toString() || '',
    size_ml: product.size_ml?.toString() || ''
  });
  const queryClient = useQueryClient();

  const updateProduct = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('products')
        .update({
          ...data,
          cost: data.cost ? parseFloat(data.cost) : null,
          price: data.price ? parseFloat(data.price) : null,
          size_oz: data.size_oz ? parseFloat(data.size_oz) : null,
          size_ml: data.size_ml ? parseFloat(data.size_ml) : null,
        })
        .eq('id', product.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setOpen(false);
      toast.success('Product updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update product: ${error.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProduct.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pencil className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-sku">SKU *</Label>
              <Input
                id="edit-sku"
                value={formData.sku}
                onChange={(e) => setFormData({...formData, sku: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Input
                id="edit-category"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-manufacturer">Manufacturer</Label>
              <Input
                id="edit-manufacturer"
                value={formData.manufacturer}
                onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label htmlFor="edit-cost">Cost ($)</Label>
              <Input
                id="edit-cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({...formData, cost: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-price">Price ($)</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-size_oz">Size (oz)</Label>
              <Input
                id="edit-size_oz"
                type="number"
                step="0.1"
                value={formData.size_oz}
                onChange={(e) => setFormData({...formData, size_oz: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-size_ml">Size (ml)</Label>
              <Input
                id="edit-size_ml"
                type="number"
                step="1"
                value={formData.size_ml}
                onChange={(e) => setFormData({...formData, size_ml: e.target.value})}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateProduct.isPending}>
              {updateProduct.isPending ? 'Updating...' : 'Update Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Delete Product Button Component
function DeleteProductButton({ productId }: { productId: string }) {
  const queryClient = useQueryClient();
  
  const deleteProduct = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete product: ${error.message}`);
    }
  });

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      deleteProduct.mutate();
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={deleteProduct.isPending}
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  );
}
