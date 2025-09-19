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
      status_data,
      timestamp
    } = await req.json();

    console.log('Received status update:', { machine_id, org_id, status: status_data?.status });

    // Validate required fields
    if (!machine_id || !org_id || !status_data) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: machine_id, org_id, status_data' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update machine status
    const { error: machineError } = await supabase
      .from('machines')
      .update({
        status: status_data.status || 'online',
        last_heartbeat: timestamp || new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', machine_id)
      .eq('org_id', org_id);

    if (machineError) {
      console.error('Error updating machine status:', machineError);
      return new Response(
        JSON.stringify({ error: 'Failed to update machine status' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record performance metrics if provided
    if (status_data.metrics) {
      const metrics = status_data.metrics;
      const { error: metricsError } = await supabase
        .from('machine_performance_metrics')
        .insert({
          machine_id,
          org_id,
          metric_date: new Date().toISOString().split('T')[0],
          total_transactions: metrics.total_transactions || 0,
          failed_transactions: metrics.failed_transactions || 0,
          total_sales_cents: metrics.total_sales_cents || 0,
          cash_collected_cents: metrics.cash_collected_cents || 0,
          products_dispensed: metrics.products_dispensed || 0,
          uptime_minutes: metrics.uptime_minutes || 0,
          downtime_minutes: metrics.downtime_minutes || 0,
          energy_consumption_kwh: metrics.energy_consumption_kwh,
          temperature_avg: metrics.temperature_avg
        });

      if (metricsError) {
        console.error('Error recording metrics:', metricsError);
      }
    }

    // Handle status changes and alerts
    const alertsToCreate = [];

    if (status_data.status === 'offline' || status_data.status === 'error') {
      alertsToCreate.push({
        machine_id,
        org_id,
        alert_type: 'machine_offline',
        severity: status_data.status === 'error' ? 'high' : 'medium',
        title: `Machine ${status_data.status === 'error' ? 'Error' : 'Offline'}`,
        description: status_data.error_message || `Machine is currently ${status_data.status}`,
        triggered_at: timestamp || new Date().toISOString()
      });
    }

    // Check for maintenance needs
    if (status_data.maintenance_required) {
      alertsToCreate.push({
        machine_id,
        org_id,
        alert_type: 'maintenance_required',
        severity: 'medium',
        title: 'Maintenance Required',
        description: status_data.maintenance_message || 'Machine requires scheduled maintenance',
        triggered_at: timestamp || new Date().toISOString()
      });
    }

    // Create alerts if any
    if (alertsToCreate.length > 0) {
      const { error: alertsError } = await supabase
        .from('machine_health_alerts')
        .insert(alertsToCreate);

      if (alertsError) {
        console.error('Error creating alerts:', alertsError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Machine status updated successfully',
        alerts_created: alertsToCreate.length
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing status update:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});