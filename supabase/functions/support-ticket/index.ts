import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withAuthOrDemo, json, admin } from "../_shared/guards.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  return withAuthOrDemo(
    async ({ req, user, demo }) => {
      try {
        const body = await req.json().catch(() => ({}));
        
        // Basic validation and sanitization
        const clean = (x: any) => String(x || "").replace(/<[^>]*>/g, "").slice(0, 2000);
        const email = clean(body.email);
        const subject = clean(body.subject);
        const ticketBody = clean(body.body);

        // Validate required fields
        if (!email || !subject || !ticketBody) {
          return new Response(
            JSON.stringify({ error: 'Email, subject, and body are required' }), 
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (demo) {
          console.log('Demo support ticket submission:', { email, subject });
          return new Response(
            JSON.stringify({ ok: true, stored: false, demo: true }), 
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Insert support ticket
        const { error } = await admin.from("support_tickets").insert({
          org_id: body.org_id || null,
          email: email,
          subject: subject,
          body: ticketBody,
          status: 'open'
        });

        if (error) {
          console.error('Support ticket insertion error:', error);
          return new Response(
            JSON.stringify({ error: error.message }), 
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Support ticket created successfully for:', email);
        return new Response(
          JSON.stringify({ ok: true, stored: true }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (error) {
        console.error('Error in support-ticket function:', error);
        return new Response(
          JSON.stringify({ error: 'Internal server error' }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    },
    { allowDemo: true }
  )(req);
});