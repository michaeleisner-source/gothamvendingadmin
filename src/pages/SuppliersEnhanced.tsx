import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { 
  Building2, Users, TrendingUp, DollarSign, 
  Search, Plus, Package, Activity 
} from "lucide-react";

type Supplier = {
  id: string;
  name: string;
  contact: string | null;
  created_at: string | null;
  updated_at: string | null;
};

interface SupplierMetrics {
  total: number;
  active: number;
  totalOrders: number;
  avgOrderValue: number;
}

const SuppliersEnhanced = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [metrics, setMetrics] = useState<SupplierMetrics>({
    total: 0,
    active: 0,
    totalOrders: 0,
    avgOrderValue: 0
  });
  const [loading, setLoading] = useState(true);

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  useEffect(() => {
    loadMetrics();
  }, [suppliers]);

  const loadMetrics = async () => {
    try {
      if (suppliers.length === 0) {
        setLoading(false);
        return;
      }

      // Get purchase order data
      const { data: poData } = await supabase
        .from('purchase_orders')
        .select(`
          supplier_id,
          purchase_order_items!inner(qty_ordered, unit_cost)
        `);

      const ordersBySupplier = poData?.reduce((acc: Record<string, { orders: number; totalValue: number }>, po) => {
        if (!acc[po.supplier_id]) {
          acc[po.supplier_id] = { orders: 0, totalValue: 0 };
        }
        acc[po.supplier_id].orders += 1;
        
        // Calculate order value
        const orderValue = po.purchase_order_items?.reduce((sum: number, item: any) => 
          sum + (item.qty_ordered * item.unit_cost), 0) || 0;
        acc[po.supplier_id].totalValue += orderValue;
        
        return acc;
      }, {}) || {};

      const active = Object.keys(ordersBySupplier).length;
      const totalOrders = Object.values(ordersBySupplier).reduce((sum: number, s) => sum + s.orders, 0);
      const totalValue = Object.values(ordersBySupplier).reduce((sum: number, s) => sum + s.totalValue, 0);
      const avgOrderValue = totalOrders > 0 ? totalValue / totalOrders : 0;

      setMetrics({
        total: suppliers.length,
        active,
        totalOrders,
        avgOrderValue
      });
    } catch (error) {
      console.error('Error loading supplier metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSupplierMutation = useMutation({
    mutationFn: async (supplier: { name: string; contact: string }) => {
      const { data, error } = await supabase
        .from("suppliers")
        .insert({
          name: supplier.name,
          contact: supplier.contact || null,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setFormData({ name: "", contact: "" });
      toast.success("Supplier added successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Error adding supplier: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Supplier name is required");
      return;
    }

    addSupplierMutation.mutate({
      name: formData.name.trim(),
      contact: formData.contact.trim(),
    });
  };

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.contact && supplier.contact.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading && suppliers.length === 0) {
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
          <h1 className="text-3xl font-bold">Supplier Management</h1>
          <p className="text-muted-foreground">Manage your supplier network and relationships</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Suppliers</p>
                <p className="text-2xl font-bold">{metrics.total}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Active Suppliers</p>
                <p className="text-2xl font-bold text-green-800">{metrics.active}</p>
                <p className="text-xs text-green-600">With orders</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{metrics.totalOrders}</p>
                <p className="text-xs text-blue-600">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  Purchase history
                </p>
              </div>
              <Package className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Order Value</p>
                <p className="text-2xl font-bold">${metrics.avgOrderValue.toFixed(0)}</p>
                <p className="text-xs text-orange-600">Per purchase order</p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Supplier Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Supplier Network Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-600">
                {metrics.total > 0 ? Math.round((metrics.active / metrics.total) * 100) : 0}%
              </div>
              <p className="text-sm text-muted-foreground">Engagement Rate</p>
              <p className="text-xs text-green-600">Active vs total suppliers</p>
            </div>
            
            <div className="space-y-2">
              <div className="text-2xl font-bold text-blue-600">
                {metrics.active > 0 ? (metrics.totalOrders / metrics.active).toFixed(1) : '0'}
              </div>
              <p className="text-sm text-muted-foreground">Orders per Supplier</p>
              <p className="text-xs text-blue-600">Average relationship depth</p>
            </div>
            
            <div className="space-y-2">
              <div className="text-2xl font-bold text-purple-600">
                {metrics.total - metrics.active}
              </div>
              <p className="text-sm text-muted-foreground">Inactive Suppliers</p>
              <p className="text-xs text-purple-600">Potential re-engagement</p>
            </div>
          </div>

          {metrics.total > 0 && metrics.active / metrics.total < 0.6 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700">
                <Users className="w-4 h-4" />
                <span className="font-medium">Supplier engagement opportunity</span>
              </div>
              <p className="text-sm text-blue-600 mt-1">
                Consider reaching out to inactive suppliers to strengthen your supply chain
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search and Add Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search suppliers by name or contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Add Supplier Form */}
        <Card>
          <CardHeader>
            <CardTitle>Add New Supplier</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateFormData("name", e.target.value)}
                    placeholder="Supplier name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact">Contact</Label>
                  <Input
                    id="contact"
                    type="text"
                    value={formData.contact}
                    onChange={(e) => updateFormData("contact", e.target.value)}
                    placeholder="Contact info"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={addSupplierMutation.isPending}
                >
                  {addSupplierMutation.isPending ? "Adding..." : "Add Supplier"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Suppliers ({filteredSuppliers.length})
            {searchTerm && filteredSuppliers.length !== suppliers.length && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                of {suppliers.length} total
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSuppliers.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm ? "No suppliers found" : "No suppliers yet"}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? "No suppliers match your search criteria."
                  : "Add your first supplier to start building your supply chain."
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Added</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>{supplier.contact || "-"}</TableCell>
                      <TableCell>
                        {supplier.created_at 
                          ? new Date(supplier.created_at).toLocaleDateString()
                          : "-"
                        }
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

export default SuppliersEnhanced;