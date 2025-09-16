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

    const { scope = 'full' } = await req.json().catch(() => ({}));

    const checks = [];
    let overallResult = 'ok';

    // Helper function to add check results
    const addCheck = (name: string, query: Promise<any>, description: string) => {
      return query.then(({ data, error }) => {
        const passed = !error && data;
        if (!passed && overallResult === 'ok') overallResult = 'warning';
        
        checks.push({
          name,
          description,
          status: passed ? 'pass' : 'fail',
          details: error?.message || `Found ${Array.isArray(data) ? data.length : data ? 1 : 0} records`,
          timestamp: new Date().toISOString()
        });
      }).catch(err => {
        if (overallResult === 'ok') overallResult = 'error';
        checks.push({
          name,
          description,
          status: 'error',
          details: err.message,
          timestamp: new Date().toISOString()
        });
      });
    };

    // Run audit checks
    const auditPromises = [
      addCheck('organizations_exist', 
        supabase.from('organizations').select('id').limit(1), 
        'Check if organizations table has data'
      ),
      
      addCheck('products_exist', 
        supabase.from('products').select('id').limit(1), 
        'Check if products table has data'
      ),
      
      addCheck('locations_exist', 
        supabase.from('locations').select('id').limit(1), 
        'Check if locations table has data'
      ),
      
      addCheck('machines_exist', 
        supabase.from('machines').select('id').limit(1), 
        'Check if machines table has data'
      ),
      
      addCheck('recent_sales', 
        supabase.from('sales')
          .select('id')
          .gte('occurred_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .limit(1), 
        'Check for sales in the last 7 days'
      )
    ];

    // Wait for all checks to complete
    await Promise.all(auditPromises);

    // Additional scope-specific checks
    if (scope === 'smoke') {
      await addCheck('qa_entities', 
        supabase.from('products').select('id').eq('sku', 'QA-SODA-12').limit(1),
        'Check for QA smoke test entities'
      );
    }

    return new Response(JSON.stringify({
      result: overallResult,
      timestamp: new Date().toISOString(),
      scope,
      summary: {
        total: checks.length,
        passed: checks.filter(c => c.status === 'pass').length,
        failed: checks.filter(c => c.status === 'fail').length,
        errors: checks.filter(c => c.status === 'error').length
      },
      checks
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in audit-run:', error);
    return new Response(JSON.stringify({ 
      result: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});