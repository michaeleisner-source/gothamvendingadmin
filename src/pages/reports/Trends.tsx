import { useEffect, useMemo, useState } from 'react';
import { useGlobalDays } from '@/hooks/useGlobalDays';
import { windowFromDays } from '@/lib/dateWindow';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OptimizedLoadingState } from '@/components/common/OptimizedLoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Point = { date: string; revenue: number; units: number; profit: number };

export default function Trends() {
  const days = useGlobalDays();
  const [rows, setRows] = useState<Point[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string|null>(null);
  const [group, setGroup] = useState<'daily'|'weekly'|'monthly'>('daily');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setErr(null);
      try {
        const { startISO, endISO } = windowFromDays(days);
        const session = await supabase.auth.getSession();
        const token = session.data?.session?.access_token;

        const { data, error } = await supabase.functions.invoke('reports-trends', {
          body: { startISO, endISO, group },
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });
        if (error) throw new Error(error.message);
        const arr: Point[] = Array.isArray(data?.rows) ? data.rows : (Array.isArray(data) ? data : []);
        if (!cancelled) setRows(arr);
      } catch(e:any) {
        if (!cancelled) setErr(e?.message || 'Failed to load trends');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [days, group]);

  const totals = useMemo(() => {
    let revenue=0, units=0, profit=0;
    for (const p of rows) { revenue+=p.revenue||0; units+=p.units||0; profit+=p.profit||0; }
    return { revenue, units, profit, margin: revenue ? profit/revenue : 0 };
  }, [rows]);

  if (loading) return <OptimizedLoadingState />;
  if (err) return <ErrorState message={err} onRetry={() => window.location.reload()} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Sales Trends"
          description={`Time-series analysis for the last ${days} days`}
        />
        <Select value={group} onValueChange={(value: 'daily'|'weekly'|'monthly') => setGroup(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trend Data</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="gv-table w-full">
                <thead>
                  <tr>
                    <th className="text-left">Period</th>
                    <th className="text-right">Revenue</th>
                    <th className="text-right">Units</th>
                    <th className="text-right">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(p => (
                    <tr key={p.date}>
                      <td>{new Date(p.date).toLocaleDateString()}</td>
                      <td className="text-right">${(p.revenue ?? 0).toFixed(2)}</td>
                      <td className="text-right">{p.units ?? 0}</td>
                      <td className="text-right">${(p.profit ?? 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                {totals && (
                  <tfoot>
                    <tr className="border-t font-bold">
                      <td>Totals</td>
                      <td className="text-right">${totals.revenue.toFixed(2)}</td>
                      <td className="text-right">{totals.units}</td>
                      <td className="text-right">${totals.profit.toFixed(2)} ({(totals.margin*100).toFixed(1)}%)</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No trend data in this range.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}