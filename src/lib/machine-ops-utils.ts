/** Machine Operations Utilities */

export const num = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);
export const cents = (n?: number | null) => (Number.isFinite(Number(n)) ? Number(n) / 100 : 0);
export const fmt = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD" });
export const daysBetween = (a: Date, b: Date) => Math.abs(a.getTime() - b.getTime()) / 86400000;
export const safeDate = (v?: string | null) => (v ? new Date(v) : undefined);

/** Machine Finance Types */
export type Mach = {
  id: string;
  name?: string | null;
  location_id?: string | null;
  acquired_at?: string | null;
  finance_type?: string | null;             // "purchase" | "lease"
  purchase_price_cents?: number | null;
  lease_monthly_cents?: number | null;
  residual_value_cents?: number | null;
  term_months?: number | null;              // finance term months
  depreciation_years?: number | null;       // straight-line fallback
};

export type SalesRow = { 
  machine_id: string; 
  qty?: number; 
  unit_price_cents?: number; 
  unit_cost_cents?: number; 
  occurred_at?: string 
};

/** Maintenance Types */
export type Ticket = {
  id: string;
  machine_id?: string | null;
  title?: string | null;
  issue?: string | null;
  category?: string | null;
  status?: string | null;            // "open"|"closed"|"in_progress"
  priority?: string | null;          // "low"|"medium"|"high"|"urgent"
  created_at?: string | null;
  updated_at?: string | null;
  resolved_at?: string | null;
  labor_minutes?: number | null;
  labor_cost_cents?: number | null;
  parts_cost_cents?: number | null;
};