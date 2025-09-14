import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command, Search, Loader2, Box, Factory, Building2, User, Truck, Package2, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SearchResult {
  entity: string;
  id: string;
  title: string;
  subtitle: string;
  url: string;
  rank: number;
}

/**
 * GlobalSearch Component
 * - Sticky top bar search with an omnibox dropdown
 * - Debounced queries against Supabase RPC `search_all`
 * - Keyboard: Ctrl/Cmd+K to focus, arrows to navigate, Enter to open
 */
export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Keyboard shortcut: Ctrl/Cmd+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes('mac');
      if ((isMac && e.metaKey && e.key.toLowerCase() === 'k') || (!isMac && e.ctrlKey && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (open) {
        if (e.key === 'Escape') {
          setOpen(false);
          setQ('');
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setActive((a) => Math.min(a + 1, Math.max(results.length - 1, 0)));
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setActive((a) => Math.max(a - 1, 0));
        }
        if (e.key === 'Enter' && results[active]) {
          e.preventDefault();
          navigate(results[active].url);
          setOpen(false);
          setQ('');
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, results, active, navigate]);

  // Click outside to close
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // Debounced search
  useEffect(() => {
    const handle = setTimeout(async () => {
      if (!q || q.trim().length < 2) {
        setResults([]);
        setOpen(false);
        return;
      }
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('search_all', { 
          q: q.trim(), 
          limit_count: 15 
        });
        if (error) {
          console.error('search_all error', error);
          setResults([]);
        } else {
          setResults(data || []);
          setOpen(true);
          setActive(0);
        }
      } catch (err) {
        console.error('Search error:', err);
        setResults([]);
      }
      setLoading(false);
    }, 300);
    return () => clearTimeout(handle);
  }, [q]);

  const handleResultClick = (result: SearchResult) => {
    navigate(result.url);
    setOpen(false);
    setQ('');
  };

  return (
    <div className="sticky top-0 z-30 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b border-border">
      <div className="max-w-screen-2xl mx-auto px-4 py-2">
        <div className="relative">
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => q.trim().length >= 2 && setOpen(true)}
            placeholder="Search anything… (Ctrl/Cmd+K)"
            className="w-full rounded-xl bg-muted border border-input px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          />
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <kbd className="absolute right-3 top-2.5 text-[10px] text-muted-foreground bg-muted-foreground/10 rounded px-1.5 py-0.5 flex items-center gap-1">
            <Command className="size-3" />K
          </kbd>

          {/* Results dropdown */}
          {open && (q.trim().length >= 2) && (
            <div className="absolute mt-2 w-full rounded-xl border border-border bg-background shadow-2xl overflow-hidden z-50">
              {loading ? (
                <div className="p-4 flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> 
                  Searching…
                </div>
              ) : (
                <div>
                  {results.length === 0 ? (
                    <div className="p-4 text-muted-foreground">No results found</div>
                  ) : (
                    <ul className="max-h-96 overflow-y-auto">
                      {results.map((result, i) => (
                        <li key={`${result.entity}-${result.id}-${i}`}>
                          <button
                            onMouseEnter={() => setActive(i)}
                            onClick={() => handleResultClick(result)}
                            className={`w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-muted transition-colors ${
                              i === active ? 'bg-muted' : ''
                            }`}
                          >
                            <EntityIcon entity={result.entity} />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm truncate font-medium">{result.title}</div>
                              <div className="text-xs text-muted-foreground truncate">{result.subtitle}</div>
                            </div>
                            <span className="text-[10px] text-muted-foreground uppercase bg-muted-foreground/10 px-1.5 py-0.5 rounded">
                              {result.entity}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EntityIcon({ entity }: { entity: string }) {
  const iconMap: Record<string, React.ReactNode> = {
    location: <Building2 className="size-4 text-blue-500" />,
    machine: <Factory className="size-4 text-purple-500" />,
    product: <Package2 className="size-4 text-green-500" />,
    supplier: <Tag className="size-4 text-orange-500" />,
    staff: <User className="size-4 text-cyan-500" />,
    route: <Truck className="size-4 text-yellow-500" />,
  };
  return <>{iconMap[entity] ?? <Box className="size-4 text-muted-foreground" />}</>;
}