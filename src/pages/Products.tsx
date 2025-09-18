import React from "react";
import { Button } from "@/components/ui/button";
import { Package, Plus, Edit, Trash2, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { useProducts } from "@/hooks/useSupabaseData";
import { EnhancedDataTable, DataTableColumn, DataTableAction } from "@/components/enhanced/EnhancedDataTable";
import { StatCard } from "@/components/enhanced/StatCard";

export default function Products() {
  const { data: products = [], isLoading, error } = useProducts();

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">Error loading products: {error.message}</p>
        </div>
      </div>
    );
  }

  // Define table columns
  const columns: DataTableColumn<any>[] = [
    {
      key: "name",
      label: "Product Name",
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          <div>
            <span className="font-medium">{value}</span>
            {row.sku && <div className="text-xs text-muted-foreground">SKU: {row.sku}</div>}
          </div>
        </div>
      ),
    },
    {
      key: "category",
      label: "Category",
      sortable: true,
      render: (value) => (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {value || "Uncategorized"}
        </span>
      ),
    },
    {
      key: "price",
      label: "Price",
      sortable: true,
      render: (value) => (
        <span className="font-medium">
          {value ? `$${value.toFixed(2)}` : "-"}
        </span>
      ),
    },
    {
      key: "cost",
      label: "Cost",
      sortable: true,
      render: (value) => (
        <span className="text-muted-foreground">
          {value ? `$${value.toFixed(2)}` : "-"}
        </span>
      ),
    },
    {
      key: "margin",
      label: "Margin",
      render: (value, row) => {
        if (!row.price || !row.cost) return "-";
        const margin = ((row.price - row.cost) / row.price) * 100;
        return (
          <span className={`font-medium ${margin > 0 ? "text-green-600" : "text-red-600"}`}>
            {margin.toFixed(1)}%
          </span>
        );
      },
    },
  ];

  // Define table actions
  const actions: DataTableAction<any>[] = [
    {
      label: "Edit",
      onClick: (row) => console.log("Edit product", row),
      icon: Edit,
    },
    {
      label: "Delete",
      onClick: (row) => console.log("Delete product", row),
      icon: Trash2,
      variant: "destructive",
    },
  ];

  // Calculate stats
  const stats = {
    total: products.length,
    withPricing: products.filter(p => p.price && p.cost).length,
    categories: new Set(products.map(p => p.category).filter(Boolean)).size,
    avgMargin: products.length > 0 ? 
      products
        .filter(p => p.price && p.cost)
        .reduce((acc, p) => acc + ((p.price - p.cost) / p.price) * 100, 0) / 
      products.filter(p => p.price && p.cost).length : 0,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your product catalog and pricing
          </p>
        </div>
        <Link to="/products/new">
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Products"
          value={stats.total}
          icon={Package}
        />
        <StatCard
          title="With Pricing"
          value={stats.withPricing}
          description={`${Math.round((stats.withPricing / Math.max(stats.total, 1)) * 100)}% have cost & price`}
        />
        <StatCard
          title="Categories"
          value={stats.categories}
          description="Product categories"
        />
        <StatCard
          title="Avg Margin"
          value={`${stats.avgMargin.toFixed(1)}%`}
          description="Profit margin"
          icon={DollarSign}
        />
      </div>

      {/* Enhanced Data Table */}
      <EnhancedDataTable
        data={products}
        columns={columns}
        actions={actions}
        searchPlaceholder="Search products..."
        searchFields={["name", "sku", "category"]}
        isLoading={isLoading}
        emptyMessage="No products found. Add your first product to get started."
      />
    </div>
  );
}