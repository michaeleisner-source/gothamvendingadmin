import { supabase } from "@/integrations/supabase/client";

/**
 * Compute insurance cost for each machine in a period.
 * Priority per policy: machine > location > global. All amounts prorated by:
 *  - days in scope (vs 30-day month)
 *  - overlap with coverage_start/coverage_end
 */
export async function insuranceForMachines(
  machines: Array<{ id: string; location_id?: string | null }>,
  startISO: string,
  endISO: string
): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const m of machines) out[m.id] = 0;

  // If no machines, shortcut
  if (!machines.length) return out;

  // Load active policies that overlap scope
  const scopeStart = new Date(startISO);
  const scopeEnd = new Date(endISO);
  const { data: policies, error: pErr } = await supabase
    .from("insurance_policies")
    .select("*")
    .lte("coverage_start", endISO)
    .gte("coverage_end", startISO)
    .limit(1000);
  if (pErr || !policies?.length) return out;

  // Load all allocations for those policies
  const policyIds = policies.map((p: any) => p.id);
  const { data: allocs, error: aErr } = await supabase
    .from("insurance_allocations")
    .select("*")
    .in("policy_id", policyIds)
    .limit(5000);
  if (aErr) return out;

  // Precompute counts
  const byLocation = new Map<string, string[]>(); // locId -> [machineIds]
  for (const m of machines) {
    const loc = String(m.location_id ?? "");
    if (!byLocation.has(loc)) byLocation.set(loc, []);
    byLocation.get(loc)!.push(m.id);
  }
  const totalMachines = machines.length;

  // Helper: day overlap factor (also months factor)
  function factor(policy: any): number {
    const start = new Date(policy.coverage_start);
    const end = new Date(policy.coverage_end);
    const lo = Math.max(start.getTime(), scopeStart.getTime());
    const hi = Math.min(end.getTime(), scopeEnd.getTime());
    if (hi < lo) return 0;
    const days = Math.max(1, Math.round((hi - lo) / 86_400_000) + 1);
    return days / 30; // month-equivalent factor
  }

  // Group allocations by policy for quick lookup
  const allocByPolicy = new Map<string, any[]>();
  for (const a of allocs || []) {
    const pid = String(a.policy_id);
    if (!allocByPolicy.has(pid)) allocByPolicy.set(pid, []);
    allocByPolicy.get(pid)!.push(a);
  }

  for (const policy of policies) {
    const mf = factor(policy);
    if (mf <= 0) continue;
    const monthlyPremium = (Number(policy.monthly_premium_cents) || 0) / 100;
    if (!monthlyPremium) continue;

    const arr = allocByPolicy.get(String(policy.id)) || [];

    // Index allocations
    const machineAlloc = new Map<string, any>();
    const locationAlloc = new Map<string, any>();
    let globalAlloc: any | null = null;

    for (const a of arr) {
      if (a.level === "machine" && a.machine_id) machineAlloc.set(String(a.machine_id), a);
      else if (a.level === "location" && a.location_id) locationAlloc.set(String(a.location_id), a);
      else if (a.level === "global") globalAlloc = a;
    }

    // Compute amount for each machine
    for (const m of machines) {
      const mid = m.id;
      const locId = String(m.location_id ?? "");
      let share = 0;

      // 1) Machine override
      const mAlloc = machineAlloc.get(mid);
      if (mAlloc) {
        if (mAlloc.flat_monthly_cents != null) {
          share = (Number(mAlloc.flat_monthly_cents) || 0) / 100;
        } else if (mAlloc.allocated_pct_bps != null) {
          share = monthlyPremium * ((Number(mAlloc.allocated_pct_bps) || 0) / 10000);
        }
      } else {
        // 2) Location allocation (split across location machines)
        const lAlloc = locationAlloc.get(locId);
        if (lAlloc) {
          let locBase = 0;
          if (lAlloc.flat_monthly_cents != null) {
            locBase = (Number(lAlloc.flat_monthly_cents) || 0) / 100;
          } else if (lAlloc.allocated_pct_bps != null) {
            locBase = monthlyPremium * ((Number(lAlloc.allocated_pct_bps) || 0) / 10000);
          }
          const locCount = (byLocation.get(locId) || []).length || 1;
          share = locBase / locCount;
        } else if (globalAlloc) {
          // 3) Global allocation (split across all machines)
          let base = 0;
          if (globalAlloc.flat_monthly_cents != null) {
            base = (Number(globalAlloc.flat_monthly_cents) || 0) / 100;
          } else if (globalAlloc.allocated_pct_bps != null) {
            base = monthlyPremium * ((Number(globalAlloc.allocated_pct_bps) || 0) / 10000);
          }
          share = base / Math.max(1, totalMachines);
        }
      }

      out[mid] += share * mf; // prorate to scoped month-fraction & coverage overlap
    }
  }

  return out;
}

/** Format currency in cents to dollars */
export const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(cents / 100);
};

/** Format percentage from basis points */
export const formatPercentage = (bps: number) => {
  return `${(bps / 100).toFixed(2)}%`;
};