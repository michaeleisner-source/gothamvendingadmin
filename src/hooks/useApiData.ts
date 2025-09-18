import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useLeads = () => {
  return useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*');
      
      if (error) throw error;
      return data || [];
    },
  });
};

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await supabase
        .from('leads')
        .select('id, status');
      
      return {
        totalLeads: data?.length || 0,
        newLeads: data?.filter(l => l.status === 'new').length || 0,
        interestedLeads: data?.filter(l => l.status === 'interested').length || 0,
        closedLeads: data?.filter(l => l.status === 'closed').length || 0,
      };
    },
  });
};