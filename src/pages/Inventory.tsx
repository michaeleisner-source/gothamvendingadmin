import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign,
  Search,
  Download
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type InventoryItem = {
  machine_id: string;
  machine_name: string;
  slot_label: string;
  product_id: string;
  product_name: string;
  product_cost: number;
  product_price: number;
  current_qty: number;
  max_qty: number;
  restock_threshold: number;
  stock_value: number;
  potential_revenue: number;
  margin_per_unit: number;
  status: 'ok' | 'low' | 'empty' | 'no_data';
};

type StockSummary = {
  total_products: number;
  total_stock_value: number;
  total_potential_revenue: number;
  low_stock_items: number;
  empty_slots: number;
  well_stocked: number;
};

const fetchInventoryData = async (search?: string): Promise<{
  inventory: InventoryItem[];
  summary: StockSummary;
}> => {
  try {
    // Get all slot assignments with machine and product data
    const { data: slotsData, error: slotsError } = await supabase
      .from('slot_assignments')
      .select(`
        slot_id,
        product_id,
        max_qty,
        restock_threshold,
        machine_slots!inner(
          machine_id,
          label,
          machines!inner(
            name
          )
        ),
        products!inner(
          name,
          sku,
          cost,
          price
        )
      `);

    if (slotsError) throw slotsError;

    // Get latest restock data for current quantities
    const { data: restockData } = await supabase
      .from('restock_lines')
      .select(`
        slot_id,
        new_qty,
        restock_sessions!inner(
          completed_at
        )
      `)
      .order('restock_sessions(completed_at)', { ascending: false });

    // Create a map of slot_id to latest quantity
    const latestQtyMap = new Map<string, number>();
    (restockData || []).forEach((line: any) => {
      if (!latestQtyMap.has(line.slot_id)) {
        latestQtyMap.set(line.slot_id, line.new_qty || 0);
      }
    });

    // Build inventory items
    const inventoryItems: InventoryItem[] = (slotsData || []).map((slot: any) => {
      const currentQty = latestQtyMap.get(slot.slot_id) || 0;
      const cost = slot.products.cost || 0;
      const price = slot.products.price || 0;
      const marginPerUnit = price - cost;
      const stockValue = currentQty * cost;
      const potentialRevenue = currentQty * price;
      const maxQty = slot.max_qty || 0;
      const threshold = slot.restock_threshold || 0;

      let status: 'ok' | 'low' | 'empty' | 'no_data' = 'no_data';
      if (currentQty === 0) {
        status = 'empty';
      } else if (threshold > 0 && currentQty <= threshold) {
        status = 'low';
      } else if (currentQty > 0) {
        status = 'ok';
      }

      return {
        machine_id: slot.machine_slots.machine_id,
        machine_name: slot.machine_slots.machines.name,
        slot_label: slot.machine_slots.label,
        product_id: slot.product_id,
        product_name: slot.products.name,
        product_cost: cost,
        product_price: price,
        current_qty: currentQty,
        max_qty: maxQty,
        restock_threshold: threshold,
        stock_value: stockValue,
        potential_revenue: potentialRevenue,
        margin_per_unit: marginPerUnit,
        status,
      };
    });

    // Filter by search if provided
    let filteredInventory = inventoryItems;
    if (search) {
      filteredInventory = inventoryItems.filter(item =>
        item.product_name.toLowerCase().includes(search.toLowerCase()) ||
        item.machine_name.toLowerCase().includes(search.toLowerCase()) ||
        item.slot_label.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Calculate summary
    const summary: StockSummary = {
      total_products: filteredInventory.length,
      total_stock_value: filteredInventory.reduce((sum, item) => sum + item.stock_value, 0),
      total_potential_revenue: filteredInventory.reduce((sum, item) => sum + item.potential_revenue, 0),
      low_stock_items: filteredInventory.filter(item => item.status === 'low').length,
      empty_slots: filteredInventory.filter(item => item.status === 'empty').length,
      well_stocked: filteredInventory.filter(item => item.status === 'ok').length,
    };

    return { inventory: filteredInventory, summary };
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return {
      inventory: [],
      summary: {
        total_products: 0,
        total_stock_value: 0,
        total_potential_revenue: 0,
        low_stock_items: 0,
        empty_slots: 0,
        well_stocked: 0,
      },
    };
  }
};

const fetchLowStockItems = async (): Promise<any[]> => {
  const { data, error } = await supabase.rpc('report_low_stock');
  
  if (error && !error.message.includes('function')) {
    throw error;
  }

  return data || [];
};

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const {
    data: inventoryData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["inventory", searchTerm],
    queryFn: () => fetchInventoryData(searchTerm),
  });

  const {
    data: lowStockItems = [],
    isLoading: lowStockLoading,
  } = useQuery({
    queryKey: ["low-stock"],
    queryFn: fetchLowStockItems,
  });

  const exportInventoryCSV = () => {
    if (!inventoryData?.inventory.length) {
      toast.error("No inventory data to export");
      return;
    }

    const headers = [
      'Machine', 'Slot', 'Product', 'Current Qty', 'Max Qty', 
      'Threshold', 'Unit Cost', 'Unit Price', 'Margin', 'Stock Value', 'Status'
    ];
    
    const csvContent = [
      headers.join(','),
      ...inventoryData.inventory.map(item => [
        item.machine_name,
        item.slot_label,
        item.product_name,
        item.current_qty,
        item.max_qty,
        item.restock_threshold,
        item.product_cost?.toFixed(2) || '0.00',
        item.product_price?.toFixed(2) || '0.00',
        item.margin_per_unit?.toFixed(2) || '0.00',
        item.stock_value?.toFixed(2) || '0.00',
        item.status
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ok':
        return <Badge variant="default" className="bg-green-500">Well Stocked</Badge>;
      case 'low':
        return <Badge variant="destructive">Low Stock</Badge>;
      case 'empty':
        return <Badge variant="destructive">Empty</Badge>;
      default:
        return <Badge variant="outline">No Data</Badge>;
    }
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Inventory Management</h1>
        <p className="text-muted-foreground">
          Inventory tracking is not set up yet. Please configure machines and product slots first.
        </p>
      </div>
    );
  }

  const { inventory = [], summary } = inventoryData || {};

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <Button onClick={exportInventoryCSV} variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Detailed View</TabsTrigger>
          <TabsTrigger value="alerts">Stock Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary?.total_products || 0}</div>
                <p className="text-xs text-muted-foreground">Across all machines</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(summary?.total_stock_value || 0).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">Current inventory value</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Potential Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(summary?.total_potential_revenue || 0).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">If all items sold</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Stock Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {(summary?.low_stock_items || 0) + (summary?.empty_slots || 0)}
                </div>
                <p className="text-xs text-muted-foreground">Items need attention</p>
              </CardContent>
            </Card>
          </div>

          {/* Stock Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Stock Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {summary?.well_stocked || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Well Stocked</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {summary?.low_stock_items || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Low Stock</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {summary?.empty_slots || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Empty Slots</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by product, machine, or slot..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardContent>
          </Card>

          {/* Detailed Inventory Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Inventory ({inventory.length} items)</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : inventory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No inventory data available.</p>
                  <p className="text-sm mt-2">Set up machines and product assignments to track inventory.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Machine</TableHead>
                        <TableHead>Slot</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Current</TableHead>
                        <TableHead className="text-right">Max</TableHead>
                        <TableHead className="text-right">Cost</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Margin</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventory.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.machine_name}</TableCell>
                          <TableCell>{item.slot_label}</TableCell>
                          <TableCell>{item.product_name}</TableCell>
                          <TableCell className="text-right">{item.current_qty}</TableCell>
                          <TableCell className="text-right">{item.max_qty}</TableCell>
                          <TableCell className="text-right">
                            ${item.product_cost?.toFixed(2) || '0.00'}
                          </TableCell>
                          <TableCell className="text-right">
                            ${item.product_price?.toFixed(2) || '0.00'}
                          </TableCell>
                          <TableCell className="text-right">
                            ${item.margin_per_unit?.toFixed(2) || '0.00'}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${item.stock_value?.toFixed(2) || '0.00'}
                          </TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : lowStockItems.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-green-600 mb-2">
                    <Package className="w-12 h-12 mx-auto" />
                  </div>
                  <p className="text-lg font-medium">All Good!</p>
                  <p className="text-muted-foreground">No low stock alerts at this time.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Machine</TableHead>
                        <TableHead>Slot</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Current Qty</TableHead>
                        <TableHead className="text-right">Threshold</TableHead>
                        <TableHead>Action Needed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lowStockItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.machine_name}</TableCell>
                          <TableCell>{item.slot_label}</TableCell>
                          <TableCell>{item.product_name}</TableCell>
                          <TableCell className="text-right">
                            <span className="text-destructive font-medium">
                              {item.current_qty}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">{item.restock_threshold}</TableCell>
                          <TableCell>
                            <Badge variant="destructive">Restock Required</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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