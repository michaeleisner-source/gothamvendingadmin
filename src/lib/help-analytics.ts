import { supabase } from "@/integrations/supabase/client";

// Help Center Analytics Instrumentation
export async function logHelpSearch(q: string, resultCount: number, contextPage?: string) {
  try {
    const { data, error } = await supabase.rpc('rpc_log_help_search', { 
      _q: q, 
      _count: resultCount, 
      _context: contextPage || null 
    });
    if (error) console.error('logHelpSearch error', error);
    return data as string | undefined; // returns search_event id
  } catch (error) {
    console.error('logHelpSearch error', error);
    return undefined;
  }
}

export async function logHelpClick(
  searchId: string | undefined, 
  source: 'article' | 'faq', 
  targetId: string, 
  rank: number
) {
  if (!targetId) return;
  try {
    const { error } = await supabase.rpc('rpc_log_help_click', { 
      _search_id: searchId || null, 
      _source: source, 
      _target: targetId, 
      _rank: rank 
    });
    if (error) console.error('logHelpClick error', error);
  } catch (error) {
    console.error('logHelpClick error', error);
  }
}

export async function logHelpFeedback(articleId: string, helpful: boolean, comment?: string) {
  try {
    const { error } = await supabase.rpc('rpc_log_help_feedback', { 
      _article: articleId, 
      _helpful: helpful, 
      _comment: comment || null 
    });
    if (error) console.error('logHelpFeedback error', error);
  } catch (error) {
    console.error('logHelpFeedback error', error);
  }
}

export async function logHelpArticleView(articleId: string, dwellMs?: number) {
  try {
    const { error } = await supabase
      .from('help_article_views')
      .insert({
        article_id: articleId,
        dwell_ms: dwellMs || null,
        user_id: (await supabase.auth.getUser()).data.user?.id || null
      });
    if (error) console.error('logHelpArticleView error', error);
  } catch (error) {
    console.error('logHelpArticleView error', error);
  }
}

export async function startHelpBotSession() {
  try {
    const { data, error } = await supabase
      .from('help_bot_sessions')
      .insert({
        user_id: (await supabase.auth.getUser()).data.user?.id || null
      })
      .select('id')
      .single();
    if (error) console.error('startHelpBotSession error', error);
    return data?.id;
  } catch (error) {
    console.error('startHelpBotSession error', error);
    return undefined;
  }
}

export async function endHelpBotSession(sessionId: string, resolved: boolean, ticketId?: string) {
  try {
    const { error } = await supabase
      .from('help_bot_sessions')
      .update({
        ended_at: new Date().toISOString(),
        resolved,
        created_ticket_id: ticketId || null
      })
      .eq('id', sessionId);
    if (error) console.error('endHelpBotSession error', error);
  } catch (error) {
    console.error('endHelpBotSession error', error);
  }
}