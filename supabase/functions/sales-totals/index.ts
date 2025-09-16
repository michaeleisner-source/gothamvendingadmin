import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withAuthOrDemo, json, admin } from "../_shared/guards.ts";

type Body = { startISO?: string; endISO?: string; days?: number };

function mockTotals(days = 30) {
  const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
  const f = clamp(days, 1, 365) / 30;
  const units = Math.round(400 * f + Math.random() * 300 * f);
  const revenue = +(units * (1.8 + Math.random() * 1.4)).toFixed(2);
  const cogs = +(revenue * (0.45 + Math.random() * 0.15)).toFixed(2);
  const orders = Math.round(units * (0.7 + Math.random() * 0.25));
  return { revenue, cogs, units, orders };
}

async function getRealTotals(userId: string, body: Body) {
  const { startISO, endISO, days = 30 } = body;
  
  try {
    // Get user's org_id first
    const { data: profile } = await admin
      .from('profiles')
      .select('org_id')
      .eq('id', userId)
      .single();
    
    if (!profile?.org_id) {
      throw new Error('User org not found');
    }

    // Calculate date range
    let startDate: string;
    let endDate: string;
    
    if (startISO && endISO) {
      startDate = startISO;
      endDate = endISO;
    } else {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - days);
      startDate = start.toISOString();
      endDate = end.toISOString();
    }

    // Query sales data
    const { data: salesData, error } = await admin
      .from('sales')
      .select(`
        qty,
        unit_price_cents,
        unit_cost_cents,
        product_id,
        products!inner(cost_cents)
      `)
      .eq('org_id', profile.org_id)
      .gte('occurred_at', startDate)
      .lte('occurred_at', endDate);

    if (error) {
      console.error('Sales query error:', error);
      throw error;
    }

    // Calculate totals
    let totalRevenueCents = 0;
    let totalCogsCents = 0;
    let totalUnits = 0;
    let totalOrders = salesData?.length || 0;

    if (salesData) {
      for (const sale of salesData) {
        const qty = sale.qty || 0;
        const priceCents = sale.unit_price_cents || 0;
        const costCents = sale.unit_cost_cents || sale.products?.cost_cents || 0;
        
        totalUnits += qty;
        totalRevenueCents += qty * priceCents;
        totalCogsCents += qty * costCents;
      }
    }

    return {
      revenue: (totalRevenueCents / 100).toFixed(2),
      cogs: (totalCogsCents / 100).toFixed(2),
      units: totalUnits,
      orders: totalOrders
    };

  } catch (error) {
    console.error('Error fetching real totals:', error);
    // Fallback to zero values on error
    return { revenue: "0.00", cogs: "0.00", units: 0, orders: 0 };
  }
}

serve(
  withAuthOrDemo(
    async ({ req, user, demo }) => {
      try {
        const body = (await req.json().catch(() => ({}))) as Body;
        const days = body.days ?? 30;

        if (demo) {
          return json(mockTotals(days));
        }

        // Get real totals for authenticated user
        const totals = await getRealTotals(user.id, body);
        return json(totals);

      } catch (error) {
        console.error('Error in sales-totals function:', error);
        return json({ error: 'Internal server error' }, 500);
      }
    },
    { allowDemo: true }
  )
);