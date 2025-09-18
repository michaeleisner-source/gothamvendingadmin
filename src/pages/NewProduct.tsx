import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCreateProduct } from "@/hooks/useSupabaseData";

type ProductFormData = {
  name: string;
  sku: string;
  category: string;
  price_cents: string;
  cost_cents: string;
  description: string;
};

const initialFormData: ProductFormData = {
  name: "",
  sku: "",
  category: "",
  price_cents: "",
  cost_cents: "",
  description: "",
};

export default function NewProduct() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  
  const createProduct = useCreateProduct();

  const handleInputChange = (field: keyof ProductFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast({
        title: "Validation Error",
        description: "Please provide a product name.",
        variant: "destructive",
      });
      return;
    }

    try {
      const productData = {
        name: formData.name,
        sku: formData.sku || null,
        category: formData.category || null,
        price_cents: formData.price_cents ? parseInt(formData.price_cents) : null,
        cost_cents: formData.cost_cents ? parseInt(formData.cost_cents) : null,
        description: formData.description || null,
      };

      await createProduct.mutateAsync(productData);
      navigate("/products");
    } catch (error: any) {
      // Error handling is done in the mutation
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link 
            to="/products" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Link>
        </div>
      </div>

      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            Add New Product
          </h1>
          <p className="text-muted-foreground mt-1">
            Add a new product to your catalog
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <h3 className="font-medium text-sm">Product Information</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm"
                  placeholder="Coca Cola 12oz Can"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  SKU
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => handleInputChange("sku", e.target.value)}
                  className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm"
                  placeholder="COKE-12OZ"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm"
              >
                <option value="">Select category</option>
                <option value="Beverages">Beverages</option>
                <option value="Snacks">Snacks</option>
                <option value="Candy">Candy</option>
                <option value="Chips">Chips</option>
                <option value="Healthy">Healthy</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm"
                placeholder="Product description..."
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <h3 className="font-medium text-sm">Pricing Information</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Sell Price (cents)
                </label>
                <input
                  type="number"
                  value={formData.price_cents}
                  onChange={(e) => handleInputChange("price_cents", e.target.value)}
                  className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm"
                  placeholder="150"
                  min="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter price in cents (e.g., 150 = $1.50)
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Cost Price (cents)
                </label>
                <input
                  type="number"
                  value={formData.cost_cents}
                  onChange={(e) => handleInputChange("cost_cents", e.target.value)}
                  className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm"
                  placeholder="75"
                  min="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter cost in cents (e.g., 75 = $0.75)
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={createProduct.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {createProduct.isPending ? "Adding Product..." : "Add Product"}
            </button>
            
            <Link
              to="/products"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm hover:bg-muted"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}