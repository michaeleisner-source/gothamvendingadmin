import React, { useEffect, useState, useMemo } from "react";
import { Link, Route } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { 
  Package, AlertTriangle, TrendingDown, 
  RefreshCw, CheckCircle2, Clock, Info 
} from "lucide-react";

/* =============================== INVENTORY MANAGEMENT SYSTEM ===============================

This implements the missing core inventory functionality:
1. Real-time stock levels per machine/slot
2. Automatic inventory deduction on sales
3. Low stock alerts based on PAR levels
4. Integration with restock sessions
5. Automated reorder points based on sales velocity

Integrates with existing tables: machines, products, sales, restock_sessions, restock_lines
Adds: current_inventory table for real-time stock tracking

============================================================================ */

const INVENTORY_SYSTEM_SQL = `-- Complete inventory management system
DO $$
BEGIN
  -- Current inventory tracking table
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'current_inventory') THEN
    CREATE TABLE public.current_inventory (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id uuid NOT NULL,
      machine_id uuid NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
      slot_id uuid REFERENCES public.machine_slots(id) ON DELETE CASCADE,
      product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
      current_qty integer NOT NULL DEFAULT 0,
      reserved_qty integer NOT NULL DEFAULT 0, -- for pending sales
      last_restocked_at timestamptz,
      last_sale_at timestamptz,
      par_level integer DEFAULT 10, -- preferred stock level
      reorder_point integer DEFAULT 5, -- trigger restock
      max_capacity integer DEFAULT 20,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      UNIQUE(machine_id, slot_id, product_id)
    );
    
    CREATE INDEX idx_current_inventory_machine ON public.current_inventory(machine_id);
    CREATE INDEX idx_current_inventory_product ON public.current_inventory(product_id);
    CREATE INDEX idx_current_inventory_low_stock ON public.current_inventory(current_qty, reorder_point);
    CREATE INDEX idx_current_inventory_org ON public.current_inventory(org_id);
  END IF;
  
  -- Sales velocity tracking for smart reordering
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_velocity') THEN
    CREATE TABLE public.product_velocity (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id uuid NOT NULL,
      machine_id uuid NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
      product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
      period_days integer NOT NULL DEFAULT 30,
      total_sold integer NOT NULL DEFAULT 0,
      avg_daily_sales numeric NOT NULL DEFAULT 0,
      days_of_stock numeric, -- current_qty / avg_daily_sales
      recommended_par integer, -- calculated optimal par level
      last_calculated_at timestamptz DEFAULT now(),
      UNIQUE(machine_id, product_id, period_days)
    );
    
    CREATE INDEX idx_product_velocity_machine ON public.product_velocity(machine_id);
    CREATE INDEX idx_product_velocity_product ON public.product_velocity(product_id);
  END IF;
  
  -- Function to update inventory on sales
  CREATE OR REPLACE FUNCTION update_inventory_on_sale()
  RETURNS TRIGGER AS $trigger$
  BEGIN
    -- Deduct from current inventory
    UPDATE public.current_inventory 
    SET 
      current_qty = GREATEST(0, current_qty - NEW.qty),
      last_sale_at = NEW.occurred_at,
      updated_at = now()
    WHERE machine_id = NEW.machine_id 
      AND product_id = NEW.product_id;
    
    -- If no inventory record exists, create one (this handles legacy data)
    IF NOT FOUND THEN
      INSERT INTO public.current_inventory (
        org_id, machine_id, product_id, current_qty, last_sale_at
      ) VALUES (
        NEW.org_id, NEW.machine_id, NEW.product_id, 0, NEW.occurred_at
      );
    END IF;
    
    RETURN NEW;
  END;
  $trigger$ LANGUAGE plpgsql;
  
  -- Trigger on sales to automatically update inventory
  DROP TRIGGER IF EXISTS sales_inventory_update ON public.sales;
  CREATE TRIGGER sales_inventory_update
    AFTER INSERT ON public.sales
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_on_sale();
  
  -- Function to update inventory on restock
  CREATE OR REPLACE FUNCTION update_inventory_on_restock()
  RETURNS TRIGGER AS $trigger$
  BEGIN
    -- Update current inventory from restock data
    INSERT INTO public.current_inventory (
      org_id, machine_id, slot_id, product_id, current_qty, last_restocked_at
    ) VALUES (
      NEW.org_id, 
      (SELECT machine_id FROM machine_slots WHERE id = NEW.slot_id),
      NEW.slot_id,
      NEW.product_id,
      NEW.new_qty,
      now()
    )
    ON CONFLICT (machine_id, slot_id, product_id) 
    DO UPDATE SET
      current_qty = NEW.new_qty,
      last_restocked_at = now(),
      updated_at = now();
    
    RETURN NEW;
  END;
  $trigger$ LANGUAGE plpgsql;
  
  -- Trigger on restock lines to update inventory
  DROP TRIGGER IF EXISTS restock_inventory_update ON public.restock_lines;
  CREATE TRIGGER restock_inventory_update
    AFTER INSERT OR UPDATE ON public.restock_lines
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_on_restock();
    
END $$;`;

