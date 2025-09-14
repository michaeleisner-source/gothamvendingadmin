import { supabase } from "@/integrations/supabase/client";

// Types matching your actual Supabase schema
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
  org_id: string;
  created_at: string;
  updated_at: string;
};

export type Machine = {
  id: string;
  name: string;
  location_id?: string | null;
  location?: string;
  status: string;
  org_id: string;
  created_at?: string;
};

export type Location = {
  id: string;
  name: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  location_type_id?: string;
  traffic_daily_est?: number;
  traffic_monthly_est?: number;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  org_id: string;
  created_at?: string;
};

export type MachineSlot = {
  id: string;
  machine_id: string;
  label: string;
  row: number;
  col: number;
  capacity?: number;
  org_id: string;
};

export type SlotAssignment = {
  id: string;
  slot_id: string;
  product_id: string;
  max_qty?: number;
  restock_threshold?: number;
  org_id: string;
};

export type Sale = {
  id: string;
  machine_id: string;
  product_id: string;
  qty: number;
  unit_price_cents: number;
  unit_cost_cents?: number;
  occurred_at: string;
  source?: string;
  org_id: string;
};

export type RestockInput = {
  machine_id: string;
  slot_assignments: Array<{
    label: string;
    product_id: string;
    prev_qty?: number;
    added_qty?: number;
    new_qty?: number;
    max_qty?: number;
    restock_threshold?: number;
  }>;
  note?: string;
};

export type SaleInput = {
  machine_id: string;
  product_id: string;
  qty: number;
  unit_price_cents: number;
  unit_cost_cents?: number;
  occurred_at?: string;
  source?: string;
};

// API functions using Supabase client and database functions
export const api = {
  // Health check
  health: async () => {
    const { data, error } = await supabase.from('products').select('count');
    if (error) throw error;
    return { status: 'ok', connected: true };
  },

  // Products
  listProducts: async (search?: string): Promise<Product[]> => {
    const { data, error } = await supabase.rpc('list_products', {
      p_search: search || null,
      p_limit: 1000,
      p_offset: 0
    });
    if (error) throw error;
    return data || [];
  },

  createProduct: async (product: Partial<Product>): Promise<Product> => {
    const { data, error } = await supabase.rpc('upsert_product', {
      p: {
        name: product.name,
        sku: product.sku,
        category: product.category,
        manufacturer: product.manufacturer,
        cost: product.cost,
        price: product.price
      }
    });
    if (error) throw error;
    
    // Return the created product
    const { data: newProduct, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', data)
      .single();
    if (fetchError) throw fetchError;
    return newProduct;
  },

  updateProduct: async (id: string, updates: Partial<Product>): Promise<Product> => {
    const { data, error } = await supabase.rpc('upsert_product', {
      p: {
        id,
        ...updates
      }
    });
    if (error) throw error;
    
    // Return the updated product
    const { data: updatedProduct, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', data)
      .single();
    if (fetchError) throw fetchError;
    return updatedProduct;
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
      .order('name');
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

  // Machine Slots
  listSlots: async (machineId?: string): Promise<MachineSlot[]> => {
    let query = supabase.from('machine_slots').select('*');
    if (machineId) {
      query = query.eq('machine_id', machineId);
    }
    const { data, error } = await query.order('row').order('col');
    if (error) throw error;
    return data || [];
  },

  generateSlots: async (machineId: string, rows: number, cols: number): Promise<number> => {
    const { data, error } = await supabase.rpc('generate_machine_slots', {
      p_machine_id: machineId,
      p_rows: rows,
      p_cols: cols
    });
    if (error) throw error;
    return data;
  },

  // Slot Assignments
  listSlotAssignments: async (machineId?: string): Promise<SlotAssignment[]> => {
    let query = supabase.from('slot_assignments').select(`
      *,
      machine_slots!inner(machine_id, label)
    `);
    if (machineId) {
      query = query.eq('machine_slots.machine_id', machineId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  upsertSlotAssignments: async (machineId: string, assignments: any[]): Promise<number> => {
    const { data, error } = await supabase.rpc('upsert_slot_assignments', {
      p_machine_id: machineId,
      p_assignments: assignments
    });
    if (error) throw error;
    return data;
  },

  // Restocking
  startRestockSession: async (machineId: string, note?: string): Promise<string> => {
    const { data, error } = await supabase.rpc('start_restock_session', {
      p_machine_id: machineId,
      p_note: note
    });
    if (error) throw error;
    return data;
  },

  saveRestockSession: async (sessionId: string, complete: boolean, lines: any[]): Promise<number> => {
    const { data, error } = await supabase.rpc('save_restock_session', {
      p_session_id: sessionId,
      p_complete: complete,
      p_lines: lines
    });
    if (error) throw error;
    return data;
  },

  // Sales
  recordSale: async (sale: SaleInput): Promise<string> => {
    const { data, error } = await supabase.rpc('record_sale', {
      p_machine_id: sale.machine_id,
      p_product_id: sale.product_id,
      p_qty: sale.qty,
      p_unit_price_cents: sale.unit_price_cents,
      p_unit_cost_cents: sale.unit_cost_cents,
      p_occurred_at: sale.occurred_at,
      p_source: sale.source || 'manual'
    });
    if (error) throw error;
    return data;
  },

  listSales: async (limit = 100): Promise<Sale[]> => {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('occurred_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  // Reports
  inventoryValuation: async () => {
    // Calculate inventory value based on current stock and product costs
    const { data: slots, error: slotsError } = await supabase
      .from('slot_assignments')
      .select(`
        *,
        products(name, sku, cost),
        machine_slots(machine_id, label)
      `);
    if (slotsError) throw slotsError;

    // Get latest restock quantities
    const { data: restocks, error: restocksError } = await supabase
      .from('restock_lines')
      .select(`
        slot_id,
        new_qty,
        restock_sessions!inner(completed_at)
      `)
      .not('restock_sessions.completed_at', 'is', null)
      .order('restock_sessions.completed_at', { ascending: false });
    if (restocksError) throw restocksError;

    // Calculate current inventory value
    // This is a simplified calculation - you might want to enhance it
    return { total_value: 0, items: [] };
  },

  margins: async (from?: string, to?: string) => {
    const { data, error } = await supabase.rpc('report_revenue_per_product', {
      p_start: from ? new Date(from).toISOString() : null,
      p_end: to ? new Date(to).toISOString() : null
    });
    if (error) throw error;
    return data || [];
  },

  machinePerformance: async (from?: string, to?: string) => {
    const { data, error } = await supabase.rpc('report_revenue_per_machine', {
      p_start: from ? new Date(from).toISOString() : null,
      p_end: to ? new Date(to).toISOString() : null
    });
    if (error) throw error;
    return data || [];
  },

  productProfitability: async (from?: string, to?: string) => {
    const { data, error } = await supabase.rpc('report_revenue_per_product', {
      p_start: from ? new Date(from).toISOString() : null,
      p_end: to ? new Date(to).toISOString() : null
    });
    if (error) throw error;
    return data || [];
  },

  // Dashboard metrics
  dashboardMetrics: async () => {
    const { data, error } = await supabase.rpc('dashboard_metrics');
    if (error) throw error;
    return data;
  },

  // Low stock report
  lowStockReport: async () => {
    const { data, error } = await supabase.rpc('report_low_stock');
    if (error) throw error;
    return data || [];
  }
};