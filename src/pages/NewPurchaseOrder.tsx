import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

type Supplier = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  sku: string;
  cost: number | null;
};

type LineItem = {
  id: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  qty_ordered: number;
  unit_cost: number;
};

const fetchSuppliers = async (): Promise<Supplier[]> => {
  const { data, error } = await (supabase as any)
    .from("suppliers")
    .select("id, name")
    .order("name");

  if (error) throw new Error(error.message);
  return data || [];
};

const fetchProducts = async (): Promise<Product[]> => {
  const { data, error } = await (supabase as any)
    .from("products")
    .select("id, name, sku, cost")
    .order("name");

  if (error) throw new Error(error.message);
  return data || [];
};

const createPurchaseOrder = async (poData: {
  supplier_id: string;
  lineItems: LineItem[];
}) => {
  // Insert purchase order
  const { data: po, error: poError } = await (supabase as any)
    .from("purchase_orders")
    .insert({
      supplier_id: poData.supplier_id,
      status: "OPEN",
    })
    .select()
    .single();

  if (poError) throw new Error(poError.message);

  // Insert line items
  const itemsData = poData.lineItems.map(item => ({
    po_id: po.id,
    product_id: item.product_id,
    qty_ordered: item.qty_ordered,
    unit_cost: item.unit_cost,
  }));

  const { error: itemsError } = await (supabase as any)
    .from("purchase_order_items")
    .insert(itemsData);

  if (itemsError) throw new Error(itemsError.message);

  return po;
};

const NewPurchaseOrder = () => {
  const navigate = useNavigate();
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: crypto.randomUUID(),
      product_id: "",
      qty_ordered: 1,
      unit_cost: 0,
    },
  ]);

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: fetchSuppliers,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const createPOMutation = useMutation({
    mutationFn: createPurchaseOrder,
    onSuccess: (po) => {
      toast.success("Purchase order created successfully!");
      navigate(`/purchase-orders/${po.id}`);
    },
    onError: (error: Error) => {
      toast.error(`Error creating purchase order: ${error.message}`);
    },
  });

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: crypto.randomUUID(),
        product_id: "",
        qty_ordered: 1,
        unit_cost: 0,
      },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(
      lineItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const onProductChange = (itemId: string, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      updateLineItem(itemId, "product_id", productId);
      updateLineItem(itemId, "product_name", product.name);
      updateLineItem(itemId, "product_sku", product.sku);
      updateLineItem(itemId, "unit_cost", product.cost || 0);
    }
  };

  const calculateTotal = () => {
    return lineItems.reduce((total, item) => {
      return total + (item.qty_ordered * item.unit_cost);
    }, 0);
  };

  const handleSave = () => {
    if (!selectedSupplier) {
      toast.error("Please select a supplier");
      return;
    }

    const validLineItems = lineItems.filter(item => 
      item.product_id && item.qty_ordered > 0 && item.unit_cost >= 0
    );

    if (validLineItems.length === 0) {
      toast.error("Please add at least one valid line item");
      return;
    }

    createPOMutation.mutate({
      supplier_id: selectedSupplier,
      lineItems: validLineItems,
    });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/purchase-orders")}
          className="h-10 w-10"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">New Purchase Order</h1>
      </div>

      <div className="space-y-6">
        {/* Supplier Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Supplier Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier *</Label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Select a supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Line Items</CardTitle>
            <Button
              onClick={addLineItem}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Line
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {lineItems.map((item, index) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Line {index + 1}</span>
                  {lineItems.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLineItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Product *</Label>
                    <Select
                      value={item.product_id}
                      onValueChange={(value) => onProductChange(item.id, value)}
                    >
                      <SelectTrigger className="min-h-[44px]">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} ({product.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Qty Ordered *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.qty_ordered}
                      onChange={(e) =>
                        updateLineItem(item.id, "qty_ordered", parseInt(e.target.value) || 1)
                      }
                      className="min-h-[44px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Unit Cost *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unit_cost}
                      onChange={(e) =>
                        updateLineItem(item.id, "unit_cost", parseFloat(e.target.value) || 0)
                      }
                      className="min-h-[44px]"
                    />
                  </div>
                </div>

                <div className="text-right text-sm text-muted-foreground">
                  Line Total: ${(item.qty_ordered * item.unit_cost).toFixed(2)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Total and Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-xl font-bold">
                PO Total: ${calculateTotal().toFixed(2)}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate("/purchase-orders")}
                  className="min-h-[44px]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={createPOMutation.isPending}
                  className="min-h-[44px]"
                >
                  {createPOMutation.isPending ? "Saving..." : "Save Purchase Order"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewPurchaseOrder;