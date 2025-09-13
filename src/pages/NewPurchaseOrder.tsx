import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, ArrowLeft, UserPlus } from "lucide-react";
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
  errors?: {
    product_id?: string;
    qty_ordered?: string;
    unit_cost?: string;
  };
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

const createSupplier = async (supplierData: {
  name: string;
  contact: string;
}) => {
  const { data, error } = await (supabase as any)
    .from("suppliers")
    .insert({
      name: supplierData.name,
      contact: supplierData.contact || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
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
  const queryClient = useQueryClient();
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierFormData, setSupplierFormData] = useState({
    name: "",
    contact: "",
  });
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

  const createSupplierMutation = useMutation({
    mutationFn: createSupplier,
    onSuccess: (newSupplier) => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setSelectedSupplier(newSupplier.id);
      setIsSupplierModalOpen(false);
      setSupplierFormData({ name: "", contact: "" });
      toast.success("Supplier created successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Error creating supplier: ${error.message}`);
    },
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

  const handleSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!supplierFormData.name.trim()) {
      toast.error("Supplier name is required");
      return;
    }

    createSupplierMutation.mutate({
      name: supplierFormData.name.trim(),
      contact: supplierFormData.contact.trim(),
    });
  };

  const updateSupplierFormData = (field: string, value: string) => {
    setSupplierFormData((prev) => ({ ...prev, [field]: value }));
  };

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
      lineItems.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          
          // If updating qty_ordered or unit_cost, coerce to number and validate
          if (field === "qty_ordered" || field === "unit_cost") {
            updatedItem[field] = Number(value) || (field === "qty_ordered" ? 1 : 0);
          }
          
          // Validate the item and update errors
          if (field !== "errors") {
            updatedItem.errors = validateLineItem(updatedItem);
          }
          
          return updatedItem;
        }
        return item;
      })
    );
  };

  const validateLineItem = (item: LineItem): LineItem["errors"] => {
    const errors: LineItem["errors"] = {};
    
    if (!item.product_id) {
      errors.product_id = "Product is required";
    }
    
    const qty = Number(item.qty_ordered);
    if (!qty || qty < 1) {
      errors.qty_ordered = "Quantity must be at least 1";
    }
    
    const cost = Number(item.unit_cost);
    if (cost < 0) {
      errors.unit_cost = "Unit cost cannot be negative";
    }
    
    return Object.keys(errors).length > 0 ? errors : undefined;
  };

  const isLineItemValid = (item: LineItem): boolean => {
    return !!(item.product_id && Number(item.qty_ordered) >= 1 && Number(item.unit_cost) >= 0);
  };

  const onProductChange = (itemId: string, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const currentItem = lineItems.find(item => item.id === itemId);
      const shouldPrefillCost = !currentItem?.unit_cost || currentItem.unit_cost === 0;
      
      updateLineItem(itemId, "product_id", productId);
      updateLineItem(itemId, "product_name", product.name);
      updateLineItem(itemId, "product_sku", product.sku);
      
      if (shouldPrefillCost && product.cost) {
        updateLineItem(itemId, "unit_cost", Number(product.cost));
      }
      
      // Clear product error if one exists
      const item = lineItems.find(i => i.id === itemId);
      if (item?.errors?.product_id) {
        const newErrors = { ...item.errors };
        delete newErrors.product_id;
        updateLineItem(itemId, "errors", Object.keys(newErrors).length > 0 ? newErrors : undefined);
      }
    } else if (!productId) {
      // Clear product selection
      updateLineItem(itemId, "product_id", "");
      updateLineItem(itemId, "product_name", undefined);
      updateLineItem(itemId, "product_sku", undefined);
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

    const validLineItems = lineItems.filter(isLineItemValid);

    if (validLineItems.length === 0) {
      // Validate all items to show errors
      setLineItems(lineItems.map(item => ({
        ...item,
        errors: validateLineItem(item)
      })));
      toast.error("Please fix the errors in the line items");
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
              <div className="flex gap-2">
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger className="min-h-[44px] flex-1">
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
                
                <Dialog open={isSupplierModalOpen} onOpenChange={setIsSupplierModalOpen}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="min-h-[44px] min-w-[44px] shrink-0"
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add New Supplier</DialogTitle>
                      <DialogDescription>
                        Create a new supplier to add to your purchase order.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSupplierSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="supplier-name">Name *</Label>
                        <Input
                          id="supplier-name"
                          type="text"
                          value={supplierFormData.name}
                          onChange={(e) => updateSupplierFormData("name", e.target.value)}
                          placeholder="Enter supplier name"
                          className="min-h-[44px]"
                          autoFocus
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="supplier-contact">Contact</Label>
                        <Input
                          id="supplier-contact"
                          type="text"
                          value={supplierFormData.contact}
                          onChange={(e) => updateSupplierFormData("contact", e.target.value)}
                          placeholder="Enter contact information"
                          className="min-h-[44px]"
                        />
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsSupplierModalOpen(false)}
                          className="min-h-[44px] flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={createSupplierMutation.isPending}
                          className="min-h-[44px] flex-1"
                        >
                          {createSupplierMutation.isPending ? "Creating..." : "Create Supplier"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
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
                    <select
                      value={item.product_id}
                      onChange={(e) => onProductChange(item.id, e.target.value)}
                      className={`w-full min-h-[44px] px-3 py-2 border rounded-md bg-background ${item.errors?.product_id ? 'border-destructive' : 'border-input'}`}
                    >
                      <option value="">Select product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} ({product.sku})
                        </option>
                      ))}
                    </select>
                    {products.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No products found. Add products at /products.
                      </p>
                    )}
                    {item.errors?.product_id && (
                      <p className="text-sm text-destructive">{item.errors.product_id}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Qty Ordered *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.qty_ordered}
                      onChange={(e) =>
                        updateLineItem(item.id, "qty_ordered", e.target.value)
                      }
                      className={`min-h-[44px] ${item.errors?.qty_ordered ? 'border-destructive' : ''}`}
                    />
                    {item.errors?.qty_ordered && (
                      <p className="text-sm text-destructive">{item.errors.qty_ordered}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Unit Cost *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unit_cost}
                      onChange={(e) =>
                        updateLineItem(item.id, "unit_cost", e.target.value)
                      }
                      className={`min-h-[44px] ${item.errors?.unit_cost ? 'border-destructive' : ''}`}
                    />
                    {item.errors?.unit_cost && (
                      <p className="text-sm text-destructive">{item.errors.unit_cost}</p>
                    )}
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