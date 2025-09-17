// Shared analytics utility functions for sales data analysis

export type SaleRow = { 
  date: string; 
  location: string; 
  machine: string; 
  product: string; 
  qty: number; 
  price: number; 
  revenue: number; 
};

export type MoverRow = {
  key: string;
  curr: number;
  prev: number;
  delta: number;
  pct: string;
  txCurr: number;
  txPrev: number;
};

/**
 * Aggregates sales data by a specific field (product or location)
 * Returns a map of field values to transaction and revenue totals
 */
export function aggBy(rows: SaleRow[], field: 'product' | 'location') {
  const map = new Map<string, { tx: number; revenue: number }>();
  for (const r of rows) {
    const k = r[field];
    const cur = map.get(k) || { tx: 0, revenue: 0 };
    cur.tx += 1;
    cur.revenue += r.revenue;
    map.set(k, cur);
  }
  return map;
}

/**
 * Analyzes period-over-period performance to identify top gainers and decliners
 * Compares current period vs previous period for products or locations
 */
export function moversFor(
  rows: SaleRow[],
  prevRows: SaleRow[],
  field: 'product' | 'location',
  limit = 5
): { gainers: MoverRow[]; decliners: MoverRow[] } {
  const cur = aggBy(rows, field);
  const prev = aggBy(prevRows, field);
  const keys = new Set<string>([...cur.keys(), ...prev.keys()]);
  
  const all = Array.from(keys).map((k): MoverRow => {
    const c = cur.get(k) || { tx: 0, revenue: 0 };
    const p = prev.get(k) || { tx: 0, revenue: 0 };
    const delta = +(c.revenue - p.revenue).toFixed(2);
    const pct = p.revenue === 0 
      ? (c.revenue ? '∞%' : '0%') 
      : `${(((c.revenue - p.revenue) / p.revenue) * 100).toFixed(1)}%`;
    
    return { 
      key: k, 
      curr: +c.revenue.toFixed(2), 
      prev: +p.revenue.toFixed(2), 
      delta, 
      pct, 
      txCurr: c.tx, 
      txPrev: p.tx 
    };
  });

  const gainers = all.filter((x) => x.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, limit);
  const decliners = all.filter((x) => x.delta < 0).sort((a, b) => a.delta - b.delta).slice(0, limit);
  
  return { gainers, decliners };
}

/**
 * Calculates percentage change between current and previous values
 * Returns formatted string with sign and percentage
 */
export function deltaPct(curr: number, prev: number): string {
  if (!prev) return curr ? '∞%' : '0%';
  const p = ((curr - prev) / prev) * 100;
  const sign = p > 0 ? '+' : '';
  return `${sign}${p.toFixed(1)}%`;
}