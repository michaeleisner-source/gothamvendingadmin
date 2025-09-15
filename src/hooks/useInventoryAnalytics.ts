import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface InventoryAnalytics {
  totalItems: number;
  totalValue: number;
  totalRevenuePotential: number;
  lowStockCount: number;
  outOfStockCount: number;
  avgDaysOfSupply: number;
  fastMovingItems: number;
  slowMovingItems: number;
  inventoryTurnover: number;
  restockFrequency: number;
  topPerformingMachines: Array<{
    machine_name: string;
    total_items: number;
    stock_health: number;
    needs_attention: boolean;
  }>;
  stockDistribution: {
    good: number;
    medium: number;
    low: number;
    out: number;
  };
  velocityTrends: Array<{
    product_name: string;
    sku: string;
    velocity: number;
    trend: 'up' | 'down' | 'stable';
    days_supply: number;
  }>;
  criticalItems: Array<{
    product_name: string;
    machine_name: string;
    current_qty: number;
    reorder_point: number;
    urgency: 'critical' | 'high' | 'medium';
  }>;
  recentActivity: Array<{
    type: 'restock' | 'sale' | 'alert';
    product_name: string;
    machine_name: string;
    quantity: number;
    timestamp: string;
  }>;
}

export const useInventoryAnalytics = () => {
  return useQuery({
    queryKey: ['inventory-analytics'],
    queryFn: async (): Promise<InventoryAnalytics> => {
      // Fetch inventory levels with related data
      const { data: inventoryLevels, error: invError } = await supabase
        .from('inventory_levels')
        .select(`
          *,
          machines!inventory_levels_machine_id_fkey(name),
          machine_slots!inventory_levels_slot_id_fkey(label),
          products!inventory_levels_product_id_fkey(name, sku, cost, price)
        `);

      if (invError) throw invError;

      const inventory = inventoryLevels || [];
      
      // Calculate basic metrics
      const totalItems = inventory.length;
      const totalValue = inventory.reduce((sum, item) => 
        sum + (item.current_qty * (item.products.cost || 0)), 0);
      const totalRevenuePotential = inventory.reduce((sum, item) => 
        sum + (item.current_qty * (item.products.price || 0)), 0);
      
      const lowStockCount = inventory.filter(item => 
        item.current_qty <= item.reorder_point && item.current_qty > 0).length;
      const outOfStockCount = inventory.filter(item => item.current_qty === 0).length;
      
      const avgDaysOfSupply = inventory.reduce((sum, item) => 
        sum + (item.days_of_supply || 0), 0) / totalItems || 0;
      
      // Fast/slow moving items based on velocity
      const fastMovingItems = inventory.filter(item => item.sales_velocity > 1).length;
      const slowMovingItems = inventory.filter(item => 
        item.sales_velocity > 0 && item.sales_velocity < 0.5).length;
      
      // Inventory turnover (simplified calculation)
      const inventoryTurnover = avgDaysOfSupply > 0 ? 365 / avgDaysOfSupply : 0;
      
      // Stock distribution
      const getStockStatus = (item: any) => {
        if (item.current_qty === 0) return 'out';
        if (item.current_qty <= item.reorder_point) return 'low';
        if (item.current_qty >= item.par_level * 0.8) return 'good';
        return 'medium';
      };

      const stockDistribution = {
        good: inventory.filter(i => getStockStatus(i) === 'good').length,
        medium: inventory.filter(i => getStockStatus(i) === 'medium').length,
        low: inventory.filter(i => getStockStatus(i) === 'low').length,
        out: inventory.filter(i => getStockStatus(i) === 'out').length,
      };

      // Top performing machines by stock health
      const machineStats = inventory.reduce((acc, item) => {
        const machineId = item.machine_id;
        if (!acc[machineId]) {
          acc[machineId] = {
            machine_name: item.machines.name,
            total_items: 0,
            healthy_items: 0,
          };
        }
        acc[machineId].total_items++;
        if (getStockStatus(item) === 'good') {
          acc[machineId].healthy_items++;
        }
        return acc;
      }, {} as Record<string, any>);

      const topPerformingMachines = Object.values(machineStats).map((machine: any) => ({
        machine_name: machine.machine_name,
        total_items: machine.total_items,
        stock_health: Math.round((machine.healthy_items / machine.total_items) * 100),
        needs_attention: (machine.healthy_items / machine.total_items) < 0.7,
      })).sort((a, b) => b.stock_health - a.stock_health);

      // Velocity trends (simplified - would need historical data for real trends)
      const velocityTrends = inventory
        .filter(item => item.sales_velocity > 0)
        .sort((a, b) => b.sales_velocity - a.sales_velocity)
        .slice(0, 10)
        .map(item => ({
          product_name: item.products.name,
          sku: item.products.sku,
          velocity: item.sales_velocity,
          trend: 'stable' as const,
          days_supply: item.days_of_supply || 999,
        }));

      // Critical items needing attention
      const criticalItems = inventory
        .filter(item => item.current_qty <= item.reorder_point)
        .sort((a, b) => a.current_qty - b.current_qty)
        .slice(0, 15)
        .map(item => {
          let urgency: 'critical' | 'high' | 'medium';
          if (item.current_qty === 0) {
            urgency = 'critical';
          } else if (item.current_qty <= item.reorder_point * 0.5) {
            urgency = 'high';
          } else {
            urgency = 'medium';
          }
          
          return {
            product_name: item.products.name,
            machine_name: item.machines.name,
            current_qty: item.current_qty,
            reorder_point: item.reorder_point,
            urgency,
          };
        });

      // Recent restock activity (would need restock_sessions data)
      const recentActivity: any[] = [];

      return {
        totalItems,
        totalValue,
        totalRevenuePotential,
        lowStockCount,
        outOfStockCount,
        avgDaysOfSupply: Math.round(avgDaysOfSupply * 10) / 10,
        fastMovingItems,
        slowMovingItems,
        inventoryTurnover: Math.round(inventoryTurnover * 10) / 10,
        restockFrequency: 0,
        topPerformingMachines: topPerformingMachines.slice(0, 5),
        stockDistribution,
        velocityTrends,
        criticalItems,
        recentActivity,
      };
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
};