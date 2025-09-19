import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import { HelpCircle, Search, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function HelpCenter() {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [articlesByCat, setArticlesByCat] = useState<Record<string, any[]>>({});

  useEffect(() => {
    (async () => {
      const { data: categories } = await supabase
        .from('help_categories')
        .select('id,name,slug,sort_order')
        .order('sort_order');
      setCats(categories || []);
      
      if (categories?.length) {
        const ids = categories.map((c: any) => c.id);
        const { data: articles } = await supabase
          .from('help_articles')
          .select('id,title,slug,category_id,updated_at')
          .in('category_id', ids)
          .order('updated_at', { ascending: false });
        
        const grouped: Record<string, any[]> = {};
        (articles || []).forEach((a: any) => {
          (grouped[a.category_id] ||= []).push(a);
        });
        setArticlesByCat(grouped);
      }
    })();
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!q || q.trim().length < 2) { 
        setResults([]); 
        return; 
      }
      setLoading(true);
      const { data, error } = await supabase.rpc('search_help', { q, limit_count: 12 });
      if (!error) setResults(data || []);
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <header className="flex items-center gap-3">
        <HelpCircle className="size-6 text-primary" />
        <h1 className="text-2xl font-bold">Help Center</h1>
      </header>

      {/* Search */}
      <div className="relative max-w-2xl">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search help articles, FAQs, and guides…"
          className="w-full rounded-lg border border-border bg-background px-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <Search className="absolute left-4 top-3.5 size-4 text-muted-foreground" />
      </div>

      {/* Results */}
      {q.trim().length >= 2 ? (
        <div className="rounded-lg border border-border bg-card">
          <div className="px-4 py-2 text-sm font-medium text-muted-foreground border-b border-border">
            Search Results
          </div>
          {loading ? (
            <div className="p-6 flex items-center gap-2 text-muted-foreground">
              <div className="animate-spin size-4 border-2 border-primary border-t-transparent rounded-full" />
              Searching…
            </div>
          ) : (
            <div className="divide-y divide-border">
              {(results || []).map((r) => (
                <Link
                  key={`${r.source}-${r.id}`}
                  to={r.url}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">{r.title}</div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.snippet}</div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground ml-2 flex-shrink-0" />
                </Link>
              ))}
              {(!loading && results?.length === 0) && (
                <div className="p-6 text-muted-foreground text-center">
                  No results found. Try broader terms.
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        // Category listing when not searching
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cats.map((c) => (
            <div key={c.id} className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 bg-muted/30 border-b border-border">
                <h3 className="text-sm font-semibold">{c.name}</h3>
              </div>
              <div className="divide-y divide-border">
                {(articlesByCat[c.id] || []).slice(0, 6).map((a) => (
                  <Link
                    key={a.id}
                    to={`/help/article/${a.id}`}
                    className="block px-4 py-2 hover:bg-muted/50 transition-colors text-sm"
                  >
                    {a.title}
                  </Link>
                ))}
                <Link
                  to={`/help?cat=${c.slug}`}
                  className="block px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  View all articles →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Documentation Quick Links */}
      <div className="mt-8 pt-6 border-t border-border">
        <h2 className="text-lg font-semibold mb-4">Documentation & Training</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/help/user-manual"
            className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
          >
            <h3 className="font-medium text-sm">User Manual</h3>
            <p className="text-xs text-muted-foreground mt-1">Complete system guide</p>
          </Link>
          <Link
            to="/help/sops"
            className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
          >
            <h3 className="font-medium text-sm">Standard Operating Procedures</h3>
            <p className="text-xs text-muted-foreground mt-1">Daily, weekly, monthly tasks</p>
          </Link>
          <Link
            to="/help/admin-guide"
            className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
          >
            <h3 className="font-medium text-sm">Administrator Guide</h3>
            <p className="text-xs text-muted-foreground mt-1">System configuration & security</p>
          </Link>
          <Link
            to="/help/training"
            className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
          >
            <h3 className="font-medium text-sm">Training Materials</h3>
            <p className="text-xs text-muted-foreground mt-1">Staff onboarding & education</p>
          </Link>
        </div>
      </div>
    </div>
  );
}