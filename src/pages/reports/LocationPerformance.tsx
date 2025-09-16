import { useEffect, useState } from 'react';
import { useGlobalDays } from '@/hooks/useGlobalDays';
import { windowFromDays } from '@/lib/dateWindow';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { OptimizedLoadingState } from '@/components/common/OptimizedLoadingState';
import { ErrorState } from '@/components/common/ErrorState';

type Row = {
  location_id: string;
  location_name?: string;
  machines?: number;
  revenue: number;
  cogs: number;
  profit: number;
  profit_pct: number;
  revenue_per_machine?: number;
};

export default function LocationPerformanceEdge() {
  const days = useGlobalDays();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string|null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setErr(null);
      try {
        const { startISO, endISO } = windowFromDays(days);
        const session = await supabase.auth.getSession();
        const token = session.data?.session?.access_token;

        const { data, error } = await supabase.functions.invoke('reports-locations', {
          body: { startISO, endISO },
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });
        if (error) throw new Error(error.message);
        const arr: Row[] = Array.isArray(data?.rows) ? data.rows : (Array.isArray(data) ? data : []);
        if (!cancelled) setRows(arr);
      } catch(e:any) {
        if (!cancelled) setErr(e?.message || 'Failed to load location performance');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [days]);

  if (loading) return <OptimizedLoadingState />;
  if (err) return <ErrorState message={err} onRetry={() => window.location.reload()} />;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Location Performance (Edge)"
        description={`Performance metrics for the last ${days} days`}
      />

      <Card>
        <CardContent className="p-6">
          {rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="gv-table w-full">
                <thead>
                  <tr>
                    <th className="text-left">Location</th>
                    <th className="text-center">Machines</th>
                    <th className="text-right">Revenue</th>
                    <th className="text-right">COGS</th>
                    <th className="text-right">Profit</th>
                    <th className="text-right">Profit %</th>
                    <th className="text-right">Revenue / Machine</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.location_id}>
                      <td className="font-medium">{r.location_name ?? r.location_id}</td>
                      <td className="text-center">{r.machines ?? '—'}</td>
                      <td className="text-right">${(r.revenue ?? 0).toFixed(2)}</td>
                      <td className="text-right">${(r.cogs ?? 0).toFixed(2)}</td>
                      <td className="text-right">${(r.profit ?? 0).toFixed(2)}</td>
                      <td className="text-right">{(((r.profit_pct ?? 0) * 100)).toFixed(1)}%</td>
                      <td className="text-right">${(r.revenue_per_machine ?? (r.machines ? (r.revenue/(r.machines||1)) : 0)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No data in this range.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}