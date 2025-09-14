import { supabase } from "@/integrations/supabase/client";

// Extended help analytics with escalation logging for complex queries
export async function logHelpEscalation(q: string, contextPage?: string, ticketId?: string) {
  try {
    const { error } = await supabase.rpc('rpc_log_help_escalation', {
      _q: q,
      _context: contextPage || window.location.pathname,
      _ticket: ticketId || null
    });
    if (error) console.error('logHelpEscalation error', error);
  } catch (error) {
    console.error('logHelpEscalation error', error);
  }
}

export async function refreshHelpBacklog(daysBack: number = 90) {
  try {
    const { error } = await supabase.rpc('rpc_refresh_help_backlog', { days_back: daysBack });
    if (error) console.error('refreshHelpBacklog error', error);
    return !error;
  } catch (error) {
    console.error('refreshHelpBacklog error', error);
    return false;
  }
}