import { supabase } from "@/integrations/supabase/client";

// Types matching the new simplified schema
export type Product = {
  id: string;
  sku: string;
  name: string;
  category?: string;
  manufacturer?: string;
  size_oz?: number | null;
  size_ml?: number | null;
  image_url?: string | null;
  description?: string | null;
  cost?: number;
  price?: number;
  created_at: string;
  updated_at: string;
};

export interface Machine {
  id: string;
  location_id: string;
  machine_model: string;
  serial_number: string;
  install_date: string;
  status: string;
  last_service_date?: string;
  next_service_date?: string;
  current_cash: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  location_type: string;
  contact_name: string;
  contact_email?: string;
  contact_phone?: string;
  revenue_split: number;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  machine_id: string;
  product_name: string;
  quantity_sold: number;
  unit_price: number;
  total_amount: number;
  sale_date: string;
  payment_method: string;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  location_type: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  estimated_foot_traffic: number;
  contact_method: string;
  status: string;
  notes?: string;
  follow_up_date?: string;
  revenue_split?: number;
  created_at: string;
  updated_at: string;
}

export type SaleInput = {
  machine_id: string;
  product_name: string;
  quantity_sold: number;
  unit_price: number;
  total_amount: number;
  payment_method?: string;
  sale_date?: string;
};

// API functions using the new simplified schema
export const api = {
  // Health check
  health: async () => {
    const { data, error } = await supabase.from('leads').select('count');
    if (error) throw error;
    return { status: 'ok', connected: true };
  },

  // Locations
  listLocations: async (): Promise<Location[]> => {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('name');
    if (error) throw error;
    return data || [];
  },

  createLocation: async (location: Partial<Location>): Promise<Location> => {
    const { data, error } = await supabase
      .from('locations')
      .insert([location as any])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Machines
  listMachines: async (): Promise<Machine[]> => {
    const { data, error } = await supabase
      .from('machines')
      .select('*')
      .order('machine_model');
    if (error) throw error;
    return data || [];
  },

  createMachine: async (machine: Partial<Machine>): Promise<Machine> => {
    const { data, error } = await supabase
      .from('machines')
      .insert([machine as any])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Sales
  recordSale: async (sale: SaleInput): Promise<string> => {
    const { data, error } = await supabase
      .from('sales')
      .insert([{
        machine_id: sale.machine_id,
        product_name: sale.product_name,
        quantity_sold: sale.quantity_sold,
        unit_price: sale.unit_price,
        total_amount: sale.total_amount,
        payment_method: sale.payment_method || 'cash',
        sale_date: sale.sale_date || new Date().toISOString()
      }])
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  },

  listSales: async (limit = 100): Promise<Sale[]> => {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('sale_date', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  // Leads
  listLeads: async (): Promise<Lead[]> => {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  createLead: async (lead: Partial<Lead>): Promise<Lead> => {
    const { data, error } = await supabase
      .from('leads')
      .insert([lead as any])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateLead: async (id: string, updates: Partial<Lead>): Promise<Lead> => {
    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Dashboard metrics
  dashboardMetrics: async () => {
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
      counts: {
        leads: leads.length,
        locations: locations.length,
        machines: machines.length,
        open_purchase_orders: 0 // Not implemented in simplified schema
      },
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
  }
};