import { useState, useEffect } from "react";
import { Header } from "@/components/ui/Header";
import { FiltersBar } from "@/components/ui/FiltersBar";
import { SummaryCards } from "@/components/ui/SummaryCards";
import { DataTable } from "@/components/ui/DataTable";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SilentMachine {
  machine_id: string;
  machine_name: string;
  location_id: string;
  last_sale_at: string | null;
  since_last_sale: string | null;
  silent_flag: boolean;
}

export default function SilentMachines() {
  const [data, setData] = useState<SilentMachine[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSilentMachines();
  }, []);

  const fetchSilentMachines = async () => {
    try {
      setLoading(true);
      
      // Use raw SQL query to access the view
      const { data: silentData, error } = await supabase.rpc('get_machine_health_data');

      if (error) {
        console.error('Error fetching silent machines:', error);
        toast({
          title: "Error", 
          description: "Failed to load silent machines data",
          variant: "destructive",
        });
        return;
      }

      // Type the response data properly
      const typedData = (silentData as any[])?.map(item => ({
        machine_id: item.machine_id || '',
        machine_name: item.machine_name || '',
        location_id: item.location_id || '',
        last_sale_at: item.last_sale_at,
        since_last_sale: item.since_last_sale ? String(item.since_last_sale) : null,
        silent_flag: Boolean(item.silent_flag)
      })) || [];

      setData(typedData);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to load silent machines data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatInterval = (interval: string | null) => {
    if (!interval) return "Never";
    
    // Parse PostgreSQL interval format
    const match = interval.match(/(\d+) days?/);
    if (match) {
      const days = parseInt(match[1]);
      if (days === 0) return "Today";
      if (days === 1) return "1 day";
      if (days < 7) return `${days} days`;
      if (days < 30) return `${Math.floor(days / 7)} weeks`;
      return `${Math.floor(days / 30)} months`;
    }
    
    return interval;
  };

  const formatLastSale = (timestamp: string | null) => {
    if (!timestamp) return "Never";
    return new Date(timestamp).toLocaleDateString();
  };

  const silentMachinesCount = data.filter(m => m.silent_flag).length;
  const totalMachines = data.length;
  const activeMachines = totalMachines - silentMachinesCount;
  const silentPercentage = totalMachines > 0 ? ((silentMachinesCount / totalMachines) * 100).toFixed(1) : "0";

  const tableData = data.map(machine => [
    machine.machine_name || "Unknown",
    formatLastSale(machine.last_sale_at),
    formatInterval(machine.since_last_sale),
    machine.silent_flag ? "Yes" : "No"
  ]);

  return (
    <div className="p-4 space-y-4">
      <Header 
        title="Silent Machines" 
        subtitle="Machines with no recent sales activity" 
      />
      <FiltersBar />
      
      <SummaryCards 
        items={[
          { label: 'Total Machines', value: totalMachines.toString() },
          { label: 'Silent Machines', value: silentMachinesCount.toString() },
          { label: 'Active Machines', value: activeMachines.toString() },
          { label: 'Silent Rate', value: `${silentPercentage}%` },
        ]} 
      />
      
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <DataTable
          columns={["Machine", "Last Sale", "Days Since Sale", "Silent"]}
          data={tableData}
        />
      )}
    </div>
  );
}