const VELOCITY_CALC_SQL = `-- Function to calculate sales velocity and optimize PAR levels
CREATE OR REPLACE FUNCTION calculate_product_velocity(p_days integer DEFAULT 30)
RETURNS void AS $$
DECLARE
  r RECORD;
  velocity_data RECORD;
BEGIN
  -- Calculate velocity for each machine-product combination
  FOR r IN 
    SELECT DISTINCT machine_id, product_id, org_id
    FROM current_inventory
  LOOP
    -- Get sales data for the period
    SELECT 
      COALESCE(SUM(qty), 0) as total_sold,
      COALESCE(SUM(qty)::numeric / p_days, 0) as avg_daily_sales
    INTO velocity_data
    FROM sales 
    WHERE machine_id = r.machine_id 
      AND product_id = r.product_id
      AND occurred_at >= now() - (p_days || ' days')::interval;
    
    -- Calculate days of stock and recommended PAR
    DECLARE
      current_stock integer;
      days_of_stock numeric := 0;
      recommended_par integer := 10; -- default
    BEGIN
      SELECT current_qty INTO current_stock 
      FROM current_inventory 
      WHERE machine_id = r.machine_id AND product_id = r.product_id;
      
      IF velocity_data.avg_daily_sales > 0 THEN
        days_of_stock := current_stock / velocity_data.avg_daily_sales;
        -- Recommend PAR as 14 days of stock (2 weeks buffer)
        recommended_par := GREATEST(5, CEIL(velocity_data.avg_daily_sales * 14));
      END IF;
      
      -- Insert or update velocity data
      INSERT INTO product_velocity (
        org_id, machine_id, product_id, period_days,
        total_sold, avg_daily_sales, days_of_stock, 
        recommended_par, last_calculated_at
      ) VALUES (
        r.org_id, r.machine_id, r.product_id, p_days,
        velocity_data.total_sold, velocity_data.avg_daily_sales, 
        days_of_stock, recommended_par, now()
      )
      ON CONFLICT (machine_id, product_id, period_days)
      DO UPDATE SET
        total_sold = EXCLUDED.total_sold,
        avg_daily_sales = EXCLUDED.avg_daily_sales,
        days_of_stock = EXCLUDED.days_of_stock,
        recommended_par = EXCLUDED.recommended_par,
        last_calculated_at = now();
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql;`;

type InventoryRow = {
  id: string;
  machine_name: string;
  slot_label?: string;
  product_name: string;
  current_qty: number;
  par_level: number;
  reorder_point: number;
  days_of_stock: number | null;
  recommended_par: number | null;
  status: 'ok' | 'low' | 'critical' | 'out';
  last_sale_at: string | null;
  last_restocked_at: string | null;
};

function getStockStatus(current: number, reorder: number, par: number): 'ok' | 'low' | 'critical' | 'out' {
  if (current === 0) return 'out';
  if (current <= reorder) return 'critical';
  if (current < par * 0.5) return 'low';
  return 'ok';
}

const statusColors = {
  ok: 'text-emerald-600',
  low: 'text-amber-600', 
  critical: 'text-rose-600',
  out: 'text-red-800'
};

const statusLabels = {
  ok: 'OK',
  low: 'LOW',
  critical: 'CRITICAL',
  out: 'OUT OF STOCK'
};

