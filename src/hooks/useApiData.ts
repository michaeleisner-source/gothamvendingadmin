import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Lead = Database['public']['Tables']['leads']['Row'];

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

// DASHBOARD ANALYTICS HOOKS
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data: leads, error } = await supabase
        .from('leads')
        .select('id, status, created_at, revenue_split');

      if (error) throw error;

      const totalLeads = leads.length;
      const newLeads = leads.filter(l => l.status === 'new').length;
      const interestedLeads = leads.filter(l => l.status === 'interested').length;
      const closedLeads = leads.filter(l => l.status === 'closed').length;
      
      // Calculate potential revenue from interested and closed leads
      const potentialRevenue = leads
        .filter(l => ['interested', 'negotiating', 'closed'].includes(l.status))
        .reduce((sum, lead) => sum + (lead.revenue_split || 0), 0);

      // Get leads from this month
      const now = new Date();
      const thisMonth = leads.filter(lead => {
        const leadDate = new Date(lead.created_at);
        return leadDate.getMonth() === now.getMonth() && 
               leadDate.getFullYear() === now.getFullYear();
      });

      return {
        totalLeads,
        newLeads,
        interestedLeads,
        closedLeads,
        potentialRevenue,
        leadsThisMonth: thisMonth.length,
        conversionRate: totalLeads > 0 ? (closedLeads / totalLeads * 100).toFixed(1) : '0'
      };
    },
  });
};