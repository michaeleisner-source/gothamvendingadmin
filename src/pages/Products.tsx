import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Pencil, Trash2, Upload, Search, Download } from "lucide-react";


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

type ProductFormData = {
  sku: string;
  name: string;
  category: string;
  manufacturer: string;
  cost: string;
  price: string;
  image_url: string;
  description: string;
  size_oz: string;
  size_ml: string;
};

const fetchProducts = async (search?: string): Promise<Product[]> => {
  let query = supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,category.ilike.%${search}%,manufacturer.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

const upsertProduct = async (product: ProductFormData & { id?: string }) => {
  const { data, error } = await supabase.rpc('upsert_product', {
    p: {
      ...(product.id && { id: product.id }),
      sku: product.sku,
      name: product.name,
      category: product.category || null,
      manufacturer: product.manufacturer || null,
      cost: product.cost || null,
      price: product.price || null,
      image_url: product.image_url || null,
      description: product.description || null,
      size_oz: product.size_oz || null,
      size_ml: product.size_ml || null,
    }
  });

  if (error) {
    throw error;
  }

  return data;
};

const checkProductReferences = async (id: string) => {
  // Check if product is used in purchase orders
  const { data: poItems } = await supabase
    .from("purchase_order_items")
    .select("id")
    .eq("product_id", id)
    .limit(1);

  // Check if product is used in slot assignments
  const { data: slotAssignments } = await supabase
    .from("slot_assignments")
    .select("id")
    .eq("product_id", id)
    .limit(1);

  // Check if product is used in sales
  const { data: sales } = await supabase
    .from("sales")
    .select("id")
    .eq("product_id", id)
    .limit(1);

  return {
    hasPurchaseOrders: (poItems?.length || 0) > 0,
    hasSlotAssignments: (slotAssignments?.length || 0) > 0,
    hasSales: (sales?.length || 0) > 0
  };
};

const deleteProduct = async (id: string) => {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }
};

