import { useState } from "react";
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
import { toast } from "sonner";

type Product = {
  id: string;
  sku: string;
  name: string;
  category: string | null;
  cost: number | null;
  price: number | null;
  created_at: string | null;
  updated_at: string | null;
};

const fetchProducts = async (): Promise<Product[]> => {
  const { data, error } = await (supabase as any)
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

const insertProduct = async (product: {
  sku: string;
  name: string;
  category: string;
  cost: string;
  price: string;
}) => {
  const { data, error } = await (supabase as any)
    .from("products")
    .insert({
      sku: product.sku,
      name: product.name,
      category: product.category || null,
      cost: product.cost ? parseFloat(product.cost) : null,
      price: product.price ? parseFloat(product.price) : null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const Products = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    category: "",
    cost: "",
    price: "",
  });

  const {
    data: products = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const addProductMutation = useMutation({
    mutationFn: insertProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setFormData({ sku: "", name: "", category: "", cost: "", price: "" });
      toast.success("Product added successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Error adding product: ${error.message}`);
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
      cost: formData.cost.trim(),
      price: formData.price.trim(),
    });
  };

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return "-";
    return `$${value.toFixed(2)}`;
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
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Products</h1>

      {/* Add Product Form */}
      <Card className="mb-8">
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
                  type="text"
                  value={formData.sku}
                  onChange={(e) => updateFormData("sku", e.target.value)}
                  placeholder="Enter SKU"
                  className="min-h-[44px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  placeholder="Enter product name"
                  className="min-h-[44px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  type="text"
                  value={formData.category}
                  onChange={(e) => updateFormData("category", e.target.value)}
                  placeholder="Enter category"
                  className="min-h-[44px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost">Cost</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost}
                  onChange={(e) => updateFormData("cost", e.target.value)}
                  placeholder="0.00"
                  className="min-h-[44px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => updateFormData("price", e.target.value)}
                  placeholder="0.00"
                  className="min-h-[44px]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={addProductMutation.isPending}
                className="min-h-[44px] px-6"
              >
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
              No products found. Add your first product using the form above.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.sku}</TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.category || "-"}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(product.cost)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(product.price)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Products;