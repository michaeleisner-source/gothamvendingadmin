import React, { useEffect, useState } from "react";
import { api, Product, Machine, MachineSlot, SlotAssignment } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, Truck, AlertCircle, CheckCircle, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { HelpTooltip } from "@/components/ui/HelpTooltip";
import { updateInventoryAfterRestock, validatePricing, type PricingValidationResult } from "@/lib/business-rules";

export default function RestockEntry() {
  const [products, setProducts] = useState<Product[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [slots, setSlots] = useState<MachineSlot[]>([]);
  const [assignments, setAssignments] = useState<SlotAssignment[]>([]);
  const [selectedMachineId, setSelectedMachineId] = useState<string>("");
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [selectedSku, setSelectedSku] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [note, setNote] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Business validation
  const [costValidation, setCostValidation] = useState<PricingValidationResult | null>(null);

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
        toast.error(`Failed to load data: ${error.message}`);
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
          toast.error(`Failed to load slots: ${error.message}`);
        }
      } else {
        setSlots([]);
        setAssignments([]);
      }
      setSelectedSlotId("");
    };
    loadSlotsForMachine();
  }, [selectedMachineId]);

  // Get product info for selected SKU
  const selectedProduct = products.find(p => p.sku === selectedSku);
  
  // Get slot assignment info for selected slot
  const selectedSlotAssignment = assignments.find(a => a.slot_id === selectedSlotId);
  const slotProduct = selectedSlotAssignment ? products.find(p => p.id === selectedSlotAssignment.product_id) : null;

  // Auto-fill unit cost when product is selected and validate
  useEffect(() => {
    if (selectedProduct && selectedProduct.cost && unitCost === 0) {
      setUnitCost(selectedProduct.cost);
    }
    if (unitCost > 0) {
      const currentCost = slotProduct?.cost || selectedProduct?.cost || 0;
      if (currentCost > 0) {
        setCostValidation(validatePricing(currentCost, unitCost));
      }
    }
  }, [selectedProduct, unitCost, slotProduct]);

  useEffect(() => {
    if (slotProduct && slotProduct.cost && unitCost === 0) {
      setUnitCost(slotProduct.cost);
    }
    if (unitCost > 0 && slotProduct?.cost) {
      setCostValidation(validatePricing(slotProduct.cost, unitCost));
    }
  }, [slotProduct, unitCost]);

  const resetForm = () => {
    setSelectedSlotId("");
    setSelectedSku("");
    setQuantity(1);
    setUnitCost(0);
    setNote("");
  };

  const recordRestock = async () => {
    if (!selectedMachineId && !selectedSku) {
      toast.error("Please select a machine/slot or enter a SKU");
      return;
    }

    if (quantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    setLoading(true);
    try {
      // Start or get existing session
      let currentSessionId = sessionId;
      if (!currentSessionId && selectedMachineId) {
        currentSessionId = await api.startRestockSession(selectedMachineId, note || "Manual restock entry");
        setSessionId(currentSessionId);
      }

      if (selectedMachineId && selectedSlotId && currentSessionId) {
        // Machine-slot based restock
        const slot = slots.find(s => s.id === selectedSlotId);
        if (!slot) {
          toast.error("Selected slot not found");
          return;
        }

        const lines = [{
          slot_label: slot.label,
          prev_qty: 0, // We don't track previous qty in this simple form
          added_qty: quantity,
          new_qty: quantity, // Assuming this is the new total
        }];

        await api.saveRestockSession(currentSessionId, true, lines);
        toast.success(`Restocked ${quantity} items in slot ${slot.label}`);
      } else if (selectedSku) {
        // SKU-based restock - would need to implement a different approach
        // For now, we'll show an error and ask them to select a slot
        toast.error("SKU-only restocking not implemented. Please select a machine and slot.");
        return;
      }

      resetForm();
      setSessionId(null);
    } catch (error: any) {
      console.error('Error recording restock:', error);
      toast.error(`Failed to record restock: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Truck className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Restock Entry</h1>
        <HelpTooltip 
          content="Record inventory restocks to maintain accurate stock levels. Select machine and slot, or enter product SKU. System will update inventory levels and track restock history."
          size="md"
        />
      </div>
      <p className="text-muted-foreground">
        Record inventory restocks by machine slot or product SKU
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Machine & Slot Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
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
                  {selectedProduct.cost && (
                    <span>Cost: ${selectedProduct.cost.toFixed(2)}</span>
                  )}
                </div>
              </div>
            )}

            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <strong>Note:</strong> SKU-only entry requires selecting a machine and slot first. 
                  This helps track which specific machine location was restocked.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Restock Details */}
      <Card>
        <CardHeader>
          <CardTitle>Restock Details</CardTitle>
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
              <Label htmlFor="unitCost">Unit Cost ($)</Label>
              <Input
                id="unitCost"
                type="number"
                min="0"
                step="0.01"
                value={unitCost}
                onChange={(e) => setUnitCost(Number(e.target.value))}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Note (Optional)</Label>
              <Input
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Restock note..."
              />
            </div>
          </div>

          <Separator className="my-6" />

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {(selectedSlotId || selectedSku) && quantity > 0 && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Ready to record restock of {quantity} items
                  {unitCost > 0 && (
                    <span> at ${unitCost.toFixed(2)} each (${(quantity * unitCost).toFixed(2)} total)</span>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={resetForm}>
                Clear Form
              </Button>
              <Button 
                onClick={recordRestock} 
                disabled={loading || (!selectedSlotId && !selectedSku) || quantity <= 0}
              >
                {loading ? "Recording..." : "Record Restock"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}