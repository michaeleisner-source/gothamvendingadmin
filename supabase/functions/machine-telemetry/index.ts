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
      telemetry_data,
      recorded_at 
    } = await req.json();

    console.log('Received telemetry data:', { machine_id, org_id, telemetry_data });

    // Validate required fields
    if (!machine_id || !org_id || !telemetry_data) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: machine_id, org_id, telemetry_data' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert telemetry data
    const { error: telemetryError } = await supabase
      .from('machine_telemetry')
      .insert({
        machine_id,
        org_id,
        recorded_at: recorded_at || new Date().toISOString(),
        temperature: telemetry_data.temperature,
        cash_level_cents: telemetry_data.cash_level_cents,
        network_status: telemetry_data.network_status || 'online',
        error_codes: telemetry_data.error_codes || [],
        last_sale_at: telemetry_data.last_sale_at,
        coin_jam_count: telemetry_data.coin_jam_count || 0,
        bill_jam_count: telemetry_data.bill_jam_count || 0,
        door_open_alerts: telemetry_data.door_open_alerts || 0,
        power_cycles: telemetry_data.power_cycles || 0
      });

    if (telemetryError) {
      console.error('Error inserting telemetry:', telemetryError);
      return new Response(
        JSON.stringify({ error: 'Failed to insert telemetry data' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process alerts if needed
    if (telemetry_data.error_codes && telemetry_data.error_codes.length > 0) {
      const { error: alertError } = await supabase
        .from('machine_health_alerts')
        .insert({
          machine_id,
          org_id,
          alert_type: 'error_code',
          severity: 'high',
          title: `Machine Error Detected`,
          description: `Error codes: ${telemetry_data.error_codes.join(', ')}`,
          triggered_at: new Date().toISOString()
        });

      if (alertError) {
        console.error('Error creating alert:', alertError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Telemetry data processed successfully' 
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing telemetry:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});