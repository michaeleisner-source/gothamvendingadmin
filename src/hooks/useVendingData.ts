// Simplified stub for vending data to prevent build errors
import { useQuery } from "@tanstack/react-query";

export const useVendingData = () => {
  return useQuery({
    queryKey: ['vending-data'],
    queryFn: async () => {
      return {
        machines: [],
        locations: [],
        sales: [],
        inventory: [],
        restockNeeds: [],
        lowStockItems: []
      };
    },
  });
};

export const useMachineData = () => {
  return useQuery({
    queryKey: ['machine-data'],
    queryFn: async () => {
      return {
        machines: [],
        totalMachines: 0,
        activeMachines: 0,
        maintenanceMachines: 0
      };
    },
  });
};