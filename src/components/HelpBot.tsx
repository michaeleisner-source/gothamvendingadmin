import React, { useState } from 'react';
import { MessageCircle, HelpCircle, X, Search, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function HelpBot() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<any[]>([]);

  const ask = async () => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('search_help', { q, limit_count: 5 });
      if (!error) setAnswers(data || []);
    } catch (error) {
      console.error('Error searching help:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      ask();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 size-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors flex items-center justify-center"
        aria-label="Open HelpBot"
      >
        <MessageCircle className="size-5" />
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-lg border border-border bg-card shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <HelpCircle className="size-4 text-primary" />
                <span className="text-sm font-semibold">HelpBot</span>
              </div>
              <button 
                onClick={() => setOpen(false)} 
                className="size-8 rounded-md hover:bg-muted flex items-center justify-center transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-border">
              <div className="relative">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask how to do anything… (e.g., 'convert a prospect' or 'set up a machine')"
                  className="w-full rounded-lg border border-border bg-background px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <button 
                  onClick={ask}
                  disabled={!q.trim() || loading}
                  className="absolute right-2 top-1.5 px-3 py-1 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-4 flex items-center gap-2 text-muted-foreground">
                  <div className="animate-spin size-4 border-2 border-primary border-t-transparent rounded-full" />
                  Searching…
                </div>
              ) : answers.length === 0 ? (
                <div className="p-4 text-muted-foreground text-sm text-center">
                  <div className="space-y-2">
                    <p>Type a question to see step-by-step guides and articles.</p>
                    <div className="text-xs">
                      Try: "How do I convert a prospect?" or "Machine setup steps"
                    </div>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {answers.map((r) => (
                    <div key={`${r.source}-${r.id}`} className="p-3">
                      <a 
                        href={r.url} 
                        className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                        onClick={() => setOpen(false)}
                      >
                        {r.title}
                      </a>
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {r.snippet}
                      </div>
                      <div className="mt-2">
                        <a 
                          href={r.url} 
                          className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                          onClick={() => setOpen(false)}
                        >
                          Open step-by-step guide 
                          <ChevronRight className="size-3"/>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}