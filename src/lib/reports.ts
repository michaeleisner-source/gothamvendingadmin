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

function rnd(min: number, max: number) { return Math.random() * (max - min) + min; }
function pick<T>(arr: T[]) { return arr[Math.floor(Math.random() * arr.length)] as T; }
function money(n: number) { return Math.round(n * 100) / 100; }

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
      return machines.map((code, i) => {
        const revenue = rnd(120, 620);
        const cogs = revenue * rnd(0.45, 0.62);
        const profit = revenue - cogs;
        return {
          machine_id: code, machine_code: code,
          location_name: locs[i],
          revenue: money(revenue), cogs: money(cogs), profit: money(profit),
          profit_pct: profit / revenue, orders: Math.floor(revenue / rnd(3, 6)),
          units: Math.floor(revenue / rnd(1.8, 3.0)),
        };
      });
    }
    case 'reports-products': {
      const products = [
        ['Snickers', 'Candy'], ['Twix', 'Candy'], ['Coke Zero', 'Beverage'],
        ['Pepsi', 'Beverage'], ["Lay's BBQ", 'Chips'], ['Doritos Nacho', 'Chips']
      ];
      return products.map(([name, cat]) => {
        const units = Math.floor(rnd(40, 240));
        const price = rnd(1.5, 3.5);
        const cost  = price * rnd(0.4, 0.65);
        const revenue = units * price;
        const cogs    = units * cost;
        return {
          product_id: name.toLowerCase().replace(/\s+/g,'-'),
          product_name: name, category: cat,
          revenue: money(revenue), cogs: money(cogs),
          profit: money(revenue - cogs), profit_pct: (revenue - cogs) / revenue,
          units, velocity_per_day: units / d,
        };
      });
    }
    case 'reports-locations': {
      const locs = ['Downtown Gym','Midtown Offices','River Mall','Tech Park','U Campus'];
      return locs.map((name) => {
        const machines = Math.floor(rnd(1, 5));
        const rev = rnd(200, 1600);
        const cogs = rev * rnd(0.45, 0.62);
        const profit = rev - cogs;
        return {
          location_id: name.toLowerCase().replace(/\s+/g,'-'),
          location_name: name,
          machines,
          revenue: money(rev), cogs: money(cogs), profit: money(profit),
          profit_pct: profit / rev,
          revenue_per_machine: money(rev / machines),
        };
      });
    }
    case 'reports-trends': {
      const group = body?.group ?? 'daily';
      const points = Math.min(90, d);
      const out = [];
      for (let i = points - 1; i >= 0; i--) {
        const revenue = rnd(80, 260);
        const cogs = revenue * rnd(0.45, 0.62);
        out.push({
          date: new Date(Date.now() - i * 86400000).toISOString(),
          revenue: money(revenue),
          units: Math.floor(revenue / rnd(1.8, 3.2)),
          profit: money(revenue - cogs),
          group,
        });
      }
      return out;
    }
    case 'reports-stockouts': {
      const rows = [
        ['M-001','Downtown Gym','Snickers'],
        ['M-101','River Mall','Coke Zero'],
        ['M-202','Tech Park','Doritos Nacho']
      ];
      return rows.map(([machine, loc, prod]) => {
        const current = Math.floor(rnd(0, 20));
        const vel = rnd(0.5, 3.5);
        const dts = current ? Math.max(0, Math.floor(current / vel)) : 0;
        return {
          machine_id: machine, machine_code: machine,
          location_name: loc,
          product_id: prod.toLowerCase().replace(/\s+/g,'-'),
          product_name: prod,
          par_level: 30,
          current_qty: current,
          velocity_per_day: vel,
          days_to_stockout: dts,
          restock_by: new Date(Date.now() + dts * 86400000).toISOString(),
        };
      });
    }
    case 'reports-sales-detail': {
      const prods = ['Snickers','Twix','Coke Zero','Pepsi',"Lay's BBQ",'Doritos Nacho'];
      const machs = ['M-001','M-002','M-101','M-202','M-303'];
      const locs  = ['Downtown Gym','Midtown Offices','River Mall','Tech Park','U Campus'];
      const rows: any[] = [];
      const n = Math.min(250, 8 * d);
      for (let i = 0; i < n; i++) {
        const product = pick(prods);
        const machine = pick(machs);
        const loc = pick(locs);
        const qty = Math.floor(rnd(1, 3));
        const price = rnd(1.5, 3.5);
        const cost  = price * rnd(0.4, 0.65);
        rows.push({
          id: `sale_${i}`,
          ts: new Date(Date.now() - rnd(0, d) * 86400000).toISOString(),
          machine_id: machine, machine_code: machine,
          location_name: loc,
          product_id: product.toLowerCase().replace(/\s+/g,'-'),
          product_name: product,
          qty, price: money(price), cost: money(cost),
          revenue: money(qty * price), cogs: money(qty * cost),
        });
      }
      return rows.sort((a,b) => (a.ts < b.ts ? 1 : -1));
    }
    default:
      return { ok: true, note: `No mock for ${fn}` };
  }
}