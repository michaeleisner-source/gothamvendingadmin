import React, { useEffect, useState } from "react";
import { api, Product, Machine, MachineSlot, SlotAssignment } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Building2, AlertCircle, CheckCircle, DollarSign, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { HelpTooltip } from "@/components/ui/HelpTooltip";

export default function SalesEntry() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [slots, setSlots] = useState<MachineSlot[]>([]);
  const [assignments, setAssignments] = useState<SlotAssignment[]>([]);
  const [selectedMachineId, setSelectedMachineId] = useState<string>("");
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [selectedSku, setSelectedSku] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [occurredAt, setOccurredAt] = useState<string>("");
  const [source, setSource] = useState<string>("manual");
  const [loading, setLoading] = useState(false);
  const [currentInventory, setCurrentInventory] = useState<any>(null);
  const [showInventoryImpact, setShowInventoryImpact] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsData, machinesData] = await Promise.all([
          api.listProducts(),
          api.listMachines()
        ]);
        setProducts(productsData);
        setMachines(machinesData);
      } catch (error: any) {
        console.error('Error loading data:', error);
        toast({
          title: "Error loading data",
          description: error.message,
          variant: "destructive"
        });
      }
    };
    loadData();
  }, []);

  // Load slots when machine is selected
  useEffect(() => {
    const loadSlotsForMachine = async () => {
      if (selectedMachineId) {
        try {
          const [slotsData, assignmentsData] = await Promise.all([
            api.listSlots(selectedMachineId),
            api.listSlotAssignments(selectedMachineId)
          ]);
          setSlots(slotsData);
          setAssignments(assignmentsData);
        } catch (error: any) {
          console.error('Error loading slots:', error);
          toast({
            title: "Error loading slots",
            description: error.message,
            variant: "destructive"
          });
        }
      } else {
        setSlots([]);
        setAssignments([]);
      }
      setSelectedSlotId("");
    };
    loadSlotsForMachine();
  }, [selectedMachineId]);

  // Set default timestamp to now
  useEffect(() => {
    if (!occurredAt) {
      setOccurredAt(new Date().toISOString().slice(0, 16));
    }
  }, [occurredAt]);

  // Get product info for selected SKU
  const selectedProduct = products.find(p => p.sku === selectedSku);
  
  // Get slot assignment info for selected slot
  const selectedSlotAssignment = assignments.find(a => a.slot_id === selectedSlotId);
  const slotProduct = selectedSlotAssignment ? products.find(p => p.id === selectedSlotAssignment.product_id) : null;

  // Auto-fill unit price when product is selected and check inventory
  useEffect(() => {
    if (selectedProduct && selectedProduct.price && unitPrice === 0) {
      setUnitPrice(selectedProduct.price);
    }
  }, [selectedProduct, unitPrice]);

  useEffect(() => {
    if (slotProduct && slotProduct.price && unitPrice === 0) {
      setUnitPrice(slotProduct.price);
    }
    if (selectedSlotId) {
      checkCurrentInventory(selectedSlotId);
    }
  }, [slotProduct, unitPrice, selectedSlotId]);

  const checkCurrentInventory = async (slotId: string) => {
    try {
      const { data, error } = await supabase
        .from('inventory_levels')
        .select('*')
        .eq('slot_id', slotId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setCurrentInventory(data);
      setShowInventoryImpact(!!data);
    } catch (error) {
      console.error('Error checking inventory:', error);
      setCurrentInventory(null);
      setShowInventoryImpact(false);
    }
  };

  const resetForm = () => {
    setSelectedSlotId("");
    setSelectedSku("");
    setQuantity(1);
    setUnitPrice(0);
    setOccurredAt(new Date().toISOString().slice(0, 16));
    setSource("manual");
  };

  const recordSale = async () => {
    // Determine product ID from either slot selection or SKU
    let productId = "";
    if (selectedSlotId && slotProduct) {
      productId = slotProduct.id;
    } else if (selectedSku && selectedProduct) {
      productId = selectedProduct.id;
    } else {
      toast({
        title: "Product selection required",
        description: "Please select a product or slot",
        variant: "destructive"
      });
      return;
    }

    if (!selectedMachineId) {
      toast({
        title: "Machine selection required",
        description: "Please select a machine",
        variant: "destructive"
      });
      return;
    }

    if (quantity <= 0) {
      toast({
        title: "Invalid quantity",
        description: "Quantity must be greater than 0",
        variant: "destructive"
      });
      return;
    }

    if (unitPrice <= 0) {
      toast({
        title: "Invalid price",
        description: "Unit price must be greater than 0",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const saleData = {
        machine_id: selectedMachineId,
        product_id: productId,
        qty: quantity,
        unit_price_cents: Math.round(unitPrice * 100), // Convert to cents
        unit_cost_cents: (slotProduct?.cost || selectedProduct?.cost) ? 
          Math.round((slotProduct?.cost || selectedProduct?.cost || 0) * 100) : undefined,
        occurred_at: occurredAt || undefined,
        source
      };

      await api.recordSale(saleData);
      
      const productName = slotProduct?.name || selectedProduct?.name;
      const total = (quantity * unitPrice).toFixed(2);
      toast({
        title: "Sale recorded successfully",
        description: `${quantity}x ${productName} for $${total}`
      });

      resetForm();
    } catch (error: any) {
      console.error('Error recording sale:', error);
      toast({
        title: "Error recording sale",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-2">
        <ShoppingCart className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Sales Entry</h1>
        <HelpTooltip 
          content="Manually record product sales for tracking revenue and inventory. Select machine and slot, or enter product SKU directly. System will automatically deduct from inventory levels."
          size="md"
        />
      </div>
      <p className="text-muted-foreground">
        Record product sales by machine slot or product SKU
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Machine & Slot Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Select Machine & Slot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="machine">Machine</Label>
              <Select value={selectedMachineId} onValueChange={setSelectedMachineId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a machine..." />
                </SelectTrigger>
                <SelectContent>
                  {machines.map((machine) => (
                    <SelectItem key={machine.id} value={machine.id}>
                      {machine.name}
                      {machine.location && (
                        <span className="text-muted-foreground ml-2">
                          • {machine.location}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slot">Slot</Label>
              <Select 
                value={selectedSlotId} 
                onValueChange={setSelectedSlotId}
                disabled={!selectedMachineId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a slot..." />
                </SelectTrigger>
                <SelectContent>
                  {slots.map((slot) => {
                    const assignment = assignments.find(a => a.slot_id === slot.id);
                    const product = assignment ? products.find(p => p.id === assignment.product_id) : null;
                    return (
                      <SelectItem key={slot.id} value={slot.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-mono">{slot.label}</span>
                          {product && (
                            <>
                              <span>•</span>
                              <span>{product.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {product.sku}
                              </Badge>
                            </>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedSlotId && slotProduct && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium">{slotProduct.name}</div>
                <div className="text-xs text-muted-foreground">
                  SKU: {slotProduct.sku}
                  {slotProduct.price && (
                    <span className="ml-2">• Price: ${slotProduct.price.toFixed(2)}</span>
                  )}
                  {slotProduct.cost && (
                    <span className="ml-2">• Cost: ${slotProduct.cost.toFixed(2)}</span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alternative SKU Entry */}
        <Card>
          <CardHeader>
            <CardTitle>Alternative: Direct SKU Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sku">Product SKU</Label>
              <Input
                id="sku"
                placeholder="Enter or search SKU..."
                value={selectedSku}
                onChange={(e) => setSelectedSku(e.target.value)}
                list="sku-options"
              />
              <datalist id="sku-options">
                {products.map((product) => (
                  <option key={product.sku} value={product.sku}>
                    {product.name}
                  </option>
                ))}
              </datalist>
            </div>

            {selectedProduct && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium">{selectedProduct.name}</div>
                <div className="text-xs text-muted-foreground">
                  {selectedProduct.category && (
                    <span>{selectedProduct.category} • </span>
                  )}
                  {selectedProduct.price && (
                    <span>Price: ${selectedProduct.price.toFixed(2)}</span>
                  )}
                  {selectedProduct.cost && (
                    <span className="ml-2">• Cost: ${selectedProduct.cost.toFixed(2)}</span>
                  )}
                </div>
              </div>
            )}

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <strong>Note:</strong> When using SKU entry, make sure to also select 
                  the machine where the sale occurred for accurate tracking.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Impact Alert */}
      {showInventoryImpact && currentInventory && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Current Inventory Impact</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-600">Current Stock:</span>
                <span className="font-medium ml-2">{currentInventory.current_qty}</span>
              </div>
              <div>
                <span className="text-blue-600">After Sale:</span>
                <span className="font-medium ml-2">
                  {Math.max(0, currentInventory.current_qty - quantity)}
                </span>
              </div>
              <div>
                <span className="text-blue-600">Reorder Point:</span>
                <span className="font-medium ml-2">{currentInventory.reorder_point}</span>
              </div>
              <div>
                <span className="text-blue-600">Days of Supply:</span>
                <span className="font-medium ml-2">
                  {currentInventory.sales_velocity > 0 
                    ? Math.round((currentInventory.current_qty - quantity) / currentInventory.sales_velocity)
                    : '∞'
                  }
                </span>
              </div>
            </div>
            {currentInventory.current_qty - quantity <= currentInventory.reorder_point && (
              <div className="mt-2 p-2 bg-orange-100 rounded text-orange-800 text-sm">
                ⚠️ This sale will trigger a restock alert!
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sale Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Sale Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                placeholder="Enter quantity"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Unit Price ($)</Label>
              <Input
                id="unitPrice"
                type="number"
                min="0.01"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual Entry</SelectItem>
                  <SelectItem value="vending_machine">Vending Machine</SelectItem>
                  <SelectItem value="mobile_app">Mobile App</SelectItem>
                  <SelectItem value="cash_sale">Cash Sale</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="occurredAt">Sale Date & Time</Label>
            <Input
              id="occurredAt"
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
            />
          </div>

          <Separator className="my-6" />

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {(selectedSlotId || selectedSku) && quantity > 0 && unitPrice > 0 && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Ready to record sale of {quantity} items at ${unitPrice.toFixed(2)} each
                  <Badge variant="default" className="ml-2">
                    Total: ${(quantity * unitPrice).toFixed(2)}
                  </Badge>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={resetForm}>
                Clear Form
              </Button>
              <Button 
                onClick={recordSale} 
                disabled={loading || !selectedMachineId || (!selectedSlotId && !selectedSku) || quantity <= 0 || unitPrice <= 0}
              >
                {loading ? "Recording..." : "Record Sale"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}