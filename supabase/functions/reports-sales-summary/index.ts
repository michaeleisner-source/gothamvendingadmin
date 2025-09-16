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

    // Parse request body
    const body = await req.json().catch(() => ({}));
    
    let startDate, endDate;
    
    if (body.startDate && body.endDate) {
      // Use provided date range
      startDate = new Date(body.startDate);
      endDate = new Date(body.endDate);
    } else {
      // Fall back to days-based approach
      const days = parseInt(body.days || '30');
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
    }

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return new Response(JSON.stringify({ error: 'Invalid date format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
    
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) || 1;

    return new Response(JSON.stringify({
      summary: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        days: daysDiff,
        totalRevenue: totalRevenue,
        totalTransactions,
        totalQuantity,
        averageTransactionValue: totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0
      },
      rows: sales || [],
      message: totalTransactions === 0 ? 'No sales found in date range.' : `Found ${totalTransactions} sales from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`
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