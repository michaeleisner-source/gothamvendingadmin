import { supabase } from '@/integrations/supabase/client';
import { isDemoMode, getAuthHeaders } from '@/lib/auth';

/** Call a Supabase Edge Function; if demo mode or it fails, return mock data. */
export async function invokeReport<T = any>(fn: string, body: any): Promise<{ data: T; error?: any }> {
  const demo = isDemoMode();
  const tryReal = async () => {
    const headers = await getAuthHeaders();
    return supabase.functions.invoke(fn, { body, headers });
  };

  if (!demo) {
    // normal mode → just call backend
    return tryReal();
  }

  // DEMO: first try real (in case your backend allows anon), else fall back to mocks
  try {
    const res = await tryReal();
    if (!res.error) return res;
  } catch (_) { /* ignore */ }

  // Fallback to mock
  const data = mockResponse(fn, body);
  return { data, error: undefined } as any;
}

// ---------- MOCKS (demo mode only) ----------

function daysFrom(body: any) {
  if (typeof body?.days === 'number') return Math.max(1, Math.min(365, body.days));
  const start = body?.startISO ? new Date(body.startISO).getTime() : Date.now() - 30 * 86400000;
  const end   = body?.endISO ? new Date(body.endISO).getTime()   : Date.now();
  return Math.max(1, Math.round((end - start) / 86400000));
}

function rnd(min: number, max: number) { 
  return Math.random() * (max - min) + min; 
}

function pick<T>(arr: T[]) { 
  return arr[Math.floor(Math.random() * arr.length)] as T; 
}

function money(n: number) { 
  return Math.round(n * 100) / 100; 
}

function mockResponse(fn: string, body: any) {
  const d = daysFrom(body);
  
  switch (fn) {
    case 'reports-sales-summary': {
      const units = Math.floor(rnd(200 * d/30, 900 * d/30));
      const orders = Math.floor(units * rnd(0.7, 0.95));
      const revenue = money(units * rnd(1.8, 3.2));
      const cogs = money(revenue * rnd(0.45, 0.62));
      return { revenue, cogs, units, orders };
    }

    case 'reports-machines': {
      const machines = ['M-001','M-002','M-101','M-202','M-303','M-404'];
      const locs = ['Downtown Gym','Midtown Offices','River Mall','Tech Park','U Campus','Metro Hub'];
      return {
        rows: machines.map((code, i) => {
          const revenue = money(rnd(120 * d/30, 620 * d/30));
          const cogs = money(revenue * rnd(0.45, 0.62));
          const profit = money(revenue - cogs);
          const margin = revenue > 0 ? profit / revenue : 0;
          const orders = Math.floor(rnd(20 * d/30, 80 * d/30));
          const units = Math.floor(orders * rnd(1.1, 1.8));
          return {
            machine_id: `machine-${i+1}`,
            machine_code: code,
            location_name: locs[i % locs.length],
            revenue,
            cogs,
            profit,
            margin,
            orders,
            units
          };
        })
      };
    }

    case 'reports-products': {
      const products = [
        'Coca Cola 12oz', 'Pepsi 12oz', 'Sprite 12oz', 'Dr Pepper 12oz',
        'Snickers Bar', 'Kit Kat Bar', 'Doritos Chips', 'Cheetos Puffs',
        'Dasani Water', 'Smart Water', 'Red Bull Energy', 'Monster Energy'
      ];
      const categories = ['Beverages', 'Beverages', 'Beverages', 'Beverages', 
                         'Snacks', 'Snacks', 'Snacks', 'Snacks',
                         'Water', 'Water', 'Energy', 'Energy'];
      return {
        rows: products.map((name, i) => {
          const units = Math.floor(rnd(50 * d/30, 300 * d/30));
          const revenue = money(units * rnd(1.25, 2.75));
          const cogs = money(revenue * rnd(0.4, 0.65));
          const profit = money(revenue - cogs);
          const margin = revenue > 0 ? profit / revenue : 0;
          const velocity = units / Math.max(1, d);
          return {
            product_id: `product-${i+1}`,
            product_name: name,
            category: categories[i % categories.length],
            revenue,
            cogs,
            profit,
            margin,
            units,
            velocity_per_day: money(velocity)
          };
        })
      };
    }

    case 'reports-locations': {
      const locations = ['Downtown Gym','Midtown Offices','River Mall','Tech Park','U Campus','Metro Hub'];
      return {
        rows: locations.map((name, i) => {
          const machines = Math.floor(rnd(2, 8));
          const revenue = money(rnd(300 * d/30, 1200 * d/30) * machines);
          const cogs = money(revenue * rnd(0.45, 0.6));
          const profit = money(revenue - cogs);
          const margin = revenue > 0 ? profit / revenue : 0;
          const revenuePerMachine = machines > 0 ? money(revenue / machines) : 0;
          return {
            location_id: `location-${i+1}`,
            location_name: name,
            machine_count: machines,
            revenue,
            cogs,
            profit,
            margin,
            revenue_per_machine: revenuePerMachine
          };
        })
      };
    }

    case 'reports-trends': {
      const group = body?.group || 'daily';
      const periodsPerDay = group === 'daily' ? 1 : (group === 'weekly' ? 1/7 : 1/30);
      const periods = Math.max(1, Math.floor(d * periodsPerDay));
      
      return {
        rows: Array.from({ length: periods }, (_, i) => {
          const date = new Date();
          if (group === 'daily') {
            date.setDate(date.getDate() - periods + i + 1);
          } else if (group === 'weekly') {
            date.setDate(date.getDate() - (periods - i) * 7);
          } else {
            date.setMonth(date.getMonth() - periods + i + 1);
          }
          
          const revenue = money(rnd(80, 400));
          const units = Math.floor(rnd(30, 150));
          const cogs = money(revenue * rnd(0.45, 0.6));
          const profit = money(revenue - cogs);
          
          return {
            date: date.toISOString().split('T')[0],
            revenue,
            units,
            profit
          };
        })
      };
    }

    case 'reports-stockouts': {
      const machines = ['M-001','M-002','M-101','M-202'];
      const locations = ['Downtown Gym','River Mall','Tech Park','U Campus'];
      const products = ['Coca Cola 12oz', 'Snickers Bar', 'Doritos Chips', 'Dasani Water'];
      
      return {
        rows: Array.from({ length: rnd(3, 8) }, (_, i) => {
          const currentQty = Math.floor(rnd(0, 5));
          const parLevel = Math.floor(rnd(8, 15));
          const velocity = rnd(0.5, 3);
          const daysToStockout = velocity > 0 ? Math.floor(currentQty / velocity) : 999;
          const restockDate = new Date();
          restockDate.setDate(restockDate.getDate() + daysToStockout);
          
          return {
            machine_id: `machine-${i+1}`,
            machine_code: pick(machines),
            location_name: pick(locations),
            product_id: `product-${i+1}`,
            product_name: pick(products),
            par_level: parLevel,
            current_qty: currentQty,
            velocity_per_day: money(velocity),
            days_to_stockout: daysToStockout,
            restock_by: restockDate.toISOString().split('T')[0]
          };
        })
      };
    }

    default:
      console.warn(`No mock data for function: ${fn}`);
      return { message: `Mock data for ${fn} not implemented` };
  }
}