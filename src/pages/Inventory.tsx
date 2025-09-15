import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, TrendingUp, RefreshCw, MapPin, DollarSign, Search, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/ui/Header';
import { InventoryKPIs, InventoryStockDistribution } from '@/components/inventory/InventoryKPIs';
import { TopPerformingMachines, VelocityTrends, CriticalItemsAlert } from '@/components/inventory/InventoryMetrics';
import { useInventoryAnalytics } from '@/hooks/useInventoryAnalytics';

interface InventoryLevel {
  id: string;
  machine_id: string;
  slot_id: string;
  product_id: string;
  current_qty: number;
  par_level: number;
  reorder_point: number;
  last_restocked_at?: string;
  sales_velocity: number;
  days_of_supply: number;
  machines: { name: string };
  machine_slots: { label: string };
  products: { name: string; sku: string; cost?: number; price?: number };
}

interface InventoryStats {
  total_items: number;
  low_stock_items: number;
  out_of_stock_items: number;
  total_stock_value: number;
  total_potential_revenue: number;
  avg_days_of_supply: number;
}

const Inventory = () => {
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMachine, setFilterMachine] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [machines, setMachines] = useState<Array<{ id: string; name: string }>>([]);
  const [stats, setStats] = useState<InventoryStats>({
    total_items: 0,
    low_stock_items: 0,
    out_of_stock_items: 0,
    total_stock_value: 0,
    total_potential_revenue: 0,
    avg_days_of_supply: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [inventoryRes, machinesRes] = await Promise.all([
        supabase
          .from('inventory_levels')
          .select(`
            *,
            machines!inventory_levels_machine_id_fkey(name),
            machine_slots!inventory_levels_slot_id_fkey(label),
            products!inventory_levels_product_id_fkey(name, sku, cost, price)
          `)
          .order('current_qty', { ascending: true }),
        supabase.from('machines').select('id, name').order('name')
      ]);

      if (inventoryRes.error) throw inventoryRes.error;
      if (machinesRes.error) throw machinesRes.error;

      const inventoryData = inventoryRes.data || [];
      setInventory(inventoryData);
      setMachines(machinesRes.data || []);

      // Calculate stats
      const totalItems = inventoryData.length;
      const lowStockItems = inventoryData.filter(item => item.current_qty <= item.reorder_point && item.current_qty > 0).length;
      const outOfStockItems = inventoryData.filter(item => item.current_qty === 0).length;
      const avgDaysOfSupply = inventoryData.reduce((sum, item) => sum + (item.days_of_supply || 0), 0) / totalItems || 0;
      const totalStockValue = inventoryData.reduce((sum, item) => sum + (item.current_qty * (item.products.cost || 0)), 0);
      const totalPotentialRevenue = inventoryData.reduce((sum, item) => sum + (item.current_qty * (item.products.price || 0)), 0);

      setStats({
        total_items: totalItems,
        low_stock_items: lowStockItems,
        out_of_stock_items: outOfStockItems,
        total_stock_value: totalStockValue,
        total_potential_revenue: totalPotentialRevenue,
        avg_days_of_supply: Math.round(avgDaysOfSupply * 10) / 10
      });
    } catch (error) {
      toast({
        title: "Error loading inventory",
        description: error instanceof Error ? error.message : "Failed to load inventory data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const recalculateVelocity = async () => {
    try {
      // Trigger recalculation by calling a custom function
      const { error } = await supabase.rpc('check_machine_health_and_create_tickets');
      if (error) throw error;

      toast({
        title: "Velocity updated",
        description: "Sales velocity has been recalculated for all products"
      });
      
      loadData();
    } catch (error) {
      toast({
        title: "Error updating velocity",
        description: error instanceof Error ? error.message : "Failed to update sales velocity",
        variant: "destructive"
      });
    }
  };

  const getStockStatus = (item: InventoryLevel) => {
    if (item.current_qty === 0) return 'out';
    if (item.current_qty <= item.reorder_point) return 'low';
    if (item.current_qty >= item.par_level * 0.8) return 'good';
    return 'medium';
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'out': return 'bg-red-100 text-red-800';
      case 'low': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'good': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStockStatusText = (status: string) => {
    switch (status) {
      case 'out': return 'Out of Stock';
      case 'low': return 'Low Stock';
      case 'medium': return 'Medium Stock';
      case 'good': return 'Good Stock';
      default: return 'Unknown';
    }
  };

  const getStatusBadge = (status: string) => {
    return <Badge className={getStockStatusColor(status)}>{getStockStatusText(status)}</Badge>;
  };

  const exportInventoryCSV = () => {
    if (!inventory.length) {
      toast({
        title: "No data to export",
        description: "No inventory data available for export",
        variant: "destructive"
      });
      return;
    }

    const headers = [
      'Machine', 'Slot', 'Product', 'Current Qty', 'PAR Level', 
      'Reorder Point', 'Sales Velocity', 'Days Supply', 'Stock Value', 'Status'
    ];
    
    const csvContent = [
      headers.join(','),
      ...inventory.map(item => [
        item.machines.name,
        item.machine_slots.label,
        item.products.name,
        item.current_qty,
        item.par_level,
        item.reorder_point,
        item.sales_velocity.toFixed(1),
        item.days_of_supply === 999 ? '∞' : Math.round(item.days_of_supply),
        (item.current_qty * (item.products.cost || 0)).toFixed(2),
        getStockStatusText(getStockStatus(item))
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory-report.csv';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export successful",
      description: "Inventory report has been downloaded"
    });
  };

  const filteredInventory = inventory.filter(item => {
    const machineMatch = filterMachine === 'all' || item.machine_id === filterMachine;
    const statusMatch = filterStatus === 'all' || getStockStatus(item) === filterStatus;
    const searchMatch = !searchTerm || 
      item.products.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.machines.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.machine_slots.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.products.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return machineMatch && statusMatch && searchMatch;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
      <div className="flex items-center justify-between">
        <Header 
          title="Inventory Management" 
          subtitle="Monitor stock levels, track velocity, and manage inventory across all machines" 
        />
        <div className="flex gap-2">
          <Button onClick={recalculateVelocity} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Update Velocity
          </Button>
          <Button onClick={exportInventoryCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Detailed View</TabsTrigger>
          <TabsTrigger value="alerts">Stock Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Enhanced KPIs */}
          <InventoryKPIs />
          
          {/* Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InventoryStockDistribution />
            <TopPerformingMachines />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VelocityTrends />
            <CriticalItemsAlert />
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          {/* Filters and Search */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by product, machine, slot, or SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Machine:</label>
                  <Select value={filterMachine} onValueChange={setFilterMachine}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
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
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Status:</label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="out">Out of Stock</SelectItem>
                      <SelectItem value="low">Low Stock</SelectItem>
                      <SelectItem value="medium">Medium Stock</SelectItem>
                      <SelectItem value="good">Good Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Grid */}
          <div className="space-y-4">
            {filteredInventory.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No inventory found</h3>
                  <p className="text-muted-foreground">
                    {inventory.length === 0 
                      ? "No inventory data available. Inventory levels are created automatically when you restock machines."
                      : "No items match the current filters."
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredInventory.map((item) => {
                  const status = getStockStatus(item);
                  const fillPercentage = Math.min((item.current_qty / item.par_level) * 100, 100);
                  
                  return (
                    <Card key={item.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium">{item.products.name}</h3>
                              <Badge variant="secondary" className="text-xs">
                                {item.products.sku}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              <span>{item.machines.name}</span>
                              <span>•</span>
                              <span>Slot {item.machine_slots.label}</span>
                            </div>
                          </div>
                          <Badge className={getStockStatusColor(status)}>
                            {getStockStatusText(status)}
                          </Badge>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Current Stock</span>
                              <span className="font-medium">
                                {item.current_qty} / {item.par_level}
                              </span>
                            </div>
                            <Progress value={fillPercentage} className="h-2" />
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Reorder Point</p>
                              <p className="font-medium">{item.reorder_point}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Sales/Day</p>
                              <p className="font-medium">{item.sales_velocity.toFixed(1)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Days Supply</p>
                              <p className="font-medium">
                                {item.days_of_supply === 999 ? '∞' : Math.round(item.days_of_supply)}
                              </p>
                            </div>
                          </div>

                          {item.last_restocked_at && (
                            <div className="text-xs text-muted-foreground">
                              Last restocked: {new Date(item.last_restocked_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          {/* Critical Items Alert */}
          <CriticalItemsAlert />
          
          {/* Detailed Stock Alerts Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Detailed Stock Alerts ({filteredInventory.filter(i => getStockStatus(i) === 'low' || getStockStatus(i) === 'out').length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Alert Filters */}
              <div className="flex gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Machine:</label>
                  <Select value={filterMachine} onValueChange={setFilterMachine}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
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
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Alert Level:</label>
                  <Select value={filterStatus === 'all' ? 'alerts' : filterStatus} onValueChange={(value) => setFilterStatus(value === 'alerts' ? 'all' : value)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alerts">All Alerts</SelectItem>
                      <SelectItem value="out">Out of Stock</SelectItem>
                      <SelectItem value="low">Low Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Machine</TableHead>
                    <TableHead>Slot</TableHead>
                    <TableHead>Current</TableHead>
                    <TableHead>Reorder Point</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Days Supply</TableHead>
                    <TableHead>Velocity</TableHead>
                    <TableHead>Action Needed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory
                    .filter(item => getStockStatus(item) === 'low' || getStockStatus(item) === 'out')
                    .sort((a, b) => {
                      // Sort by urgency: out of stock first, then by days of supply
                      if (a.current_qty === 0 && b.current_qty > 0) return -1;
                      if (b.current_qty === 0 && a.current_qty > 0) return 1;
                      return a.days_of_supply - b.days_of_supply;
                    })
                    .map((item) => {
                      const status = getStockStatus(item);
                      const actionNeeded = item.current_qty === 0 ? 'Immediate Restock' : 
                                         item.days_of_supply < 3 ? 'Urgent Restock' : 'Schedule Restock';
                      
                      return (
                        <TableRow key={item.id} className={item.current_qty === 0 ? 'bg-red-50 dark:bg-red-950/20' : ''}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.products.name}</div>
                              <div className="text-xs text-muted-foreground">{item.products.sku}</div>
                            </div>
                          </TableCell>
                          <TableCell>{item.machines.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.machine_slots.label}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{item.current_qty}</TableCell>
                          <TableCell>{item.reorder_point}</TableCell>
                          <TableCell>{getStatusBadge(status)}</TableCell>
                          <TableCell>
                            <span className={item.days_of_supply < 3 ? 'text-red-600 font-medium' : 
                                           item.days_of_supply < 7 ? 'text-orange-600 font-medium' : ''}>
                              {item.days_of_supply === 999 ? '∞' : Math.round(item.days_of_supply)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {item.sales_velocity.toFixed(1)}/day
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.current_qty === 0 ? 'destructive' : 'secondary'} className="text-xs">
                              {actionNeeded}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
              {filteredInventory.filter(i => getStockStatus(i) === 'low' || getStockStatus(i) === 'out').length === 0 && (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No stock alerts</h3>
                  <p className="text-muted-foreground">All inventory levels are healthy!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
export default Inventory;