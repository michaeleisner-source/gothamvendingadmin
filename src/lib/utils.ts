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
