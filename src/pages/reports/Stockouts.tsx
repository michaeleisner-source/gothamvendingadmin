import { useEffect, useMemo, useState } from 'react';
import { useGlobalDays } from '@/hooks/useGlobalDays';
import { windowFromDays } from '@/lib/dateWindow';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OptimizedLoadingState } from '@/components/common/OptimizedLoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { Badge } from '@/components/ui/badge';

type Row = {
  machine_id: string;
  machine_code?: string;
  location_name?: string;
  product_id: string;
  product_name?: string;
  par_level?: number;
  current_qty?: number;
  velocity_per_day?: number;
  days_to_stockout?: number;
  restock_by?: string;
};

export default function Stockouts() {
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

        const { data, error } = await supabase.functions.invoke('reports-stockouts', {
          body: { startISO, endISO },
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });
        if (error) throw new Error(error.message);
        const arr: Row[] = Array.isArray(data?.rows) ? data.rows : (Array.isArray(data) ? data : []);
        if (!cancelled) setRows(arr);
      } catch(e:any) {
        if (!cancelled) setErr(e?.message || 'Failed to load stock-outs');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [days]);

  const alerts = useMemo(() => {
    const now = Date.now();
    return rows.map(r => {
      const dts = r.days_to_stockout ?? (
        r.velocity_per_day ? Math.max(0, Math.floor((r.current_qty ?? 0) / r.velocity_per_day)) : undefined
      );
      const restockBy = r.restock_by ? new Date(r.restock_by) :
        (dts != null ? new Date(now + dts*86400000) : undefined);
      
      // Determine urgency level
      let urgency: 'critical' | 'warning' | 'medium' | 'low' = 'low';
      if (dts !== undefined) {
        if (dts <= 1) urgency = 'critical';
        else if (dts <= 3) urgency = 'warning'; 
        else if (dts <= 7) urgency = 'medium';
      }
      
      return { ...r, dts, restockBy, urgency };
    });
  }, [rows]);

  const getUrgencyBadge = (urgency: string) => {
    switch(urgency) {
      case 'critical': return <Badge variant="destructive">Critical</Badge>;
      case 'warning': return <Badge className="bg-orange-100 text-orange-800">Warning</Badge>;
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      default: return <Badge variant="outline">Low</Badge>;
    }
  };

  if (loading) return <OptimizedLoadingState />;
  if (err) return <ErrorState message={err} onRetry={() => window.location.reload()} />;

  const criticalCount = alerts.filter(a => a.urgency === 'critical').length;
  const warningCount = alerts.filter(a => a.urgency === 'warning').length;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Stockout Predictions"
        description={`Inventory alerts based on last ${days} days velocity`}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Critical (≤1 day)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Warning (2-3 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{warningCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stockout Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="gv-table w-full">
                <thead>
                  <tr>
                    <th className="text-left">Machine</th>
                    <th className="text-left">Location</th>
                    <th className="text-left">Product</th>
                    <th className="text-right">Par</th>
                    <th className="text-right">On Hand</th>
                    <th className="text-right">Velocity/day</th>
                    <th className="text-right">Days to stockout</th>
                    <th className="text-left">Restock by</th>
                    <th className="text-center">Urgency</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts
                    .sort((a, b) => (a.dts ?? 999) - (b.dts ?? 999))
                    .map(r => (
                    <tr key={`${r.machine_id}:${r.product_id}`}>
                      <td className="font-medium">{r.machine_code ?? r.machine_id}</td>
                      <td>{r.location_name ?? '—'}</td>
                      <td>{r.product_name ?? r.product_id}</td>
                      <td className="text-right">{r.par_level ?? '—'}</td>
                      <td className="text-right">{r.current_qty ?? '—'}</td>
                      <td className="text-right">{r.velocity_per_day?.toFixed?.(2) ?? '—'}</td>
                      <td className="text-right">{r.dts ?? '—'}</td>
                      <td>{r.restockBy ? r.restockBy.toLocaleDateString() : '—'}</td>
                      <td className="text-center">{getUrgencyBadge(r.urgency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No at-risk items found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}