import { useSupabaseQuery } from "@/hooks/useOptimizedQuery";
import { useMemo } from "react";

export interface DashboardData {
  machines: {
    total: number;
    online: number;
    offline: number;
    service: number;
  };
  locations: {
    total: number;
    active: number;
  };
  prospects: {
    total: number;
    active: number;
    won_this_month: number;
  };
  recentActivity: {
    type: string;
    message: string;
    timestamp: string;
  }[];
}

export function useDashboardData() {
  const { data: machines = [], isLoading: machinesLoading } = useSupabaseQuery<any>(
    "machines", 
    "id, name, status, created_at",
    [],
    { column: "created_at", ascending: false }
  );

  const { data: locations = [], isLoading: locationsLoading } = useSupabaseQuery<any>(
    "locations",
    "id, name, created_at",
    [],
    { column: "created_at", ascending: false }
  );

  const { data: prospects = [], isLoading: prospectsLoading } = useSupabaseQuery<any>(
    "prospects",
    "id, business_name, stage, status, created_at, updated_at",
    [],
    { column: "updated_at", ascending: false }
  );

  const dashboardData = useMemo((): DashboardData => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return {
      machines: {
        total: machines.length,
        online: machines.filter(m => m.status === 'ONLINE').length,
        offline: machines.filter(m => m.status === 'OFFLINE').length,
        service: machines.filter(m => m.status === 'SERVICE').length,
      },
      locations: {
        total: locations.length,
        active: locations.length, // All locations are considered active for now
      },
      prospects: {
        total: prospects.length,
        active: prospects.filter(p => !['won', 'lost', 'closed_won', 'closed_lost'].includes((p.stage || p.status || '').toLowerCase())).length,
        won_this_month: prospects.filter(p => {
          const stage = (p.stage || p.status || '').toLowerCase();
          const isWon = ['won', 'closed_won'].includes(stage);
          if (!isWon) return false;
          
          const updatedDate = new Date(p.updated_at);
          return updatedDate.getMonth() === currentMonth && updatedDate.getFullYear() === currentYear;
        }).length,
      },
      recentActivity: [
        ...machines.slice(0, 2).map(m => ({
          type: 'machine',
          message: `Machine "${m.name}" was added`,
          timestamp: m.created_at,
        })),
        ...locations.slice(0, 2).map(l => ({
          type: 'location', 
          message: `Location "${l.name}" was added`,
          timestamp: l.created_at,
        })),
        ...prospects.slice(0, 2).map(p => ({
          type: 'prospect',
          message: `Prospect "${p.business_name}" was updated`,
          timestamp: p.updated_at,
        })),
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5),
    };
  }, [machines, locations, prospects]);

  return {
    data: dashboardData,
    isLoading: machinesLoading || locationsLoading || prospectsLoading,
  };
}