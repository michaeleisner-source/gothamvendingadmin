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
    const { data: inventoryData, error: inventoryError } = await supabase
      .from('inventory_levels')
      .select(`
        current_qty,
        reorder_point,
        par_level,
        last_restocked_at,
        products!inner(
          id,
          name,
          sku,
          cost,
          price,
          category
        ),
        machine_slots!inner(
          label,
          machines!inner(
            name,
            location_id
          )
        )
      `);

    if (inventoryError) throw inventoryError;

    // Transform and calculate values
    const items = (inventoryData || []).map((item: any) => {
      const cost = item.products.cost || 0;
      const price = item.products.price || 0;
      const currentQty = item.current_qty || 0;
      const stockValue = currentQty * cost;
      const potentialRevenue = currentQty * price;

      return {
        product_id: item.products.id,
        product_name: item.products.name,
        sku: item.products.sku || '',
        category: item.products.category || 'Uncategorized',
        machine_name: item.machine_slots.machines.name,
        slot_label: item.machine_slots.label,
        current_qty: currentQty,
        reorder_point: item.reorder_point,
        par_level: item.par_level,
        unit_cost: cost,
        unit_price: price,
        stock_value: stockValue,
        potential_revenue: potentialRevenue,
        margin_per_unit: price - cost,
        last_restocked: item.last_restocked_at,
        status: currentQty <= (item.reorder_point || 0) ? 'Low Stock' : 
                currentQty === 0 ? 'Out of Stock' : 'Normal'
      };
    });

    const totalValue = items.reduce((sum, item) => sum + item.stock_value, 0);
    const totalRevenue = items.reduce((sum, item) => sum + item.potential_revenue, 0);
    
    return {
      total_value: totalValue,
      total_potential_revenue: totalRevenue,
      total_items: items.length,
      low_stock_items: items.filter(item => item.status === 'Low Stock').length,
      out_of_stock_items: items.filter(item => item.status === 'Out of Stock').length,
      items
    };
  },

  margins: async (from?: string, to?: string) => {
    const { data, error } = await supabase.rpc('report_revenue_per_product', {
      p_start: from ? new Date(from).toISOString() : null,
      p_end: to ? new Date(to).toISOString() : null
    });
    if (error) {
      console.warn('Using fallback margins calculation:', error);
      // Fallback: calculate margins from products table directly
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, sku, cost, price, category');
      
      if (productsError) throw productsError;
      
      return (products || []).map(product => {
        const cost = product.cost || 0;
        const price = product.price || 0;
        const marginDollar = price - cost;
        const marginPct = cost > 0 ? (marginDollar / cost) * 100 : 0;
        
        return {
          product_id: product.id,
          product_name: product.name,
          sku: product.sku,
          category: product.category,
          cost,
          price,
          margin_dollar: marginDollar,
          margin_percent: marginPct,
          orders: 0, // No sales data available
          qty_sold: 0,
          gross_revenue_cents: 0
        };
      });
    }
    return data || [];
  },

  machinePerformance: async (from?: string, to?: string) => {
    const { data, error } = await supabase.rpc('report_revenue_per_machine', {
      p_start: from ? new Date(from).toISOString() : null,
      p_end: to ? new Date(to).toISOString() : null
    });
    if (error) {
      console.warn('Using fallback machine performance calculation:', error);
      // Fallback: calculate from sales and machines directly
      const fromDate = from ? new Date(from).toISOString() : 
                       new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const toDate = to ? new Date(to).toISOString() : new Date().toISOString();
      
      const [salesRes, machinesRes] = await Promise.all([
        supabase
          .from('sales')
          .select('machine_id, qty, unit_price_cents, unit_cost_cents')
          .gte('occurred_at', fromDate)
          .lte('occurred_at', toDate),
        supabase
          .from('machines')
          .select('id, name')
      ]);
      
      if (salesRes.error) throw salesRes.error;
      if (machinesRes.error) throw machinesRes.error;
      
      // Group sales by machine
      const salesByMachine: Record<string, any> = {};
      (salesRes.data || []).forEach(sale => {
        if (!salesByMachine[sale.machine_id]) {
          salesByMachine[sale.machine_id] = {
            orders: 0,
            qty_sold: 0,
            gross_revenue_cents: 0,
            cost_cents: 0
          };
        }
        
        const machine = salesByMachine[sale.machine_id];
        machine.orders += 1;
        machine.qty_sold += sale.qty;
        machine.gross_revenue_cents += sale.qty * sale.unit_price_cents;
        machine.cost_cents += sale.qty * (sale.unit_cost_cents || 0);
      });
      
      return (machinesRes.data || []).map(machine => {
        const perf = salesByMachine[machine.id] || {
          orders: 0,
          qty_sold: 0,
          gross_revenue_cents: 0,
          cost_cents: 0
        };
        
        const netProfitCents = perf.gross_revenue_cents - perf.cost_cents;
        const profitPct = perf.gross_revenue_cents > 0 ? 
          (netProfitCents / perf.gross_revenue_cents) * 100 : 0;
        
        return {
          machine_id: machine.id,
          machine_name: machine.name,
          orders: perf.orders,
          qty_sold: perf.qty_sold,
          gross_revenue_cents: perf.gross_revenue_cents,
          cost_cents: perf.cost_cents,
          net_profit_cents: netProfitCents,
          profit_pct: profitPct
        };
      }).sort((a, b) => b.net_profit_cents - a.net_profit_cents);
    }
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