// Simplified stub for inventory analytics to prevent build errors
import { useQuery } from "@tanstack/react-query";

export const useInventoryAnalytics = () => {
  return useQuery({
    queryKey: ['inventory-analytics'],
    queryFn: async () => {
      // Return complete analytics structure for simplified schema
      return {
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
      };
    },
  });
};

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