import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withAuthOrDemo, json, admin } from "../_shared/guards.ts";

type Row = {
  product_id: string; 
  product_name: string; 
  category: string;
  revenue: number; 
  cogs: number; 
  profit: number; 
  profit_pct: number;
  units: number; 
  velocity_per_day: number;
};

type Body = { startISO?: string; endISO?: string; days?: number };

function mockProducts(days = 30): Row[] {
  const data = [
    ["Snickers", "Candy"], ["Twix", "Candy"], ["Coke Zero", "Beverage"],
    ["Pepsi", "Beverage"], ["Lay's BBQ", "Chips"], ["Doritos Nacho", "Chips"]
  ];
  const f = Math.max(1, Math.min(365, days)) / 30;
  return data.map(([name, cat]) => {
    const units = Math.round((60 + Math.random() * 200) * f);
    const price = 1.8 + Math.random() * 1.7;
    const cost = price * (0.45 + Math.random() * 0.15);
    const revenue = +(units * price).toFixed(2);
    const cogs = +(units * cost).toFixed(2);
    const profit = +(revenue - cogs).toFixed(2);
    return {
      product_id: name.toLowerCase().replace(/\s+/g, '-'),
      product_name: name,
      category: cat,
      revenue,
      cogs,
      profit,
      profit_pct: +(profit / (revenue || 1)).toFixed(4),
      units,
      velocity_per_day: +(units / (30 * f)).toFixed(2),
    };
  });
}

async function getRealProductPerformance(userId: string, body: Body): Promise<Row[]> {
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

    // Query sales data grouped by product
    const { data: salesData, error } = await admin
      .from('sales')
      .select(`
        product_id,
        qty,
        unit_price_cents,
        unit_cost_cents,
        products!inner(
          name,
          category,
          cost_cents
        )
      `)
      .eq('org_id', profile.org_id)
      .gte('occurred_at', startDate)
      .lte('occurred_at', endDate);

    if (error) {
      console.error('Product performance query error:', error);
      throw error;
    }

    // Group and calculate metrics by product
    const productMap = new Map<string, {
      product_id: string;
      product_name: string;
      category: string;
      total_units: number;
      total_revenue_cents: number;
      total_cogs_cents: number;
    }>();

    if (salesData) {
      for (const sale of salesData) {
        const productId = sale.product_id;
        const qty = sale.qty || 0;
        const priceCents = sale.unit_price_cents || 0;
        const costCents = sale.unit_cost_cents || sale.products?.cost_cents || 0;
        
        if (!productMap.has(productId)) {
          productMap.set(productId, {
            product_id: productId,
            product_name: sale.products?.name || 'Unknown Product',
            category: sale.products?.category || 'Uncategorized',
            total_units: 0,
            total_revenue_cents: 0,
            total_cogs_cents: 0,
          });
        }

        const product = productMap.get(productId)!;
        product.total_units += qty;
        product.total_revenue_cents += qty * priceCents;
        product.total_cogs_cents += qty * costCents;
      }
    }

    // Convert to final format
    const result: Row[] = Array.from(productMap.values()).map(product => {
      const revenue = product.total_revenue_cents / 100;
      const cogs = product.total_cogs_cents / 100;
      const profit = revenue - cogs;
      const profit_pct = revenue > 0 ? profit / revenue : 0;
      const velocity_per_day = product.total_units / days;

      return {
        product_id: product.product_id,
        product_name: product.product_name,
        category: product.category,
        revenue: +revenue.toFixed(2),
        cogs: +cogs.toFixed(2),
        profit: +profit.toFixed(2),
        profit_pct: +profit_pct.toFixed(4),
        units: product.total_units,
        velocity_per_day: +velocity_per_day.toFixed(2),
      };
    });

    // Sort by revenue descending
    return result.sort((a, b) => b.revenue - a.revenue);

  } catch (error) {
    console.error('Error fetching product performance:', error);
    return [];
  }
}

serve(
  withAuthOrDemo(
    async ({ req, user, demo }) => {
      try {
        const body = (await req.json().catch(() => ({}))) as Body;
        const days = body.days ?? 30;

        if (demo) {
          return json(mockProducts(days));
        }

        // Get real product performance for authenticated user
        const products = await getRealProductPerformance(user.id, body);
        return json(products);

      } catch (error) {
        console.error('Error in product-performance function:', error);
        return json({ error: 'Internal server error' }, 500);
      }
    },
    { allowDemo: true }
  )
);