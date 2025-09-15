import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** A single effective fee rule for a processor */
export type FeeRule = {
  processor_id: string;
  percent_bps: number;   // e.g. 290 = 2.90%
  fixed_cents: number;   // e.g. 10 = $0.10
  effective_date?: string | null; // YYYY-MM-DD
};

/** Utility: cents → dollars (number) */
export const dollars = (cents: number) => Math.round(cents) / 100;
/** Utility: money formatter */
export const money = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD" });
/** Utility: percent formatter (1 decimal) */
export const pct = (n: number) => `${(Number.isFinite(n) ? n : 0).toFixed(1)}%`;

/** Pure fee math for a single line item */
export function calcFeeCents(
  unit_price_cents: number,
  qty: number,
  rule?: Pick<FeeRule, "percent_bps" | "fixed_cents">
) {
  if (!rule) return 0;
  const pctPerUnit = Math.round((unit_price_cents * (rule.percent_bps || 0)) / 10_000);
  const fixedPerUnit = rule.fixed_cents || 0;
  const perUnit = pctPerUnit + fixedPerUnit;
  return Math.max(0, Math.round(qty) * perUnit);
}

/** Net math for a single sale line */
export function computeNetForLine(
  qty: number,
  unit_price_cents: number,
  unit_cost_cents: number,
  rule?: Pick<FeeRule, "percent_bps" | "fixed_cents">
) {
  const gross_cents = Math.max(0, Math.round(qty) * Math.round(unit_price_cents));
  const cogs_cents = Math.max(0, Math.round(qty) * Math.round(unit_cost_cents));
  const fee_cents = calcFeeCents(unit_price_cents, qty, rule);
  const net_cents = gross_cents - cogs_cents - fee_cents;

  return {
    gross_cents,
    cogs_cents,
    fee_cents,
    net_cents,
    gross: dollars(gross_cents),
    cogs: dollars(cogs_cents),
    fees: dollars(fee_cents),
    net: dollars(net_cents),
    // Margins as percentages of price (true margin, not markup)
    margin_pct: gross_cents > 0 ? ((gross_cents - cogs_cents) / gross_cents) * 100 : 0,
    net_margin_pct: gross_cents > 0 ? (net_cents / gross_cents) * 100 : 0,
  };
}

/**
 * Hook: builds a cache of the **latest effective** fee rule per machine.
 * - Reads machine_processor_mappings to find each machine's processor
 * - Uses payment_processors default fees for calculations
 * - Returns a `feeFor(machineId, unit_price_cents, qty)` helper
 */
export function useFeeRuleCache() {
  const [rulesByMachine, setRulesByMachine] = useState<Record<string, FeeRule | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // 1) mapping: machine -> processor
        const mapRes = await supabase
          .from("machine_processor_mappings")
          .select("machine_id, processor_id");
        if (mapRes.error) throw mapRes.error;
        const maps = mapRes.data || [];
        if (!maps.length) {
          setRulesByMachine({});
          setLoading(false);
          return;
        }

        // 2) Get processor defaults
        const procIds = Array.from(new Set(maps.map((m: any) => m.processor_id).filter(Boolean)));
        let rulesByProc = new Map<string, FeeRule>();
        
        if (procIds.length) {
          const procRes = await supabase
            .from("payment_processors")
            .select("id, default_percent_fee, default_fixed_fee")
            .in("id", procIds);
          
          if (procRes.error) throw procRes.error;
          
          for (const p of (procRes.data || [])) {
            const rule: FeeRule = {
              processor_id: p.id,
              percent_bps: Math.round((p.default_percent_fee || 0) * 100), // Convert % to bps
              fixed_cents: Math.round((p.default_fixed_fee || 0) * 100), // Convert $ to cents
            };
            rulesByProc.set(p.id, rule);
          }
        }

        // 3) build machine->rule
        const mapping: Record<string, FeeRule | null> = {};
        for (const m of maps) {
          const r = rulesByProc.get(m.processor_id) || null;
          mapping[m.machine_id] = r;
        }
        setRulesByMachine(mapping);
      } catch (e: any) {
        setError(e?.message || String(e));
        setRulesByMachine({});
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const feeFor = useMemo(() => {
    return (machineId: string, unit_price_cents: number, qty: number) =>
      calcFeeCents(unit_price_cents, qty, rulesByMachine[machineId] || undefined);
  }, [rulesByMachine]);

  return { feeFor, rulesByMachine, loading, error };
}

/**
 * Helper to aggregate many sales rows (per product, per machine, etc.).
 * Expects rows with: { machine_id, qty, unit_price_cents, unit_cost_cents }
 */
export function aggregateWithFees<T extends {
  machine_id: string;
  qty: number;
  unit_price_cents: number;
  unit_cost_cents: number;
}>(rows: T[], feeFor: (mid: string, priceCents: number, qty: number) => number) {
  let gross_cents = 0, cogs_cents = 0, fee_cents = 0;
  for (const r of rows) {
    const qty = Number(r.qty) || 0;
    const price = Number(r.unit_price_cents) || 0;
    const cost = Number(r.unit_cost_cents) || 0;
    gross_cents += qty * price;
    cogs_cents += qty * cost;
    fee_cents  += feeFor(r.machine_id, price, qty);
  }
  const net_cents = gross_cents - cogs_cents - fee_cents;
  return {
    gross_cents, cogs_cents, fee_cents, net_cents,
    gross: dollars(gross_cents),
    cogs: dollars(cogs_cents),
    fees: dollars(fee_cents),
    net: dollars(net_cents),
    margin_pct: gross_cents > 0 ? ((gross_cents - cogs_cents) / gross_cents) * 100 : 0,
    net_margin_pct: gross_cents > 0 ? (net_cents / gross_cents) * 100 : 0,
  };
}