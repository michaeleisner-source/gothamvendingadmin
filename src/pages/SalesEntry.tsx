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
import { ShoppingCart, Building2, AlertCircle, CheckCircle, DollarSign, Package, AlertTriangle, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { HelpTooltip } from "@/components/ui/HelpTooltip";
import { 
  validateInventoryForSale, 
  validatePricing, 
  validateTransactionDate, 
  updateInventoryAfterSale,
  type ValidationResult,
  type InventoryCheck,
  type PricingCheck,
  type InventoryValidationResult,
  type PricingValidationResult
} from "@/lib/business-rules";

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
  
  // Business validation states
  const [inventoryValidation, setInventoryValidation] = useState<InventoryValidationResult | null>(null);
  const [pricingValidation, setPricingValidation] = useState<PricingValidationResult | null>(null);
  const [dateValidation, setDateValidation] = useState<ValidationResult | null>(null);

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
    // Inventory validation is now handled by the business rules hook below
  }, [slotProduct, unitPrice, selectedSlotId]);

  // Validate business rules when values change
  useEffect(() => {
    if (selectedSlotId && quantity > 0) {
      validateInventoryForSale(selectedSlotId, quantity).then(result => {
        setInventoryValidation(result);
        setCurrentInventory(result.inventory || null);
        setShowInventoryImpact(!!result.inventory);
      });
    } else {
      setInventoryValidation(null);
      setCurrentInventory(null);
      setShowInventoryImpact(false);
    }
  }, [selectedSlotId, quantity]);

  useEffect(() => {
    if (unitPrice > 0) {
      const cost = slotProduct?.cost || selectedProduct?.cost || 0;
      const result = validatePricing(unitPrice, cost);
      setPricingValidation(result);
    } else {
      setPricingValidation(null);
    }
  }, [unitPrice, slotProduct, selectedProduct]);

  useEffect(() => {
    if (occurredAt) {
      const result = validateTransactionDate(occurredAt);
      setDateValidation(result);
    } else {
      setDateValidation(null);
    }
  }, [occurredAt]);

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

    // Validate required fields
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

    // Check business rule validations
    if (inventoryValidation?.validation.severity === 'error') {
      toast({
        title: "Inventory validation failed",
        description: inventoryValidation.validation.message,
        variant: "destructive"
      });
      return;
    }

    if (pricingValidation?.validation.severity === 'error') {
      toast({
        title: "Pricing validation failed", 
        description: pricingValidation.validation.message,
        variant: "destructive"
      });
      return;
    }

    if (dateValidation?.severity === 'error') {
      toast({
        title: "Date validation failed",
        description: dateValidation.message,
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
      
      // Update inventory if slot-based sale
      if (selectedSlotId) {
        try {
          await updateInventoryAfterSale(selectedSlotId, quantity);
        } catch (invError: any) {
          console.warn('Inventory update failed:', invError.message);
          // Don't fail the sale, just warn
          toast({
            title: "Sale recorded, inventory warning",
            description: "Sale was recorded but inventory may not be updated correctly",
            variant: "default"
          });
        }
      }
      
      const productName = slotProduct?.name || selectedProduct?.name;
      const total = (quantity * unitPrice).toFixed(2);
      
      // Show success with any warnings
      let description = `${quantity}x ${productName} for $${total}`;
      if (inventoryValidation?.validation.severity === 'warning') {
        description += ` (${inventoryValidation.validation.message})`;
      }
      if (pricingValidation?.validation.severity === 'warning') {
        description += ` (${pricingValidation.validation.message})`;
      }
      
      toast({
        title: "Sale recorded successfully",
        description,
        variant: "default"
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

      {/* Business Validation Alerts */}
      {(inventoryValidation?.validation.severity === 'warning' || 
        pricingValidation?.validation.severity === 'warning' || 
        dateValidation?.severity === 'warning') && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Business Rule Warnings</span>
            </div>
            <div className="space-y-2 text-sm text-yellow-700">
              {inventoryValidation?.validation.severity === 'warning' && (
                <div>• {inventoryValidation.validation.message}</div>
              )}
              {pricingValidation?.validation.severity === 'warning' && (
                <div>• {pricingValidation.validation.message}</div>
              )}
              {dateValidation?.severity === 'warning' && (
                <div>• {dateValidation.message}</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {(inventoryValidation?.validation.severity === 'error' || 
        pricingValidation?.validation.severity === 'error' || 
        dateValidation?.severity === 'error') && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Validation Errors</span>
            </div>
            <div className="space-y-2 text-sm text-red-700">
              {inventoryValidation?.validation.severity === 'error' && (
                <div>• {inventoryValidation.validation.message}</div>
              )}
              {pricingValidation?.validation.severity === 'error' && (
                <div>• {pricingValidation.validation.message}</div>
              )}
              {dateValidation?.severity === 'error' && (
                <div>• {dateValidation.message}</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Analysis Card */}
      {pricingValidation?.pricing && unitPrice > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Pricing Analysis</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-600">Unit Price:</span>
                <span className="font-medium ml-2">${pricingValidation.pricing.unitPrice.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-blue-600">Unit Cost:</span>
                <span className="font-medium ml-2">${pricingValidation.pricing.unitCost.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-blue-600">Margin:</span>
                <span className="font-medium ml-2">${pricingValidation.pricing.margin.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-blue-600">Margin %:</span>
                <span className={`font-medium ml-2 ${
                  pricingValidation.pricing.marginPercent < 0.15 ? 'text-red-600' : 
                  pricingValidation.pricing.marginPercent < 0.25 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {(pricingValidation.pricing.marginPercent * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory Impact Alert */}
      {showInventoryImpact && inventoryValidation?.inventory && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Inventory Impact</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-600">Current Stock:</span>
                <span className="font-medium ml-2">{inventoryValidation.inventory.currentStock}</span>
              </div>
              <div>
                <span className="text-green-600">After Sale:</span>
                <span className={`font-medium ml-2 ${
                  inventoryValidation.inventory.afterTransaction <= inventoryValidation.inventory.reorderPoint ? 'text-orange-600' : ''
                }`}>
                  {inventoryValidation.inventory.afterTransaction}
                </span>
              </div>
              <div>
                <span className="text-green-600">Reorder Point:</span>
                <span className="font-medium ml-2">{inventoryValidation.inventory.reorderPoint}</span>
              </div>
              <div>
                <span className="text-green-600">Status:</span>
                <Badge variant={inventoryValidation.inventory.belowReorderPoint ? "destructive" : "default"} className="ml-2">
                  {inventoryValidation.inventory.belowReorderPoint ? "Needs Restock" : "OK"}
                </Badge>
              </div>
            </div>
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