import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function computeMargins(unit_price_cents: number, unit_cost_cents: number) {
  const price = (unit_price_cents ?? 0) / 100;
  const cost  = (unit_cost_cents ?? 0) / 100;
  const marginDollar = Math.max(0, price - cost);
  const marginPct    = price > 0 ? (marginDollar / price) * 100 : 0;   // true margin %
  const markupPct    = cost  > 0 ? (marginDollar / cost)  * 100 : 0;   // markup %
  return { price, cost, marginDollar, marginPct, markupPct };
}

export const money = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD" });

export const pct = (n: number) => `${n.toFixed(1)}%`;

// CSV Export utilities
export function toCSV(rows: any[]) {
  if (!rows?.length) return '';
  const keys = Object.keys(rows[0]);
  const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [keys.join(','), ...rows.map(r => keys.map(k => esc(r[k])).join(','))].join('\n');
}

export function downloadCSV(name: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${name}-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
  a.click(); 
  URL.revokeObjectURL(a.href);
}