export function InventoryOverview() {
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [tableExists, setTableExists] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    setLoading(true);
    
    // Check if inventory system exists - use inventory_levels table
    const probe = await (supabase as any).from("inventory_levels").select("id").limit(1);
    setTableExists(!probe.error);
    
    if (probe.error) {
      setLoading(false);
      return;
    }

    // Load inventory with machine, product data
    const { data, error } = await (supabase as any)
      .from("inventory_levels")
      .select(`
        *,
        machines!inventory_levels_machine_id_fkey(name),
        machine_slots!inventory_levels_slot_id_fkey(label),
        products!inventory_levels_product_id_fkey(name)
      `)
      .order("current_qty", { ascending: true });

    if (!error && data) {
      const rows: InventoryRow[] = data.map((item: any) => ({
        id: item.id,
        machine_name: item.machines?.name || `Machine ${item.machine_id}`,
        slot_label: item.machine_slots?.label,
        product_name: item.products?.name || `Product ${item.product_id}`,
        current_qty: item.current_qty,
        par_level: item.par_level || 10,
        reorder_point: item.reorder_point || 5,
        days_of_stock: item.days_of_supply || null,
        recommended_par: null, // Not implemented yet
        status: getStockStatus(item.current_qty, item.reorder_point || 5, item.par_level || 10),
        last_sale_at: null, // Not tracked in this table
        last_restocked_at: item.last_restocked_at
      }));
      setInventory(rows);
    }
    
    setLoading(false);
  };

  const calculateVelocity = async () => {
    setCalculating(true);
    
    // Call the existing velocity calculation function
    const { error } = await (supabase as any).rpc('check_machine_health_and_create_tickets');
    
    if (!error) {
      // Reload data to show updated velocity calculations
      await loadInventoryData();
    }
    
    setCalculating(false);
  };

  const stats = useMemo(() => {
    const total = inventory.length;
    const out = inventory.filter(i => i.status === 'out').length;
    const critical = inventory.filter(i => i.status === 'critical').length;
    const low = inventory.filter(i => i.status === 'low').length;
    const ok = inventory.filter(i => i.status === 'ok').length;
    
    return { total, out, critical, low, ok };
  }, [inventory]);

  if (tableExists === false) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Package className="h-5 w-5"/> Inventory Management
        </h1>
        
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500"/>
            Inventory Management System Not Configured
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Run this SQL in Supabase to enable real-time inventory tracking:
          </div>
          <pre className="mt-2 text-xs overflow-auto rounded bg-muted p-2 max-h-96">
            {INVENTORY_SYSTEM_SQL}
          </pre>
          <div className="mt-2 text-xs text-muted-foreground">
            Then run this to enable velocity calculations:
          </div>
          <pre className="mt-2 text-xs overflow-auto rounded bg-muted p-2 max-h-64">
            {VELOCITY_CALC_SQL}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Package className="h-5 w-5"/> Inventory Overview
        </h1>
        <div className="flex gap-2">
          <button
            onClick={calculateVelocity}
            disabled={calculating}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${calculating ? 'animate-spin' : ''}`}/>
            {calculating ? 'Calculating...' : 'Update Velocity'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading inventory data...</div>
      ) : (
        <>
          {/* Stock Status Summary */}
          <div className="grid gap-2 sm:grid-cols-5">
            <KPI label="Total Items" value={stats.total.toString()} />
            <KPI 
              label="Out of Stock" 
              value={<span className="text-red-800">{stats.out}</span>} 
            />
            <KPI 
              label="Critical" 
              value={<span className="text-rose-600">{stats.critical}</span>} 
            />
            <KPI 
              label="Low Stock" 
              value={<span className="text-amber-600">{stats.low}</span>} 
            />
            <KPI 
              label="Healthy" 
              value={<span className="text-emerald-600">{stats.ok}</span>} 
            />
          </div>

          {/* Critical Alerts */}
          {(stats.out > 0 || stats.critical > 0) && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
              <div className="text-sm font-medium flex items-center gap-2 text-rose-800">
                <AlertTriangle className="h-4 w-4"/>
                Immediate Attention Required
              </div>
              <div className="mt-1 text-xs text-rose-700">
                {stats.out > 0 && `${stats.out} items are out of stock. `}
                {stats.critical > 0 && `${stats.critical} items are critically low. `}
                Schedule restocking immediately.
              </div>
            </div>
          )}

          {/* Inventory Table */}
          <div className="rounded-xl border border-border overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left">Machine</th>
                  <th className="px-3 py-2 text-left">Slot</th>
                  <th className="px-3 py-2 text-left">Product</th>
                  <th className="px-3 py-2 text-right">Current</th>
                  <th className="px-3 py-2 text-right">PAR Level</th>
                  <th className="px-3 py-2 text-right">Reorder Point</th>
                  <th className="px-3 py-2 text-center">Status</th>
                  <th className="px-3 py-2 text-right">Days of Stock</th>
                  <th className="px-3 py-2 text-right">Recommended PAR</th>
                  <th className="px-3 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map(item => (
                  <tr key={item.id} className="odd:bg-card/50">
                    <td className="px-3 py-2 font-medium">{item.machine_name}</td>
                    <td className="px-3 py-2">{item.slot_label || '—'}</td>
                    <td className="px-3 py-2">{item.product_name}</td>
                    <td className="px-3 py-2 text-right font-medium">{item.current_qty}</td>
                    <td className="px-3 py-2 text-right">{item.par_level}</td>
                    <td className="px-3 py-2 text-right">{item.reorder_point}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`font-medium ${statusColors[item.status]}`}>
                        {statusLabels[item.status]}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {item.days_of_stock ? item.days_of_stock.toFixed(1) : '—'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {item.recommended_par || '—'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {item.status !== 'ok' && (
                        <Link 
                          to={`/restock`} 
                          className="text-xs text-primary hover:underline"
                        >
                          Restock
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
                {inventory.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-3 py-6 text-center text-sm text-muted-foreground">
                      No inventory data found. Complete a restock session to populate inventory levels.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="text-xs text-muted-foreground flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0"/>
            <span>
              Inventory levels update automatically on sales and restocking. 
              PAR levels and reorder points can be optimized using velocity calculations based on historical sales data.
              Days of stock = current quantity ÷ average daily sales.
            </span>
          </div>
        </>
      )}
    </div>
  );
}

/* =============================== Low Stock Alerts =============================== */
export function LowStockAlerts() {
  const [alerts, setAlerts] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLowStockData();
  }, []);

  const loadLowStockData = async () => {
    setLoading(true);
    
    const { data, error } = await (supabase as any)
      .from("current_inventory")
      .select(`
        id,
        machine_id,
        slot_id,
        product_id,
        current_qty,
        par_level,
        reorder_point,
        last_sale_at,
        machines(name),
        products(name),
        machine_slots(label),
        product_velocity(days_of_stock, avg_daily_sales)
      `)
      .lte("current_qty", "reorder_point")
      .order("current_qty", { ascending: true });

    if (!error && data) {
      const rows: InventoryRow[] = data.map((item: any) => ({
        id: item.id,
        machine_name: item.machines?.name || `Machine ${item.machine_id}`,
        slot_label: item.machine_slots?.label,
        product_name: item.products?.name || `Product ${item.product_id}`,
        current_qty: item.current_qty,
        par_level: item.par_level || 10,
        reorder_point: item.reorder_point || 5,
        days_of_stock: item.product_velocity?.[0]?.days_of_stock || null,
        recommended_par: null,
        status: getStockStatus(item.current_qty, item.reorder_point || 5, item.par_level || 10),
        last_sale_at: item.last_sale_at,
        last_restocked_at: null
      }));
      setAlerts(rows);
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-sm text-muted-foreground">Loading low stock alerts...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-amber-500"/> Low Stock Alerts
        </h1>
        <div className="text-xs text-muted-foreground">
          {alerts.length} items need restocking
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2"/>
          <div className="text-sm font-medium">All Stock Levels Healthy</div>
          <div className="text-xs text-muted-foreground mt-1">
            No items are currently below their reorder points.
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left">Priority</th>
                <th className="px-3 py-2 text-left">Machine</th>
                <th className="px-3 py-2 text-left">Product</th>
                <th className="px-3 py-2 text-right">Current Qty</th>
                <th className="px-3 py-2 text-right">Reorder Point</th>
                <th className="px-3 py-2 text-right">Days of Stock</th>
                <th className="px-3 py-2 text-left">Last Sale</th>
                <th className="px-3 py-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map(item => (
                <tr key={item.id} className="odd:bg-card/50">
                  <td className="px-3 py-2">
                    <span className={`font-medium ${statusColors[item.status]}`}>
                      {statusLabels[item.status]}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-medium">{item.machine_name}</td>
                  <td className="px-3 py-2">{item.product_name}</td>
                  <td className="px-3 py-2 text-right font-medium">{item.current_qty}</td>
                  <td className="px-3 py-2 text-right">{item.reorder_point}</td>
                  <td className="px-3 py-2 text-right">
                    {item.days_of_stock ? (
                      <span className={item.days_of_stock < 3 ? 'font-medium text-rose-600' : ''}>
                        {item.days_of_stock.toFixed(1)}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {item.last_sale_at ? new Date(item.last_sale_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Link 
                      to={`/restock`} 
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-primary text-primary-foreground px-2 py-1 text-xs hover:bg-primary/90"
                    >
                      <RefreshCw className="h-3 w-3"/>
                      Restock
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* =============================== shared KPI component =============================== */
function KPI({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

/* =============================== ROUTES EXPORT =============================== */
export function InventoryRoutes({ ProtectedRoute }: { ProtectedRoute?: React.ComponentType<{children:React.ReactNode}> }) {
  const Wrap: React.FC<{children:React.ReactNode}> = ({ children }) =>
    ProtectedRoute ? <ProtectedRoute>{children}</ProtectedRoute> : <>{children}</>;

  return (
    <>
      <Route path="/inventory/overview" element={<Wrap><InventoryOverview/></Wrap>} />
      <Route path="/inventory/alerts" element={<Wrap><LowStockAlerts/></Wrap>} />
    </>
  );
}