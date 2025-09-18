import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Package, Truck, BarChart3, Plus, Minus, Search, Download, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface InventoryLevel {
  id: string;
  machine_id: string;
  product_id: string;
  slot_id: string;
  current_qty: number;
  par_level: number;
  reorder_point: number;
  days_of_supply: number;
  sales_velocity: number;
  last_restocked_at: string | null;
  machine_name?: string;
  product_name?: string;
  slot_label?: string;
}

interface RestockEntry {
  machine_id: string;
  product_id: string;
  slot_id: string;
  quantity: number;
  notes?: string;
}

export default function Inventory() {
  const [inventoryLevels, setInventoryLevels] = useState<InventoryLevel[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMachine, setSelectedMachine] = useState<string>("all");
  const [restockDialogOpen, setRestockDialogOpen] = useState(false);
  const [restockData, setRestockData] = useState<RestockEntry>({
    machine_id: "",
    product_id: "",
    slot_id: "",
    quantity: 0
  });

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    setLoading(true);
    try {
      // Load inventory levels with machine and product info
      const { data: inventory, error: invError } = await supabase
        .from('inventory_levels')
        .select(`
          *,
          machines!inner(name),
          products!inner(name),
          machine_slots!inner(label)
        `)
        .order('current_qty', { ascending: true });

      if (invError) throw invError;

      // Transform data to include names
      const transformedInventory = (inventory || []).map(item => ({
        ...item,
        machine_name: (item as any).machines?.name || 'Unknown Machine',
        product_name: (item as any).products?.name || 'Unknown Product',
        slot_label: (item as any).machine_slots?.label || 'Unknown Slot'
      }));

      setInventoryLevels(transformedInventory);

      // Load machines and products for dropdowns
      const [machinesRes, productsRes] = await Promise.all([
        supabase.from('machines').select('id, name').order('name'),
        supabase.from('products').select('id, name, sku').order('name')
      ]);

      setMachines(machinesRes.data || []);
      setProducts(productsRes.data || []);

    } catch (error: any) {
      console.error('Error loading inventory:', error);
      toast({
        title: "Error",
        description: "Failed to load inventory data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestock = async () => {
    if (!restockData.machine_id || !restockData.product_id || !restockData.quantity) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Record inventory transaction
      const { error: transError } = await supabase
        .from('inventory_transactions')
        .insert({
          product_id: restockData.product_id,
          machine_id: restockData.machine_id,
          slot_id: restockData.slot_id || null,
          qty_change: restockData.quantity,
          reason: 'restock',
          ref_type: 'manual_restock',
          org_id: '00000000-0000-0000-0000-000000000000' // Default org for now
        });

      if (transError) throw transError;

      // Update inventory level by fetching current quantity first
      const { data: currentLevel, error: fetchError } = await supabase
        .from('inventory_levels')
        .select('current_qty')
        .eq('machine_id', restockData.machine_id)
        .eq('product_id', restockData.product_id)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('inventory_levels')
        .update({
          current_qty: (currentLevel?.current_qty || 0) + restockData.quantity,
          last_restocked_at: new Date().toISOString()
        })
        .eq('machine_id', restockData.machine_id)
        .eq('product_id', restockData.product_id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Inventory restocked successfully.",
      });

      setRestockDialogOpen(false);
      setRestockData({ machine_id: "", product_id: "", slot_id: "", quantity: 0 });
      loadInventoryData();

    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to restock: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const getStockStatus = (current: number, reorderPoint: number, parLevel: number) => {
    if (current === 0) return { status: 'Out of Stock', variant: 'destructive' as const, color: 'text-red-600' };
    if (current <= reorderPoint) return { status: 'Low Stock', variant: 'destructive' as const, color: 'text-orange-600' };
    if (current < parLevel * 0.5) return { status: 'Below Par', variant: 'secondary' as const, color: 'text-yellow-600' };
    return { status: 'In Stock', variant: 'default' as const, color: 'text-green-600' };
  };

  const exportInventoryData = () => {
    const csvData = filteredInventory.map(item => ({
      machine: item.machine_name,
      slot: item.slot_label,
      product: item.product_name,
      current_stock: item.current_qty,
      par_level: item.par_level,
      reorder_point: item.reorder_point,
      days_of_supply: item.days_of_supply?.toFixed(1) || '0',
      last_restocked: item.last_restocked_at ? new Date(item.last_restocked_at).toLocaleDateString() : 'Never'
    }));

    const csv = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory-levels.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredInventory = inventoryLevels.filter(item => {
    const matchesSearch = !searchTerm || 
      item.machine_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.slot_label?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMachine = selectedMachine === 'all' || item.machine_id === selectedMachine;
    
    return matchesSearch && matchesMachine;
  });

  const lowStockItems = inventoryLevels.filter(item => item.current_qty <= item.reorder_point);
  const outOfStockItems = inventoryLevels.filter(item => item.current_qty === 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">Manage product inventory and stock levels</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">Manage product inventory and stock levels</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportInventoryData}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={loadInventoryData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={restockDialogOpen} onOpenChange={setRestockDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Package className="h-4 w-4 mr-2" />
                Restock
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Restock Inventory</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Machine</Label>
                  <Select value={restockData.machine_id} onValueChange={(value) => 
                    setRestockData({...restockData, machine_id: value})
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select machine" />
                    </SelectTrigger>
                    <SelectContent>
                      {machines.map(machine => (
                        <SelectItem key={machine.id} value={machine.id}>
                          {machine.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Product</Label>
                  <Select value={restockData.product_id} onValueChange={(value) => 
                    setRestockData({...restockData, product_id: value})
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={restockData.quantity}
                    onChange={(e) => setRestockData({...restockData, quantity: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setRestockDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleRestock}>
                    Restock
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Inventory</p>
                <p className="text-2xl font-bold">{inventoryLevels.reduce((sum, item) => sum + item.current_qty, 0)}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock Alerts</p>
                <p className="text-2xl font-bold text-orange-600">{lowStockItems.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{outOfStockItems.length}</p>
              </div>
              <Minus className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Slots</p>
                <p className="text-2xl font-bold">{inventoryLevels.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="current" className="space-y-4">
        <TabsList>
          <TabsTrigger value="current">Current Inventory</TabsTrigger>
          <TabsTrigger value="alerts">Stock Alerts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Current Inventory Levels</CardTitle>
                  <CardDescription>Track stock levels across all machines</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search inventory..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Select value={selectedMachine} onValueChange={setSelectedMachine}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All machines" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Machines</SelectItem>
                      {machines.map(machine => (
                        <SelectItem key={machine.id} value={machine.id}>
                          {machine.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Machine</TableHead>
                    <TableHead>Slot</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Current</TableHead>
                    <TableHead>Par Level</TableHead>
                    <TableHead>Reorder Point</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Days Supply</TableHead>
                    <TableHead>Last Restocked</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item) => {
                    const status = getStockStatus(item.current_qty, item.reorder_point, item.par_level);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.machine_name}</TableCell>
                        <TableCell>{item.slot_label}</TableCell>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell className={status.color}>{item.current_qty}</TableCell>
                        <TableCell>{item.par_level}</TableCell>
                        <TableCell>{item.reorder_point}</TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.status}</Badge>
                        </TableCell>
                        <TableCell>{item.days_of_supply?.toFixed(1) || 'N/A'}</TableCell>
                        <TableCell>
                          {item.last_restocked_at 
                            ? new Date(item.last_restocked_at).toLocaleDateString()
                            : 'Never'
                          }
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="grid gap-4">
            {outOfStockItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">Out of Stock Items</CardTitle>
                  <CardDescription>Items that need immediate restocking</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {outOfStockItems.map(item => (
                      <div key={item.id} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <span className="font-medium">{item.product_name}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {item.machine_name} - {item.slot_label}
                          </span>
                        </div>
                        <Badge variant="destructive">Out of Stock</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {lowStockItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-orange-600">Low Stock Alerts</CardTitle>
                  <CardDescription>Items below reorder point</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {lowStockItems.filter(item => item.current_qty > 0).map(item => (
                      <div key={item.id} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <span className="font-medium">{item.product_name}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {item.machine_name} - {item.slot_label}
                          </span>
                          <span className="text-sm ml-2">
                            ({item.current_qty} remaining)
                          </span>
                        </div>
                        <Badge variant="destructive">Low Stock</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Analytics</CardTitle>
              <CardDescription>Performance metrics and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {inventoryLevels.length > 0 
                      ? (inventoryLevels
                          .filter(item => item.days_of_supply && item.days_of_supply > 0)
                          .reduce((sum, item) => sum + (item.days_of_supply || 0), 0) / 
                        inventoryLevels.filter(item => item.days_of_supply && item.days_of_supply > 0).length
                        ).toFixed(1)
                      : '0'
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">Avg Days of Supply</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {((inventoryLevels.length - outOfStockItems.length) / Math.max(inventoryLevels.length, 1) * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Stock Availability</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {(lowStockItems.length / Math.max(inventoryLevels.length, 1) * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Items Need Restocking</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}