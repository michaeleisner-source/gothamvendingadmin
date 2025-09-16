import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withAuthOrDemo, json, redactFinancialRow, scrubContacts } from "../_shared/guards.ts";

serve(
  withAuthOrDemo(
    async ({ req, user, demo }) => {
      try {
        const body = await req.json().catch(() => ({}));
        const days = Math.max(1, Math.min(365, Number(body?.days ?? 30)));

        if (demo) {
          // mock rows (keep revenue, hide costs/profit, scrub IDs/contacts)
          const locs = ["Downtown Gym","Midtown Offices","Tech Park","River Mall","U Campus"];
          const rows = Array.from({ length: 6 }).map((_, i) => {
            const rev = +(120 + Math.random()*600).toFixed(2);
            return scrubContacts(redactFinancialRow({
              machine_id: `M-${100+i}`,
              machine_code: `M-${100+i}`,
              location_name: locs[i % locs.length],
              revenue: rev, 
              cogs: null, 
              profit: null, 
              profit_pct: null,
              orders: Math.round(rev / (3 + Math.random()*3)),
              units: Math.round(rev / (1.8 + Math.random()*1.4)),
            }));
          });
          return json(rows);
        }

        // TODO: real query returning same shape; DO NOT include contacts unless needed
        return json([]);

      } catch (error) {
        console.error('Error in machine-performance function:', error);
        return json({ error: 'Internal server error' }, 500);
      }
    },
    { allowDemo: true }
  )
);
