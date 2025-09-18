import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Receipt, TrendingUp, AlertCircle, Plus, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Machine {
  id: string;
  name: string;
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
  product_id: string;
  product_name: string;
  product_sku: string;
  current_qty: number;
  unit_price_cents: number;
}

interface CartItem {
  product_id: string;
  product_name: string;
  product_sku: string;
  unit_price_cents: number;
  unit_cost_cents: number;
  qty: number;
  slot_label: string;
}

export default function SalesEntry() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<string>("");
  const [machineSlots, setMachineSlots] = useState<MachineSlot[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingSale, setProcessingSale] = useState(false);

  useEffect(() => {
    fetchMachines();
  }, []);

  useEffect(() => {
    if (selectedMachine) {
      fetchMachineSlots(selectedMachine);
    } else {
      setMachineSlots([]);
    }
    setCart([]); // Clear cart when switching machines
  }, [selectedMachine]);

  const fetchMachines = async () => {
    try {
      const { data, error } = await supabase
        .from('machines')
        .select('id, name, status')
        .eq('status', 'ONLINE')
        .order('name');

      if (error) throw error;
      setMachines(data || []);
    } catch (error) {
      console.error('Error fetching machines:', error);
      toast({
        title: "Error",
        description: "Failed to fetch machines.",
        variant: "destructive",
      });
    }
  };

  const fetchMachineSlots = async (machineId: string) => {
    setLoading(true);
    try {
      // Get slots with products and current inventory
      const { data, error } = await supabase
        .from('machine_slots')
        .select(`
          id, label,
          slot_assignments!inner(product_id),
          products!slot_assignments(name, sku, cost_cents),
          inventory_levels(current_qty)
        `)
        .eq('machine_id', machineId)
        .not('slot_assignments.product_id', 'is', null);

      if (error) throw error;

      // Get pricing separately to avoid typing issues
      const productIds = (data || []).map(slot => slot.slot_assignments[0]?.product_id).filter(Boolean);
      let pricingMap: Record<string, number> = {};

      if (productIds.length > 0) {
        const { data: pricingData, error: pricingError } = await supabase
          .from('machine_product_pricing')
          .select('product_id, price_cents')
          .eq('machine_id', machineId)
          .in('product_id', productIds);

        if (!pricingError && pricingData) {
          pricingMap = pricingData.reduce((acc, pricing) => {
            acc[pricing.product_id] = pricing.price_cents;
            return acc;
          }, {} as Record<string, number>);
        }
      }

      const transformedSlots: MachineSlot[] = (data || []).map(slot => ({
        id: slot.id,
        label: slot.label,
        product_id: slot.slot_assignments[0]?.product_id || '',
        product_name: (slot.products as any)?.name || 'Unknown Product',
        product_sku: (slot.products as any)?.sku || '',
        current_qty: slot.inventory_levels?.[0]?.current_qty || 0,
        unit_price_cents: pricingMap[slot.slot_assignments[0]?.product_id] || 150 // Default $1.50
      }));

      setMachineSlots(transformedSlots);
    } catch (error) {
      console.error('Error fetching machine slots:', error);
      toast({
        title: "Error",
        description: "Failed to fetch machine inventory.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (slot: MachineSlot) => {
    if (slot.current_qty <= 0) {
      toast({
        title: "Out of Stock",
        description: `${slot.product_name} is currently out of stock.`,
        variant: "destructive",
      });
      return;
    }

    const existingItem = cart.find(item => item.product_id === slot.product_id);
    
    if (existingItem) {
      if (existingItem.qty >= slot.current_qty) {
        toast({
          title: "Insufficient Stock",
          description: `Only ${slot.current_qty} units available.`,
          variant: "destructive",
        });
        return;
      }
      
      setCart(cart.map(item =>
        item.product_id === slot.product_id
          ? { ...item, qty: item.qty + 1 }
          : item
      ));
    } else {
      const newItem: CartItem = {
        product_id: slot.product_id,
        product_name: slot.product_name,
        product_sku: slot.product_sku,
        unit_price_cents: slot.unit_price_cents,
        unit_cost_cents: 0, // Will be fetched from products table
        qty: 1,
        slot_label: slot.label
      };
      setCart([...cart, newItem]);
    }
  };

  const updateCartQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      setCart(cart.filter(item => item.product_id !== productId));
    } else {
      const slot = machineSlots.find(s => s.product_id === productId);
      if (slot && newQty > slot.current_qty) {
        toast({
          title: "Insufficient Stock",
          description: `Only ${slot.current_qty} units available.`,
          variant: "destructive",
        });
        return;
      }
      
      setCart(cart.map(item =>
        item.product_id === productId
          ? { ...item, qty: newQty }
          : item
      ));
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.unit_price_cents * item.qty), 0);
  };

  const processSale = async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to the cart before processing sale.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedMachine) {
      toast({
        title: "No Machine Selected",
        description: "Please select a machine before processing sale.",
        variant: "destructive",
      });
      return;
    }

    setProcessingSale(true);
    try {
      // Record each item as a separate sale with enhanced data
      for (const item of cart) {
        // Get product cost
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('cost_cents')
          .eq('id', item.product_id)
          .single();

        if (productError) {
          console.warn('Could not fetch product cost:', productError);
        }

        // Record the sale using both old and new field formats for compatibility
        const { error: salesError } = await supabase
          .from('sales')
          .insert({
            machine_id: selectedMachine,
            product_id: item.product_id,
            product_name: item.product_name,
            qty: item.qty,
            quantity_sold: item.qty, // Legacy compatibility
            unit_price_cents: item.unit_price_cents,
            unit_price: item.unit_price_cents / 100, // Legacy compatibility
            total_amount: (item.unit_price_cents * item.qty) / 100, // Legacy compatibility
            payment_method: 'cash',
            occurred_at: new Date().toISOString()
          });

        if (salesError) throw salesError;

        // Update inventory levels
        const slot = machineSlots.find(s => s.product_id === item.product_id);
        if (slot) {
          await supabase
            .from('machine_slots')
            .update({ 
              current_qty: Math.max(0, slot.current_qty - item.qty)
            })
            .eq('id', slot.id);
        }
      }

      toast({
        title: "🎉 Sale Processed Successfully!",
        description: `Recorded ${cart.reduce((sum, item) => sum + item.qty, 0)} items for $${(calculateTotal() / 100).toFixed(2)}`,
      });

      // Clear cart and refresh inventory
      setCart([]);
      fetchMachineSlots(selectedMachine);
      
    } catch (error) {
      console.error('Error processing sale:', error);
      toast({
        title: "Error",
        description: "Failed to process sale. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingSale(false);
    }
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <ShoppingCart className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Sales Entry</h1>
          <p className="text-muted-foreground">Record vending machine sales and track inventory</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Machine Selection & Inventory */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Machine</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedMachine} onValueChange={setSelectedMachine}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a machine" />
                </SelectTrigger>
                <SelectContent>
                  {machines.map((machine) => (
                    <SelectItem key={machine.id} value={machine.id}>
                      {machine.name} ({machine.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedMachine && (
            <Card>
              <CardHeader>
                <CardTitle>Available Products</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : machineSlots.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="mx-auto h-12 w-12 mb-4" />
                    <p>No products available in this machine</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {machineSlots.map((slot) => (
                      <div
                        key={slot.id}
                        className={`border rounded-lg p-3 transition-colors ${
                          slot.current_qty > 0 
                            ? 'hover:bg-muted/50 cursor-pointer' 
                            : 'opacity-50 cursor-not-allowed'
                        }`}
                        onClick={() => slot.current_qty > 0 && addToCart(slot)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs">
                            {slot.label}
                          </Badge>
                          <Badge 
                            variant={slot.current_qty > 0 ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {slot.current_qty > 0 ? `${slot.current_qty} left` : 'Out of Stock'}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-medium text-sm">{slot.product_name}</h4>
                          <p className="text-xs text-muted-foreground">{slot.product_sku}</p>
                          <p className="font-semibold text-primary">
                            {formatPrice(slot.unit_price_cents)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Shopping Cart */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Shopping Cart</span>
                <Badge variant="secondary">{cart.length} items</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="mx-auto h-12 w-12 mb-4" />
                  <p>Cart is empty</p>
                  <p className="text-sm">Select products to add them</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.product_id} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{item.product_name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {item.product_sku} • Slot {item.slot_label}
                          </p>
                          <p className="text-sm font-semibold text-primary">
                            {formatPrice(item.unit_price_cents)} each
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => updateCartQuantity(item.product_id, item.qty - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.qty}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => updateCartQuantity(item.product_id, item.qty + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="font-semibold">
                          {formatPrice(item.unit_price_cents * item.qty)}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-primary">{formatPrice(calculateTotal())}</span>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={processSale}
                    disabled={processingSale}
                  >
                    {processingSale ? 'Processing...' : 'Process Sale'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Quick Stats</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Items in Cart:</span>
                <span className="font-medium">{cart.reduce((sum, item) => sum + item.qty, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Unique Products:</span>
                <span className="font-medium">{cart.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Average Price:</span>
                <span className="font-medium">
                  {cart.length > 0 
                    ? formatPrice(calculateTotal() / cart.reduce((sum, item) => sum + item.qty, 0))
                    : '$0.00'
                  }
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}