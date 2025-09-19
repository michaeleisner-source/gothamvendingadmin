import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Contract {
  id: string;
  title: string;
  contract_number: string;
  status: string;
  location_id: string;
  revenue_share_pct: number | null;
  commission_flat_cents: number | null;
  term_months: number | null;
  signed_at: string | null;
  created_at: string;
  updated_at: string;
  contract_file_url: string | null;
  locations?: {
    name: string;
  } | null;
}

interface ContractStats {
  active: number;
  pending: number;
  renewals_due: number;
  avg_commission: number;
}

export function useContracts(search?: string) {
  return useQuery({
    queryKey: ['contracts', search],
    queryFn: async () => {
      let query = supabase
        .from('contracts')
        .select(`
          *,
          locations (
            name
          )
        `);

      if (search) {
        query = query.or(`title.ilike.%${search}%,contract_number.ilike.%${search}%,status.ilike.%${search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as any[];
    },
  });
}

export function useContractStats() {
  return useQuery({
    queryKey: ['contract-stats'],
    queryFn: async () => {
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select('status, revenue_share_pct, commission_flat_cents, term_months, signed_at');

      if (error) throw error;

      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);

      const stats: ContractStats = {
        active: contracts.filter(c => c.status === 'signed').length,
        pending: contracts.filter(c => c.status === 'draft' || c.status === 'pending').length,
        renewals_due: 0, // Would need signed_at + term_months calculation
        avg_commission: 0
      };

      // Calculate average commission rate
      const commissionsWithRate = contracts.filter(c => c.revenue_share_pct !== null);
      if (commissionsWithRate.length > 0) {
        stats.avg_commission = commissionsWithRate.reduce((sum, c) => sum + (c.revenue_share_pct || 0), 0) / commissionsWithRate.length;
      }

      return stats;
    },
  });
}

export function useDeleteContract() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contractId: string) => {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', contractId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contract-stats'] });
      toast({
        title: "Contract deleted",
        description: "The contract has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting contract",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}