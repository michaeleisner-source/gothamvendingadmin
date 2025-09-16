import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } },
      }
    );

    // Parse query parameters
    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get('days') || '30');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get sales data
    const { data: sales, error } = await supabase
      .from('sales')
      .select(`
        id,
        machine_id,
        product_id,
        qty,
        unit_price_cents,
        occurred_at,
        products(name, sku),
        machines(name)
      `)
      .gte('occurred_at', startDate.toISOString())
      .lte('occurred_at', endDate.toISOString())
      .order('occurred_at', { ascending: false });

    if (error) {
      console.error('Sales query error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate summary metrics
    const totalRevenue = sales?.reduce((sum, sale) => sum + (sale.qty * sale.unit_price_cents), 0) || 0;
    const totalTransactions = sales?.length || 0;
    const totalQuantity = sales?.reduce((sum, sale) => sum + sale.qty, 0) || 0;

    return new Response(JSON.stringify({
      summary: {
        days,
        totalRevenue: totalRevenue,
        totalTransactions,
        totalQuantity,
        averageTransactionValue: totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0
      },
      rows: sales || [],
      message: totalTransactions === 0 ? 'No recent sales found.' : `Found ${totalTransactions} sales in last ${days} days`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in reports-sales-summary:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});