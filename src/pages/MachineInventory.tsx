import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Settings, Package, AlertTriangle, Plus, Edit, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Machine {
  id: string;
  name: string;
  location: string;
  status: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  cost_cents: number;
}

interface MachineSlot {
  id: string;
  label: string;
  row: number;
  col: number;
  capacity?: number;
  product?: Product;
  current_qty: number;
  reorder_point: number;
  par_level: number;
}

export default function MachineInventory() {
  const { machineId } = useParams<{ machineId: string }>();
  const [machine, setMachine] = useState<Machine | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [slots, setSlots] = useState<MachineSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [slotConfig, setSlotConfig] = useState({ rows: 4, cols: 8 });

  useEffect(() => {
    if (machineId) {
      fetchMachineData();
      fetchProducts();
      fetchSlots();
    }
  }, [machineId]);

  const fetchMachineData = async () => {
    try {
      const { data, error } = await supabase
        .from('machines')
        .select('id, name, status')
        .eq('id', machineId)
        .single();

      if (error) throw error;
      setMachine({ ...data, location: 'Unknown' }); // Default location since column doesn't exist
    } catch (error) {
      console.error('Error fetching machine:', error);
      toast({
        title: "Error",
        description: "Failed to fetch machine data.",
        variant: "destructive",
      });
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku, cost_cents')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchSlots = async () => {
    try {
      // Fetch machine slots with their assignments and inventory levels
      const { data: slotsData, error: slotsError } = await supabase
        .from('machine_slots')
        .select(`
          id, label, row, col, capacity,
          slot_assignments!inner(product_id, max_qty, restock_threshold),
          inventory_levels(current_qty, reorder_point, par_level)
        `)
        .eq('machine_id', machineId)
        .order('row, col');

      if (slotsError) throw slotsError;

      // Get product details for assigned slots
      const productIds = slotsData?.map(slot => slot.slot_assignments?.[0]?.product_id).filter(Boolean) || [];
      let productsMap: Record<string, Product> = {};

      if (productIds.length > 0) {
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, name, sku, cost_cents')
          .in('id', productIds);

        if (productsError) throw productsError;
        productsMap = (productsData || []).reduce((acc, product) => {
          acc[product.id] = product;
          return acc;
        }, {} as Record<string, Product>);
      }

      // Transform the data
      const transformedSlots: MachineSlot[] = (slotsData || []).map(slot => ({
        id: slot.id,
        label: slot.label,
        row: slot.row,
        col: slot.col,
        capacity: slot.capacity,
        product: slot.slot_assignments?.[0]?.product_id 
          ? productsMap[slot.slot_assignments[0].product_id] 
          : undefined,
        current_qty: slot.inventory_levels?.[0]?.current_qty || 0,
        reorder_point: slot.inventory_levels?.[0]?.reorder_point || 3,
        par_level: slot.inventory_levels?.[0]?.par_level || 10
      }));

      setSlots(transformedSlots);
    } catch (error) {
      console.error('Error fetching slots:', error);
      toast({
        title: "Error",
        description: "Failed to fetch slot data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSlots = async () => {
    if (!machineId) return;

    try {
      // Call the database function to generate slots
      const { error } = await supabase.rpc('generate_machine_slots', {
        p_machine_id: machineId,
        p_rows: slotConfig.rows,
        p_cols: slotConfig.cols
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Generated ${slotConfig.rows * slotConfig.cols} slots successfully.`,
      });

      setIsConfigDialogOpen(false);
      fetchSlots();
    } catch (error) {
      console.error('Error generating slots:', error);
      toast({
        title: "Error",
        description: "Failed to generate slots. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateSlotAssignment = async (slotId: string, productId: string, maxQty: number, restockThreshold: number) => {
    try {
      // Update slot assignment - use RPC function to handle org_id automatically
      const { error: assignmentError } = await supabase.rpc('upsert_slot_assignments', {
        p_machine_id: machineId,
        p_assignments: [{
          label: slots.find(s => s.id === slotId)?.label || '',
          product_id: productId || null,
          max_qty: maxQty,
          restock_threshold: restockThreshold
        }]
      });

      if (assignmentError) throw assignmentError;

      toast({
        title: "Success",
        description: "Slot assignment updated successfully.",
      });

      fetchSlots();
    } catch (error) {
      console.error('Error updating slot assignment:', error);
      toast({
        title: "Error",
        description: "Failed to update slot assignment.",
        variant: "destructive",
      });
    }
  };

  const getStockStatus = (slot: MachineSlot) => {
    if (!slot.product) return { status: 'empty', color: 'bg-gray-100 text-gray-600' };
    
    if (slot.current_qty === 0) return { status: 'out', color: 'bg-red-100 text-red-700' };
    if (slot.current_qty <= slot.reorder_point) return { status: 'low', color: 'bg-yellow-100 text-yellow-700' };
    return { status: 'good', color: 'bg-green-100 text-green-700' };
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Machine Not Found</h1>
          <Link to="/machines">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Machines
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/machines">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{machine.name}</h1>
            <p className="text-muted-foreground">
              {machine.location} • Status: {machine.status}
            </p>
          </div>
        </div>
        
        <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Settings className="mr-2 h-4 w-4" />
              Configure Slots
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configure Machine Slots</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rows">Rows</Label>
                  <Input
                    id="rows"
                    type="number"
                    min="1"
                    max="10"
                    value={slotConfig.rows}
                    onChange={(e) => setSlotConfig({ ...slotConfig, rows: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cols">Columns</Label>
                  <Input
                    id="cols"
                    type="number"
                    min="1"
                    max="20"
                    value={slotConfig.cols}
                    onChange={(e) => setSlotConfig({ ...slotConfig, cols: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                This will generate {slotConfig.rows * slotConfig.cols} slots (A1, A2, B1, B2, etc.)
              </p>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={generateSlots}>
                  Generate Slots
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Slots Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Machine Slots ({slots.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {slots.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No slots configured</h3>
              <p className="text-muted-foreground mb-4">
                Configure the machine's slot layout to start managing inventory.
              </p>
              <Button onClick={() => setIsConfigDialogOpen(true)}>
                <Settings className="mr-2 h-4 w-4" />
                Configure Slots
              </Button>
            </div>
          ) : (
            <div className="grid gap-2" style={{ 
              gridTemplateColumns: `repeat(${Math.max(...slots.map(s => s.col))}, minmax(200px, 1fr))` 
            }}>
              {slots.map((slot) => {
                const stockStatus = getStockStatus(slot);
                const isEditing = editingSlot === slot.id;

                return (
                  <Card key={slot.id} className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-mono font-bold text-sm">{slot.label}</div>
                      <Badge className={stockStatus.color}>
                        {stockStatus.status}
                      </Badge>
                    </div>

                    {isEditing ? (
                      <SlotEditor
                        slot={slot}
                        products={products}
                        onSave={(productId, maxQty, restockThreshold) => {
                          updateSlotAssignment(slot.id, productId, maxQty, restockThreshold);
                          setEditingSlot(null);
                        }}
                        onCancel={() => setEditingSlot(null)}
                      />
                    ) : (
                      <div className="space-y-2">
                        {slot.product ? (
                          <>
                            <div className="text-sm font-medium">{slot.product.name}</div>
                            <div className="text-xs text-muted-foreground">
                              SKU: {slot.product.sku}
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span>Stock: {slot.current_qty}/{slot.par_level}</span>
                              {slot.current_qty <= slot.reorder_point && (
                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-muted-foreground">No product assigned</div>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => setEditingSlot(slot.id)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface SlotEditorProps {
  slot: MachineSlot;
  products: Product[];
  onSave: (productId: string, maxQty: number, restockThreshold: number) => void;
  onCancel: () => void;
}

function SlotEditor({ slot, products, onSave, onCancel }: SlotEditorProps) {
  const [selectedProduct, setSelectedProduct] = useState(slot.product?.id || "");
  const [maxQty, setMaxQty] = useState(slot.par_level);
  const [restockThreshold, setRestockThreshold] = useState(slot.reorder_point);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label className="text-xs">Product</Label>
        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
          <SelectTrigger className="h-8">
            <SelectValue placeholder="Select product" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">No product</SelectItem>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name} ({product.sku})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedProduct && (
        <>
          <div className="space-y-2">
            <Label className="text-xs">Max Capacity</Label>
            <Input
              type="number"
              min="1"
              value={maxQty}
              onChange={(e) => setMaxQty(parseInt(e.target.value) || 1)}
              className="h-8"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Reorder Point</Label>
            <Input
              type="number"
              min="0"
              value={restockThreshold}
              onChange={(e) => setRestockThreshold(parseInt(e.target.value) || 0)}
              className="h-8"
            />
          </div>
        </>
      )}

      <div className="flex space-x-2">
        <Button
          size="sm"
          onClick={() => onSave(selectedProduct, maxQty, restockThreshold)}
          className="flex-1"
        >
          <Save className="mr-1 h-3 w-3" />
          Save
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}