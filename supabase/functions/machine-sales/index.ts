import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      machine_id, 
      org_id,
      sales_data,
      occurred_at 
    } = await req.json();

    console.log('Received sales data:', { machine_id, org_id, sales_data });

    // Validate required fields
    if (!machine_id || !org_id || !sales_data) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: machine_id, org_id, sales_data' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process multiple sales if array, single sale if object
    const salesArray = Array.isArray(sales_data) ? sales_data : [sales_data];
    const results = [];

    for (const sale of salesArray) {
      // Insert sale record
      const { data: saleRecord, error: saleError } = await supabase
        .from('sales')
        .insert({
          machine_id,
          org_id,
          product_id: sale.product_id,
          qty: sale.qty || 1,
          unit_price_cents: sale.unit_price_cents,
          unit_cost_cents: sale.unit_cost_cents,
          occurred_at: occurred_at || sale.occurred_at || new Date().toISOString(),
          source: 'machine_api',
          payment_method: sale.payment_method || 'unknown'
        })
        .select()
        .single();

      if (saleError) {
        console.error('Error inserting sale:', saleError);
        results.push({ 
          product_id: sale.product_id, 
          error: 'Failed to insert sale',
          details: saleError.message 
        });
        continue;
      }

      // Record customer interaction if payment method provided
      if (sale.payment_method) {
        const { error: interactionError } = await supabase
          .from('customer_interactions')
          .insert({
            machine_id,
            org_id,
            interaction_type: 'sale',
            product_id: sale.product_id,
            amount_cents: sale.unit_price_cents,
            payment_method: sale.payment_method,
            occurred_at: occurred_at || sale.occurred_at || new Date().toISOString(),
            session_duration_seconds: sale.session_duration_seconds
          });

        if (interactionError) {
          console.error('Error recording interaction:', interactionError);
        }
      }

      results.push({ 
        product_id: sale.product_id, 
        success: true, 
        sale_id: saleRecord.id 
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${results.length} sales`,
        results 
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing sales:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});