import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Centralized data management hook for efficiency
export function useVendingData() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Real-time dashboard metrics
  const useDashboardMetrics = () => {
    return useQuery({
      queryKey: ['dashboard-metrics'],
      queryFn: async () => {
        const { data, error } = await supabase.rpc('dashboard_metrics');
        if (error) throw error;
        return data;
      },
      refetchInterval: 30000, // Auto-refresh every 30 seconds
      staleTime: 15000, // Consider data stale after 15 seconds
    });
  };

  // Machine health with real-time updates
  const useMachineHealth = () => {
    return useQuery({
      queryKey: ['machine-health'],
      queryFn: async () => {
        const { data, error } = await supabase.rpc('get_machine_health_data');
        if (error) throw error;
        return data;
      },
      refetchInterval: 60000, // Check every minute
    });
  };

  // Inventory with alerts
  const useInventoryWithAlerts = () => {
    return useQuery({
      queryKey: ['inventory-alerts'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('inventory_levels')
          .select(`
            *,
            machines!inner(name, status),
            products!inner(name, sku, cost, price),
            machine_slots!inner(label)
          `)
          .lte('current_qty', 'reorder_point');
        
        if (error) throw error;
        
        // Calculate risk scores
        return data.map(item => ({
          ...item,
          risk_score: calculateRiskScore(item),
          urgency: item.current_qty === 0 ? 'critical' : item.current_qty <= item.reorder_point * 0.5 ? 'high' : 'medium'
        }));
      },
      refetchInterval: 300000, // 5 minutes
    });
  };

  // Smart restock suggestions
  const useRestockSuggestions = () => {
    return useQuery({
      queryKey: ['restock-suggestions'],
      queryFn: async () => {
        // Get machines with low inventory + sales velocity
        const { data: lowStock } = await supabase
          .from('inventory_levels')
          .select(`
            *,
            machines!inner(name, location_id, status),
            products!inner(name, sku, cost, price),
            machine_slots!inner(label)
          `)
          .lte('current_qty', 'reorder_point')
          .eq('machines.status', 'ONLINE');

        if (!lowStock) return [];

        // Calculate route optimization
        const suggestions = lowStock.reduce((acc: any[], item) => {
          const existing = acc.find(s => s.machine_id === item.machine_id);
          if (existing) {
            existing.items.push(item);
            existing.total_value += (item.par_level - item.current_qty) * item.products.cost;
          } else {
            acc.push({
              machine_id: item.machine_id,
              machine_name: item.machines.name,
              location_id: item.machines.location_id,
              items: [item],
              total_value: (item.par_level - item.current_qty) * item.products.cost,
              urgency: item.current_qty === 0 ? 'critical' : 'high'
            });
          }
          return acc;
        }, []);

        // Sort by urgency and value
        return suggestions.sort((a, b) => {
          if (a.urgency === 'critical' && b.urgency !== 'critical') return -1;
          if (b.urgency === 'critical' && a.urgency !== 'critical') return 1;
          return b.total_value - a.total_value;
        });
      },
      refetchInterval: 600000, // 10 minutes
    });
  };

  // Automated restock execution
  const useAutoRestock = () => {
    return useMutation({
      mutationFn: async ({ machine_id, items }: { machine_id: string; items: any[] }) => {
        // Start restock session
        const { data: session, error: sessionError } = await supabase
          .rpc('start_restock_session', { 
            p_machine_id: machine_id, 
            p_note: 'Auto-generated restock' 
          });
        
        if (sessionError) throw sessionError;

        // Build restock lines
        const lines = items.map(item => ({
          slot_label: item.machine_slots.label,
          prev_qty: item.current_qty,
          added_qty: item.par_level - item.current_qty,
          new_qty: item.par_level
        }));

        // Save restock
        const { error: saveError } = await supabase
          .rpc('save_restock_session', {
            p_session_id: session,
            p_complete: true,
            p_lines: lines
          });

        if (saveError) throw saveError;
        return session;
      },
      onSuccess: () => {
        toast({ title: "Auto-restock completed successfully" });
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['inventory-alerts'] });
        queryClient.invalidateQueries({ queryKey: ['restock-suggestions'] });
      },
      onError: (error: Error) => {
        toast({ 
          title: "Auto-restock failed", 
          description: error.message,
          variant: "destructive"
        });
      }
    });
  };

  return {
    useDashboardMetrics,
    useMachineHealth,
    useInventoryWithAlerts,
    useRestockSuggestions,
    useAutoRestock
  };
}

// Risk calculation utility
function calculateRiskScore(item: any): number {
  let score = 0;
  
  // Stock level risk (0-40 points)
  const stockRatio = item.current_qty / item.par_level;
  if (stockRatio <= 0) score += 40;
  else if (stockRatio <= 0.2) score += 35;
  else if (stockRatio <= 0.5) score += 25;
  else if (stockRatio <= 0.8) score += 15;
  
  // Sales velocity risk (0-30 points)
  if (item.sales_velocity > 5) score += 30;
  else if (item.sales_velocity > 3) score += 20;
  else if (item.sales_velocity > 1) score += 10;
  
  // Days of supply risk (0-30 points)
  if (item.days_of_supply < 1) score += 30;
  else if (item.days_of_supply < 3) score += 20;
  else if (item.days_of_supply < 7) score += 10;
  
  return Math.min(score, 100);
}

export { calculateRiskScore };