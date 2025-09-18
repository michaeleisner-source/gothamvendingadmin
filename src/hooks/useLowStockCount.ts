import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useLowStockCount() {
  const [lowCount, setLowCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchLowStockCount = async () => {
    const res = await supabase.rpc("count_low_stock");
    if (!res.error) {
      setLowCount(res.data || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;
    
    // Initial fetch
    fetchLowStockCount();

    // Set up real-time subscription for machine_slots changes
    const channel = supabase
      .channel('low-stock-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'machine_slots'
        },
        () => {
          if (mounted) {
            fetchLowStockCount();
          }
        }
      )
      .subscribe();

    // Auth state change listener
    const { data: authSub } = supabase.auth.onAuthStateChange(() => {
      if (mounted) {
        fetchLowStockCount();
      }
    });

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
      authSub.subscription.unsubscribe();
    };
  }, []);

  return { lowCount, loading };
}