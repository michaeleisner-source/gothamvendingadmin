import { useOptimizedQuery } from "./useOptimizedQuery";
import { supabase } from "@/integrations/supabase/client";

export interface CommissionDataResult {
  sales: {
    machine_id: string;
    quantity_sold: number;
    unit_price: number;
    total_amount: number;
    sale_date: string;
  }[];
  machines: {
    id: string;
    machine_model: string;
    serial_number: string;
    location_id: string;
  }[];
  locations: {
    id: string;
    name: string;
    revenue_split: number;
  }[];
}

export function useCommissionData(startDate: string, endDate: string) {
  return useOptimizedQuery<CommissionDataResult>({
    queryKey: ["commission-data", startDate, endDate],
    queryFn: async () => {
      // Fetch sales data (within date range)
      const { data: sales } = await supabase
        .from('sales')
        .select('machine_id, quantity_sold, unit_price, total_amount, sale_date')
        .gte('sale_date', startDate)
        .lte('sale_date', endDate);

      // Fetch machines data
      const { data: machines } = await supabase
        .from('machines')
        .select('id, machine_model, serial_number, location_id');

      // Fetch locations data
      const { data: locations } = await supabase
        .from('locations')
        .select('id, name, revenue_split');

      return {
        sales: sales || [],
        machines: machines || [],
        locations: locations || []
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for financial data
    errorMessage: "Failed to load commission data"
  });
}