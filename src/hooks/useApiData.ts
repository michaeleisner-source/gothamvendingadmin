import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Lead = Database['public']['Tables']['leads']['Row'];
type Machine = Database['public']['Tables']['machines']['Row'];
type Location = Database['public']['Tables']['locations']['Row'];
type Sale = Database['public']['Tables']['sales']['Row'];
type Inventory = Database['public']['Tables']['inventory']['Row'];

// LEADS DATA HOOKS
export const useLeads = () => {
  return useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Lead[];
    },
  });
};

export const useCreateLead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (lead: Database['public']['Tables']['leads']['Insert']) => {
      const { data, error } = await supabase
        .from('leads')
        .insert(lead)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead created successfully!');
    },
    onError: (error) => {
      toast.error('Failed to create lead: ' + error.message);
    },
  });
};

export const useUpdateLead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Database['public']['Tables']['leads']['Update'] }) => {
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead updated successfully!');
    },
    onError: (error) => {
      toast.error('Failed to update lead: ' + error.message);
    },
  });
};

// MACHINES DATA HOOKS
export const useMachines = () => {
  return useQuery({
    queryKey: ['machines'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('machines')
        .select(`
          *,
          locations (
            name,
            address,
            city,
            state,
            location_type
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateMachine = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (machine: Database['public']['Tables']['machines']['Insert']) => {
      const { data, error } = await supabase
        .from('machines')
        .insert(machine)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      toast.success('Machine created successfully!');
    },
    onError: (error) => {
      toast.error('Failed to create machine: ' + error.message);
    },
  });
};

// LOCATIONS DATA HOOKS
export const useLocations = () => {
  return useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateLocation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (location: Database['public']['Tables']['locations']['Insert']) => {
      const { data, error } = await supabase
        .from('locations')
        .insert(location)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success('Location created successfully!');
    },
    onError: (error) => {
      toast.error('Failed to create location: ' + error.message);
    },
  });
};

// SALES DATA HOOKS
export const useSales = () => {
  return useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          machines (
            id,
            serial_number,
            machine_model,
            locations (
              name,
              city,
              state
            )
          )
        `)
        .order('sale_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateSale = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sale: Database['public']['Tables']['sales']['Insert']) => {
      const { data, error } = await supabase
        .from('sales')
        .insert(sale)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Sale recorded successfully!');
    },
    onError: (error) => {
      toast.error('Failed to record sale: ' + error.message);
    },
  });
};

// INVENTORY DATA HOOKS
export const useInventory = () => {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          machines (
            id,
            serial_number,
            machine_model,
            locations (
              name,
              city,
              state
            )
          )
        `)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
};

export const useUpdateInventory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Database['public']['Tables']['inventory']['Update'] }) => {
      const { data, error } = await supabase
        .from('inventory')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Inventory updated successfully!');
    },
    onError: (error) => {
      toast.error('Failed to update inventory: ' + error.message);
    },
  });
};

// DASHBOARD ANALYTICS HOOKS
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Get basic counts
      const [leadsResult, machinesResult, locationsResult, salesResult] = await Promise.all([
        supabase.from('leads').select('id, status'),
        supabase.from('machines').select('id, status'),
        supabase.from('locations').select('id, status'),
        supabase.from('sales').select('total_amount, sale_date')
      ]);

      if (leadsResult.error) throw leadsResult.error;
      if (machinesResult.error) throw machinesResult.error;
      if (locationsResult.error) throw locationsResult.error;
      if (salesResult.error) throw salesResult.error;

      const leads = leadsResult.data;
      const machines = machinesResult.data;
      const locations = locationsResult.data;
      const sales = salesResult.data;

      // Calculate analytics
      const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
      const activeMachines = machines.filter(m => m.status === 'active').length;
      const newLeads = leads.filter(l => l.status === 'new').length;
      const activeLocations = locations.filter(l => l.status === 'active').length;

      // Calculate monthly revenue
      const now = new Date();
      const thisMonth = sales.filter(sale => {
        const saleDate = new Date(sale.sale_date);
        return saleDate.getMonth() === now.getMonth() && 
               saleDate.getFullYear() === now.getFullYear();
      });
      const monthlyRevenue = thisMonth.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);

      return {
        totalRevenue,
        monthlyRevenue,
        activeMachines,
        totalMachines: machines.length,
        newLeads,
        totalLeads: leads.length,
        activeLocations,
        totalLocations: locations.length,
        salesCount: sales.length
      };
    },
  });
};