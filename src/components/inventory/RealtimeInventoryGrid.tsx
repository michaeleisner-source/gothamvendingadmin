import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Package, Search, RefreshCw, AlertTriangle, TrendingUp, Filter } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface InventoryItem {
  id: string;
  machine_id: string;
  product_id: string;
  current_qty: number;
  reorder_point: number;
  par_level: number;
  sales_velocity: number;
  days_of_supply: number;
  last_restocked_at: string | null;
  product_name?: string;
  product_category?: string;
  machine_name?: string;
  machine_status?: string;
}

export function RealtimeInventoryGrid() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'out' | 'healthy'>('all');

  useEffect(() => {
    fetchInventory();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('inventory-grid')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory_levels'
        },
        () => {
          // Refetch data when inventory changes
          fetchInventory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterInventory();
  }, [inventory, searchTerm, statusFilter]);

  const fetchInventory = async () => {
    try {
      const { data: basicData, error: basicError } = await supabase
        .from('inventory_levels')
        .select(`
          id,
          machine_id,
          product_id,
          current_qty,
          reorder_point,
          par_level,
          sales_velocity,
          days_of_supply,
          last_restocked_at
        `)
        .order('current_qty', { ascending: true });

      if (basicError) throw basicError;

      // Fetch related data
      const productIds = [...new Set(basicData?.map(item => item.product_id) || [])];
      const machineIds = [...new Set(basicData?.map(item => item.machine_id) || [])];

      const [productsData, machinesData] = await Promise.all([
        productIds.length > 0 
          ? supabase.from('products').select('id, name, category').in('id', productIds)
          : { data: [] },
        machineIds.length > 0 
          ? supabase.from('machines').select('id, name, status').in('id', machineIds)
          : { data: [] }
      ]);

      const products = productsData.data || [];
      const machines = machinesData.data || [];

      const enrichedData = basicData?.map(item => {
        const product = products.find(p => p.id === item.product_id);
        const machine = machines.find(m => m.id === item.machine_id);
        
        return {
          ...item,
          product_name: product?.name || 'Unknown Product',
          product_category: product?.category || '',
          machine_name: machine?.name || 'Unknown Machine',
          machine_status: machine?.status || 'UNKNOWN'
        };
      }) || [];

      setInventory(enrichedData);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast({
        title: "Error",
        description: "Failed to fetch inventory data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterInventory = () => {
    let filtered = inventory;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.machine_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product_category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => {
        const status = getInventoryStatus(item);
        return status === statusFilter;
      });
    }

    setFilteredInventory(filtered);
  };

  const getInventoryStatus = (item: InventoryItem): 'out' | 'low' | 'healthy' => {
    if (item.current_qty === 0) return 'out';
    if (item.current_qty <= item.reorder_point) return 'low';
    return 'healthy';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'out': return 'destructive';
      case 'low': return 'secondary';
      case 'healthy': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'out': return <AlertTriangle className="h-3 w-3" />;
      case 'low': return <TrendingUp className="h-3 w-3" />;
      case 'healthy': return <Package className="h-3 w-3" />;
      default: return <Package className="h-3 w-3" />;
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchInventory();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inventory Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory Overview
            <Badge variant="outline">{filteredInventory.length} items</Badge>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products, machines, or categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'out', 'low', 'healthy'].map(status => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status as any)}
                  className="capitalize"
                >
                  <Filter className="h-3 w-3 mr-1" />
                  {status === 'all' ? 'All' : status === 'out' ? 'Out of Stock' : status}
                </Button>
              ))}
            </div>
          </div>

          {/* Inventory Grid */}
          <div className="space-y-2">
            {filteredInventory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No inventory items found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              filteredInventory.map(item => {
                const status = getInventoryStatus(item);
                const fillPercentage = item.par_level > 0 
                  ? Math.round((item.current_qty / item.par_level) * 100)
                  : 0;

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(status)}
                        <Badge variant={getStatusColor(status)} className="text-xs">
                          {status.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">
                          {item.product_name || 'Unknown Product'}
                        </h4>
                        <p className="text-sm text-muted-foreground truncate">
                          {item.machine_name || 'Unknown Machine'}
                          {item.product_category && (
                            <span className="ml-2">• {item.product_category}</span>
                          )}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="font-medium">
                          {item.current_qty} / {item.par_level || item.reorder_point}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {fillPercentage}% filled
                        </div>
                      </div>

                      {item.sales_velocity > 0 && (
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {Math.round(item.days_of_supply || 0)}d
                          </div>
                          <div className="text-xs text-muted-foreground">
                            supply
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {status !== 'healthy' && (
                        <Button size="sm" variant="outline">
                          Restock
                        </Button>
                      )}
                      <Button size="sm" variant="ghost">
                        Details
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}