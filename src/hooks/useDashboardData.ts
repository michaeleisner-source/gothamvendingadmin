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
  leads: {
    total: number;
    active: number;
    closed_this_month: number;
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

  const { data: leads = [], isLoading: leadsLoading } = useSupabaseQuery<any>(
    "leads",
    "id, name, company, status, created_at, updated_at",
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
      leads: {
        total: leads.length,
        active: leads.filter(l => !['closed', 'rejected'].includes((l.status || '').toLowerCase())).length,
        closed_this_month: leads.filter(l => {
          const status = (l.status || '').toLowerCase();
          const isClosed = status === 'closed';
          if (!isClosed) return false;
          
          const updatedDate = new Date(l.updated_at);
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
        ...leads.slice(0, 2).map(l => ({
          type: 'lead',
          message: `Lead "${l.name}" was updated`,
          timestamp: l.updated_at,
        })),
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5),
    };
  }, [machines, locations, leads]);

  return {
    data: dashboardData,
    isLoading: machinesLoading || locationsLoading || leadsLoading,
  };
}