import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useInventoryAnalytics = () => {
  return useQuery({
    queryKey: ['inventory-analytics'],
    queryFn: async () => {
      try {
        // Get inventory levels with product and machine data
        const { data: inventoryLevels } = await supabase
          .from('inventory_levels')
          .select(`
            *,
            products (id, name, cost_cents, category),
            machines (id, name, status)
          `);

        if (!inventoryLevels) return getEmptyAnalytics();

        // Get sales data for velocity calculations (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { data: recentSales } = await supabase
          .from('sales')
          .select('product_id, qty, occurred_at, total_amount')
          .gte('occurred_at', thirtyDaysAgo.toISOString());

        // Calculate analytics
        const analytics = calculateInventoryAnalytics(inventoryLevels, recentSales || []);
        return analytics;
        
      } catch (error) {
        console.error('Error fetching inventory analytics:', error);
        return getEmptyAnalytics();
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

const calculateInventoryAnalytics = (inventoryLevels: any[], salesData: any[]) => {
  let totalValue = 0;
  let totalRevenuePotential = 0;
  let healthyCount = 0;
  let lowCount = 0;
  let outCount = 0;
  let criticalCount = 0;
  let totalDaysSupply = 0;
  let itemsWithSupplyData = 0;

  const productVelocity = new Map();
  const machinePerformance = new Map();
  const criticalItems = [];
  const restockNeeds = [];

  // Calculate product velocities from sales
  salesData.forEach(sale => {
    const key = sale.product_id;
    if (!productVelocity.has(key)) {
      productVelocity.set(key, { totalSold: 0, totalRevenue: 0 });
    }
    const velocity = productVelocity.get(key);
    velocity.totalSold += sale.qty;
    velocity.totalRevenue += sale.total_amount || 0;
  });

  // Process inventory levels
  inventoryLevels.forEach(item => {
    const costCents = item.products?.cost_cents || 0;
    const currentQty = item.current_qty || 0;
    const reorderPoint = item.reorder_point || 3;
    const velocity = productVelocity.get(item.product_id);
    
    totalValue += (costCents * currentQty) / 100;
    totalRevenuePotential += (costCents * currentQty * 1.5) / 100; // Assume 50% markup

    // Stock status classification
    if (currentQty === 0) {
      outCount++;
      criticalItems.push({
        id: item.id,
        productName: item.products?.name || 'Unknown',
        machineName: item.machines?.name || 'Unknown',
        currentQty: 0,
        reorderPoint,
        status: 'out_of_stock',
        urgency: 'immediate'
      });
    } else if (currentQty <= reorderPoint / 2) {
      criticalCount++;
      criticalItems.push({
        id: item.id,
        productName: item.products?.name || 'Unknown',
        machineName: item.machines?.name || 'Unknown',
        currentQty,
        reorderPoint,
        status: 'critical',
        urgency: 'urgent'
      });
    } else if (currentQty <= reorderPoint) {
      lowCount++;
      restockNeeds.push({
        id: item.id,
        productName: item.products?.name || 'Unknown',
        machineName: item.machines?.name || 'Unknown',
        currentQty,
        reorderPoint,
        status: 'low_stock'
      });
    } else {
      healthyCount++;
    }

    // Calculate days of supply
    if (velocity && velocity.totalSold > 0) {
      const dailyVelocity = velocity.totalSold / 30;
      const daysSupply = currentQty / dailyVelocity;
      totalDaysSupply += daysSupply;
      itemsWithSupplyData++;
    }

    // Track machine performance
    const machineId = item.machine_id;
    if (!machinePerformance.has(machineId)) {
      machinePerformance.set(machineId, {
        id: machineId,
        name: item.machines?.name || 'Unknown',
        totalItems: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        fillRate: 0
      });
    }
    const machine = machinePerformance.get(machineId);
    machine.totalItems++;
    if (currentQty === 0) machine.outOfStockItems++;
    else if (currentQty <= reorderPoint) machine.lowStockItems++;
  });

  // Calculate machine fill rates
  machinePerformance.forEach(machine => {
    machine.fillRate = ((machine.totalItems - machine.outOfStockItems) / machine.totalItems) * 100;
  });

  const topPerformingMachines = Array.from(machinePerformance.values())
    .sort((a, b) => b.fillRate - a.fillRate)
    .slice(0, 5);

  // Calculate inventory turnover and velocity metrics
  const totalInventoryValue = totalValue;
  const totalSalesValue = Array.from(productVelocity.values())
    .reduce((sum, v) => sum + v.totalRevenue, 0) / 100;
  
  const inventoryTurnover = totalInventoryValue > 0 ? 
    (totalSalesValue * 12) / totalInventoryValue : 0; // Annualized

  const fastMovingThreshold = 10; // Products sold more than 10 times in 30 days
  const fastMovingItems = Array.from(productVelocity.values())
    .filter(v => v.totalSold >= fastMovingThreshold).length;
  
  const slowMovingItems = inventoryLevels.length - fastMovingItems;

  return {
    stockoutCount: outCount,
    lowStockCount: lowCount,
    healthyStockCount: healthyCount,
    totalValue: Math.round(totalValue),
    totalItems: inventoryLevels.length,
    totalRevenuePotential: Math.round(totalRevenuePotential),
    stockDistribution: { 
      healthy: healthyCount, 
      low: lowCount, 
      out: outCount, 
      critical: criticalCount,
      good: healthyCount,
      medium: lowCount
    },
    outOfStockCount: outCount,
    avgDaysOfSupply: itemsWithSupplyData > 0 ? 
      Math.round(totalDaysSupply / itemsWithSupplyData) : 0,
    inventoryTurnover: Math.round(inventoryTurnover * 10) / 10,
    fastMovingItems,
    slowMovingItems,
    velocityTrends: [], // Can be enhanced with historical data
    criticalItems: criticalItems.slice(0, 10),
    topPerformingMachines,
    restockNeeds: restockNeeds.slice(0, 20),
    inventoryTrends: [] // Can be enhanced with historical data
  };
};

const getEmptyAnalytics = () => ({
  stockoutCount: 0,
  lowStockCount: 0,
  healthyStockCount: 0,
  totalValue: 0,
  totalItems: 0,
  totalRevenuePotential: 0,
  stockDistribution: { healthy: 0, low: 0, out: 0, critical: 0, good: 0, medium: 0 },
  outOfStockCount: 0,
  avgDaysOfSupply: 0,
  inventoryTurnover: 0,
  fastMovingItems: 0,
  slowMovingItems: 0,
  velocityTrends: [],
  criticalItems: [],
  topPerformingMachines: [],
  restockNeeds: [],
  inventoryTrends: []
});

export const useInventoryMetrics = () => {
  return useQuery({
    queryKey: ['inventory-metrics'],
    queryFn: async () => {
      return {
        totalProducts: 0,
        totalValue: 0,
        lowStockAlerts: 0,
        averageTurnover: 0
      };
    },
  });
};