const Products = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    sku: "",
    name: "",
    category: "",
    manufacturer: "",
    cost: "",
    price: "",
    image_url: "",
    description: "",
    size_oz: "",
    size_ml: "",
  });

  const {
    data: products = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["products", searchTerm],
    queryFn: () => fetchProducts(searchTerm),
  });

  const addProductMutation = useMutation({
    mutationFn: upsertProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setFormData({
        sku: "",
        name: "",
        category: "",
        manufacturer: "",
        cost: "",
        price: "",
        image_url: "",
        description: "",
        size_oz: "",
        size_ml: "",
      });
      toast.success("Product saved successfully!");
    },
    onError: (error: any) => {
      if (error?.code === '23505') {
        toast.error("A product with this SKU already exists. Please use a different SKU.");
      } else {
        toast.error(error?.message || "Error saving product");
      }
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: upsertProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setEditingProduct(null);
      setIsEditDialogOpen(false);
      toast.success("Product updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Error updating product");
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Error deleting product");
    },
  });


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.sku.trim()) {
      toast.error("SKU is required");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("Product name is required");
      return;
    }

    addProductMutation.mutate({
      sku: formData.sku.trim(),
      name: formData.name.trim(),
      category: formData.category.trim(),
      manufacturer: formData.manufacturer.trim(),
      cost: formData.cost.trim(),
      price: formData.price.trim(),
      image_url: formData.image_url.trim(),
      description: formData.description.trim(),
      size_oz: formData.size_oz.trim(),
      size_ml: formData.size_ml.trim(),
    });
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    updateProductMutation.mutate({
      id: editingProduct.id,
      sku: editingProduct.sku,
      name: editingProduct.name,
      category: editingProduct.category || "",
      manufacturer: editingProduct.manufacturer || "",
      cost: editingProduct.cost?.toString() || "",
      price: editingProduct.price?.toString() || "",
      image_url: editingProduct.image_url || "",
      description: editingProduct.description || "",
      size_oz: editingProduct.size_oz?.toString() || "",
      size_ml: editingProduct.size_ml?.toString() || "",
    });
  };

  const handleDelete = async (product: Product) => {
    try {
      // First check if product has any references
      const references = await checkProductReferences(product.id);
      
      const referencedIn = [];
      if (references.hasPurchaseOrders) referencedIn.push("purchase orders");
      if (references.hasSlotAssignments) referencedIn.push("machine slot assignments");
      if (references.hasSales) referencedIn.push("sales records");
      
      if (referencedIn.length > 0) {
        const message = `Cannot delete "${product.name}" because it's still referenced in: ${referencedIn.join(", ")}.\n\nPlease remove these references first, or contact support if you need to force delete this product.`;
        toast.error(message);
        return;
      }
      
      // If no references, proceed with confirmation
      if (confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
        deleteProductMutation.mutate(product.id);
      }
    } catch (error: any) {
      toast.error("Error checking product references: " + (error.message || "Unknown error"));
    }
  };

  const updateFormData = (field: keyof ProductFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateEditingProduct = (field: keyof Product, value: string | number | null) => {
    if (!editingProduct) return;
    setEditingProduct((prev) => prev ? ({ ...prev, [field]: value }) : null);
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return "-";
    return `$${value.toFixed(2)}`;
  };

  const handleCSVImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      const lines = csv.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const products = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(',').map(v => v.trim());
        const product: any = {};
        
        headers.forEach((header, index) => {
          const value = values[index] || '';
          switch (header) {
            case 'sku':
            case 'name':
            case 'category':
            case 'image_url':
            case 'description':
              product[header] = value;
              break;
            case 'cost':
            case 'price':
            case 'size_oz':
            case 'size_ml':
              product[header] = value ? parseFloat(value) : null;
              break;
          }
        });
        
        return product;
      });

      // Import products one by one
      products.forEach((product, index) => {
        if (product.sku && product.name) {
          setTimeout(() => {
            upsertProduct({
              sku: product.sku,
              name: product.name,
              category: product.category || "",
              manufacturer: product.manufacturer || "",
              cost: product.cost?.toString() || "",
              price: product.price?.toString() || "",
              image_url: product.image_url || "",
              description: product.description || "",
              size_oz: product.size_oz?.toString() || "",
              size_ml: product.size_ml?.toString() || "",
            }).then(() => {
              queryClient.invalidateQueries({ queryKey: ["products"] });
            }).catch(error => {
              console.error(`Error importing product ${product.name}:`, error);
            });
          }, index * 100);
        }
      });

      toast.success(`Importing ${products.length} products...`);
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const exportToCSV = () => {
    if (products.length === 0) {
      toast.error("No products to export");
      return;
    }

    const headers = ['SKU', 'Name', 'Category', 'Cost', 'Price', 'Image URL', 'Description', 'Size (oz)', 'Size (ml)'];
    const csvContent = [
      headers.join(','),
      ...products.map(p => [
        p.sku,
        p.name,
        p.category || '',
        p.cost || '',
        p.price || '',
        p.image_url || '',
        p.description || '',
        p.size_oz || '',
        p.size_ml || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Products</h1>
        <p className="text-destructive">Error loading products: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleCSVImport}
            className="hidden"
          />
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 max-w-md">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>


      {/* Add Product Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Product</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => updateFormData("sku", e.target.value)}
                  placeholder="Enter SKU"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  placeholder="Enter product name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => updateFormData("category", e.target.value)}
                  placeholder="Enter category"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Cost ($)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost}
                  onChange={(e) => updateFormData("cost", e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => updateFormData("price", e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => updateFormData("image_url", e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size_oz">Size (oz)</Label>
                <Input
                  id="size_oz"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.size_oz}
                  onChange={(e) => updateFormData("size_oz", e.target.value)}
                  placeholder="0.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size_ml">Size (ml)</Label>
                <Input
                  id="size_ml"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.size_ml}
                  onChange={(e) => updateFormData("size_ml", e.target.value)}
                  placeholder="0.0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                placeholder="Enter product description..."
                rows={3}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={addProductMutation.isPending}>
                {addProductMutation.isPending ? "Adding..." : "Add Product"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({products.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : products.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No products found. {searchTerm ? "Try adjusting your search." : "Add your first product using the form above."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-xs">
                            No Image
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{product.sku}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          {product.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {product.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{product.category || "-"}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {product.size_oz && <div>{product.size_oz} oz</div>}
                          {product.size_ml && <div>{product.size_ml} ml</div>}
                          {!product.size_oz && !product.size_ml && "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(product.cost)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(product.price)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(product)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(product)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>SKU *</Label>
                  <Input
                    value={editingProduct.sku}
                    onChange={(e) => updateEditingProduct("sku", e.target.value)}
                    placeholder="Enter SKU"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={editingProduct.name}
                    onChange={(e) => updateEditingProduct("name", e.target.value)}
                    placeholder="Enter product name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input
                    value={editingProduct.category || ""}
                    onChange={(e) => updateEditingProduct("category", e.target.value)}
                    placeholder="Enter category"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cost ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingProduct.cost || ""}
                    onChange={(e) => updateEditingProduct("cost", e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingProduct.price || ""}
                    onChange={(e) => updateEditingProduct("price", e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Image URL</Label>
                  <Input
                    value={editingProduct.image_url || ""}
                    onChange={(e) => updateEditingProduct("image_url", e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Size (oz)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={editingProduct.size_oz || ""}
                    onChange={(e) => updateEditingProduct("size_oz", e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="0.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Size (ml)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={editingProduct.size_ml || ""}
                    onChange={(e) => updateEditingProduct("size_ml", e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="0.0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editingProduct.description || ""}
                  onChange={(e) => updateEditingProduct("description", e.target.value)}
                  placeholder="Enter product description..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateProductMutation.isPending}>
                  {updateProductMutation.isPending ? "Updating..." : "Update Product"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;