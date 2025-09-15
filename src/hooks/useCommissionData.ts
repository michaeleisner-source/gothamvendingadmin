import { useOptimizedQuery } from "./useOptimizedQuery";
import { supabase } from "@/integrations/supabase/client";

interface CommissionDataResult {
  sales: Array<{
    machine_id: string;
    qty: number;
    unit_price_cents: number;
    occurred_at: string;
  }>;
  machines: Array<{
    id: string;
    name: string;
    location_id: string;
  }>;
  locations: Array<{
    id: string;
    name: string;
    commission_model: string;
    commission_pct_bps: number;
    commission_flat_cents: number;
    commission_min_cents: number;
  }>;
}

export function useCommissionData(startDate: string, endDate: string) {
  return useOptimizedQuery<CommissionDataResult>({
    queryKey: ["commission-data", startDate, endDate],
    queryFn: async () => {
      // Fetch all data in parallel for better performance
      const [salesResult, machinesResult, locationsResult] = await Promise.all([
        supabase
          .from("sales")
          .select("machine_id, qty, unit_price_cents, occurred_at")
          .gte("occurred_at", startDate)
          .lte("occurred_at", endDate)
          .limit(50000), // Reasonable limit with potential for pagination
        
        supabase
          .from("machines")
          .select("id, name, location_id")
          .limit(10000),
        
        supabase
          .from("locations")
          .select(`
            id, 
            name, 
            commission_model, 
            commission_pct_bps, 
            commission_flat_cents, 
            commission_min_cents
          `)
          .limit(5000)
      ]);

      // Check for errors
      if (salesResult.error) throw salesResult.error;
      if (machinesResult.error) throw machinesResult.error;
      if (locationsResult.error) throw locationsResult.error;

      return {
        sales: salesResult.data || [],
        machines: machinesResult.data || [],
        locations: locationsResult.data || []
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for financial data
    errorMessage: "Failed to load commission data"
  });
}