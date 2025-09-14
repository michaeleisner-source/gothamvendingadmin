import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import { ClipboardList, RefreshCw, ArrowUpRight, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BacklogItem {
  id: string;
  q: string;
  context_page?: string;
  misses_90d: number;
  escalations_90d: number;
  status: string;
  priority: number;
  article_id?: string;
  category_id?: string;
  assigned_staff_id?: string;
  last_seen?: string;
  notes?: string;
}

export default function HelpBacklog() {
  const [rows, setRows] = useState<BacklogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('open');
  const [q, setQ] = useState('');
  const { toast } = useToast();

  const fetchRows = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('help_backlog')
        .select('id,q,context_page,misses_90d,escalations_90d,status,priority,article_id,category_id,assigned_staff_id,last_seen,notes')
        .order('priority', { ascending: true })
        .order('misses_90d', { ascending: false });
      
      if (status !== 'all') {
        query = query.eq('status', status);
      }
      if (q.trim()) {
        query = query.ilike('q', `%${q}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setRows(data || []);
    } catch (error) {
      console.error('Error fetching backlog:', error);
      toast({
        title: "Error",
        description: "Failed to fetch backlog items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, [status, q]);

  const refresh = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.rpc('rpc_refresh_help_backlog', { days_back: 90 });
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Backlog refreshed from zero-result queries",
      });
      await fetchRows();
    } catch (error) {
      console.error('Error refreshing backlog:', error);
      toast({
        title: "Error",
        description: "Failed to refresh backlog",
        variant: "destructive",
      });
    }
  };

  const promote = async (id: string) => {
    try {
      const { data, error } = await supabase.rpc('rpc_promote_backlog_to_article', { _backlog_id: id });
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Backlog item promoted to article",
      });
      fetchRows();
    } catch (error) {
      console.error('Error promoting backlog item:', error);
      toast({
        title: "Error", 
        description: "Failed to promote backlog item",
        variant: "destructive",
      });
    }
  };

  const setPriority = async (id: string, priority: number) => {
    try {
      const { error } = await supabase.from('help_backlog').update({ priority }).eq('id', id);
      if (error) throw error;
      fetchRows();
    } catch (error) {
      console.error('Error updating priority:', error);
    }
  };

  const setStatusRow = async (id: string, s: string) => {
    try {
      const { error } = await supabase.from('help_backlog').update({ status: s }).eq('id', id);
      if (error) throw error;
      fetchRows();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getPriorityBadge = (priority: number) => {
    const colors = {
      1: 'bg-destructive text-destructive-foreground',
      2: 'bg-orange-500 text-white',
      3: 'bg-yellow-500 text-black',
      4: 'bg-blue-500 text-white',
      5: 'bg-muted text-muted-foreground'
    };
    return colors[priority as keyof typeof colors] || colors[3];
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      open: 'bg-muted text-muted-foreground',
      writing: 'bg-blue-500 text-white',
      review: 'bg-yellow-500 text-black',
      published: 'bg-green-500 text-white',
      wont_fix: 'bg-destructive text-destructive-foreground'
    };
    return colors[status as keyof typeof colors] || colors.open;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <header className="flex items-center gap-3">
        <ClipboardList className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Help Content Backlog</h1>
          <p className="text-sm text-muted-foreground">
            Manage content creation pipeline from zero-result queries
          </p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <select 
          value={status} 
          onChange={(e) => setStatus(e.target.value)} 
          className="px-3 py-2 text-sm rounded-lg border border-input bg-background"
        >
          <option value="open">Open</option>
          <option value="writing">Writing</option>
          <option value="review">Review</option>
          <option value="published">Published</option>
          <option value="wont_fix">Won't Fix</option>
          <option value="all">All</option>
        </select>
        
        <input 
          value={q} 
          onChange={(e) => setQ(e.target.value)} 
          placeholder="Filter queries…" 
          className="px-3 py-2 text-sm rounded-lg border border-input bg-background"
        />
        
        <button 
          onClick={refresh} 
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="overflow-auto border border-border rounded-xl bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Priority</th>
              <th className="px-4 py-3 text-left font-medium">Query</th>
              <th className="px-4 py-3 text-left font-medium">Misses</th>
              <th className="px-4 py-3 text-left font-medium">Escalations</th>
              <th className="px-4 py-3 text-left font-medium">Context</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Last Seen</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-center text-muted-foreground" colSpan={8}>
                  Loading backlog items...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-muted-foreground" colSpan={8}>
                  No backlog items found
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-border hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <select 
                      value={r.priority} 
                      onChange={(e) => setPriority(r.id, Number(e.target.value))} 
                      className={`px-2 py-1 text-xs rounded border-0 ${getPriorityBadge(r.priority)}`}
                    >
                      {[1,2,3,4,5].map(p => (
                        <option key={p} value={p} className="bg-background text-foreground">
                          {p}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{r.q}</div>
                    {r.notes && (
                      <div className="text-xs text-muted-foreground mt-1">{r.notes}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-mono text-sm">{r.misses_90d}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-mono text-sm">{r.escalations_90d}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {r.context_page || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <select 
                      value={r.status} 
                      onChange={(e) => setStatusRow(r.id, e.target.value)} 
                      className={`px-2 py-1 text-xs rounded border-0 ${getStatusBadge(r.status)}`}
                    >
                      <option value="open" className="bg-background text-foreground">Open</option>
                      <option value="writing" className="bg-background text-foreground">Writing</option>
                      <option value="review" className="bg-background text-foreground">Review</option>
                      <option value="published" className="bg-background text-foreground">Published</option>
                      <option value="wont_fix" className="bg-background text-foreground">Won't Fix</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {r.last_seen ? new Date(r.last_seen).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {!r.article_id && (
                        <button 
                          onClick={() => promote(r.id)} 
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          <Plus className="h-3 w-3" />
                          Article
                        </button>
                      )}
                      {r.article_id && (
                        <Link 
                          to={`/help/article/${r.article_id}`} 
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90"
                        >
                          <ArrowUpRight className="h-3 w-3" />
                          Open
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}