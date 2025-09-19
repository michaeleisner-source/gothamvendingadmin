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
      inventory_data,
      sync_type = 'full' // 'full' or 'delta'
    } = await req.json();

    console.log('Received inventory sync:', { machine_id, org_id, sync_type, slots: inventory_data?.length });

    // Validate required fields
    if (!machine_id || !org_id || !inventory_data) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: machine_id, org_id, inventory_data' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];
    const lowStockAlerts = [];

    for (const slot of inventory_data) {
      try {
        // Upsert inventory levels
        const { data: updatedLevel, error: levelError } = await supabase
          .from('inventory_levels')
          .upsert({
            machine_id,
            org_id,
            slot_id: slot.slot_id,
            product_id: slot.product_id,
            current_qty: slot.current_qty,
            par_level: slot.par_level || 10,
            reorder_point: slot.reorder_point || 3,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'slot_id'
          })
          .select()
          .single();

        if (levelError) {
          console.error('Error updating inventory level:', levelError);
          results.push({
            slot_id: slot.slot_id,
            error: 'Failed to update inventory',
            details: levelError.message
          });
          continue;
        }

        // Check for low stock alerts
        if (slot.current_qty <= (slot.reorder_point || 3)) {
          lowStockAlerts.push({
            machine_id,
            org_id,
            slot_id: slot.slot_id,
            product_id: slot.product_id,
            current_qty: slot.current_qty,
            reorder_point: slot.reorder_point || 3
          });
        }

        // Record inventory transaction for audit trail
        const { error: transactionError } = await supabase
          .from('inventory_transactions')
          .insert({
            machine_id,
            org_id,
            slot_id: slot.slot_id,
            product_id: slot.product_id,
            qty_change: 0, // This is a sync, not a change
            reason: 'machine_sync',
            ref_type: 'telemetry',
            occurred_at: new Date().toISOString()
          });

        if (transactionError) {
          console.error('Error recording transaction:', transactionError);
        }

        results.push({
          slot_id: slot.slot_id,
          success: true,
          current_qty: slot.current_qty,
          low_stock: slot.current_qty <= (slot.reorder_point || 3)
        });

      } catch (error) {
        console.error('Error processing slot:', error);
        results.push({
          slot_id: slot.slot_id,
          error: 'Processing failed',
          details: error.message
        });
      }
    }

    // Create low stock alerts if any
    if (lowStockAlerts.length > 0) {
      const { error: alertError } = await supabase
        .from('machine_health_alerts')
        .insert({
          machine_id,
          org_id,
          alert_type: 'low_stock',
          severity: 'medium',
          title: `Low Stock Alert: ${lowStockAlerts.length} slots need restocking`,
          description: `Slots with low inventory: ${lowStockAlerts.map(a => a.slot_id).join(', ')}`,
          triggered_at: new Date().toISOString()
        });

      if (alertError) {
        console.error('Error creating low stock alert:', alertError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${results.length} inventory slots`,
        low_stock_count: lowStockAlerts.length,
        results 
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing inventory sync:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});