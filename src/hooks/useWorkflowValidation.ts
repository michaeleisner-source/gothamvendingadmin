import { useSupabaseQuery } from "@/hooks/useOptimizedQuery";
import { useMemo } from "react";

export interface WorkflowValidation {
  isValid: boolean;
  issues: WorkflowIssue[];
  completeness: {
    prospects: number;
    locations: number;  
    machines: number;
    products: number;
  };
}

export interface WorkflowIssue {
  type: 'warning' | 'error' | 'info';
  title: string;
  description: string;
  action?: {
    label: string;
    link: string;
  };
}

export function useWorkflowValidation() {
  const { data: prospects = [] } = useSupabaseQuery<any>("prospects", "id, stage, status");
  const { data: locations = [] } = useSupabaseQuery<any>("locations", "id, name");
  const { data: machines = [] } = useSupabaseQuery<any>("machines", "id, name, status");
  const { data: products = [] } = useSupabaseQuery<any>("products", "id, name");
  const { data: slots = [] } = useSupabaseQuery<any>("machine_slots", "id, machine_id");

  const validation = useMemo((): WorkflowValidation => {
    const issues: WorkflowIssue[] = [];
    
    // Check for missing essential data
    if (products.length === 0) {
      issues.push({
        type: 'error',
        title: 'No Products Defined',
        description: 'You need to add products before setting up machines.',
        action: { label: 'Add Products', link: '/products' }
      });
    }

    if (locations.length === 0 && prospects.length === 0) {
      issues.push({
        type: 'warning',
        title: 'No Locations or Prospects',
        description: 'Start by adding prospects to build your pipeline.',
        action: { label: 'Add Prospect', link: '/prospects/new' }
      });
    }

    // Check for machines without slot configuration
    const machinesWithoutSlots = machines.filter(machine => 
      !slots.some(slot => slot.machine_id === machine.id)
    );

    if (machinesWithoutSlots.length > 0) {
      issues.push({
        type: 'warning',
        title: `${machinesWithoutSlots.length} Machine(s) Missing Slot Configuration`,
        description: 'Machines need slot configuration before they can be used.',
        action: { label: 'Configure Slots', link: '/slots' }
      });
    }

    // Check for stalled prospects
    const activeProspects = prospects.filter(p => 
      !['won', 'lost', 'closed_won', 'closed_lost'].includes((p.stage || p.status || '').toLowerCase())
    );

    if (activeProspects.length > 10) {
      issues.push({
        type: 'info',
        title: 'High Number of Active Prospects',
        description: 'Consider reviewing and updating prospect statuses.',
        action: { label: 'Review Prospects', link: '/prospects' }
      });
    }

    // Check for offline machines
    const offlineMachines = machines.filter(m => m.status === 'OFFLINE');
    if (offlineMachines.length > 0) {
      issues.push({
        type: 'warning',
        title: `${offlineMachines.length} Machine(s) Offline`,
        description: 'Some machines are not responding. Check connectivity and power.',
        action: { label: 'View Machines', link: '/machines' }
      });
    }

    return {
      isValid: issues.filter(i => i.type === 'error').length === 0,
      issues,
      completeness: {
        prospects: Math.min(100, (prospects.length / 5) * 100), // 5 prospects = 100%
        locations: Math.min(100, (locations.length / 3) * 100), // 3 locations = 100%
        machines: Math.min(100, (machines.length / 2) * 100),   // 2 machines = 100%
        products: Math.min(100, (products.length / 10) * 100),  // 10 products = 100%
      }
    };
  }, [prospects, locations, machines, products, slots]);

  return validation;
}