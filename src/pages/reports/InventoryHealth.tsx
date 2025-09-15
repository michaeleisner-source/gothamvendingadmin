import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useScope } from "@/context/Scope";
import { AlertTriangle, Package, Download, RefreshCw, Info } from "lucide-react";
import { Link } from "react-router-dom";

type Row = {
  machine_id: string;
  machine_name: string;
  product_id: string;
  product_name: string;
  sku?: string | null;
  par_level: number;     // PAR level from inventory_levels
  current_qty: number;   // current quantity on hand
  deficit: number;       // max(0, par - current_qty)
  reorder_point: number; // reorder threshold
};

type Any = Record<string, any>;

function csvEscape(s: string) {
  const v = String(s ?? "");
  if (v.includes(",") || v.includes('"') || v.includes("\n")) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export default function InventoryHealth() {
  const scope = useScope();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [inventoryData, setInventoryData] = useState<Any[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        // Build query for inventory levels with related data
        let query = supabase
          .from("inventory_levels")
          .select(`
            *,
            machines!inventory_levels_machine_id_fkey(name),
            products!inventory_levels_product_id_fkey(name, sku)
          `);

        // Apply location filter if set
        if (scope.locationId) {
          // First get machines in the location
          const { data: locationMachines, error: machineError } = await supabase
            .from("machines")
            .select("id")
            .eq("location_id", scope.locationId);
          
          if (machineError) throw machineError;
          
          const machineIds = locationMachines.map(m => m.id);
          if (machineIds.length > 0) {
            query = query.in("machine_id", machineIds);
          } else {
            // No machines in this location
            setInventoryData([]);
            setLoading(false);
            return;
          }
        }

        const { data, error } = await query.limit(100000);
        if (error) throw error;

        setInventoryData(data || []);
      } catch (e: any) {
        setErr(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [scope.locationId]);

  const rows = useMemo<Row[]>(() => {
    // Filter for items with deficits (current_qty < par_level or current_qty <= reorder_point)
    const deficitRows: Row[] = [];
    
    for (const item of inventoryData) {
      const currentQty = item.current_qty || 0;
      const parLevel = item.par_level || 0;
      const reorderPoint = item.reorder_point || 0;
      
      // Calculate deficit based on PAR level
      const deficit = Math.max(0, parLevel - currentQty);
      
      // Show items with deficit or below reorder point
      if (deficit > 0 || currentQty <= reorderPoint) {
        deficitRows.push({
          machine_id: item.machine_id,
          machine_name: item.machines?.name || item.machine_id,
          product_id: item.product_id,
          product_name: item.products?.name || item.product_id,
          sku: item.products?.sku || null,
          par_level: parLevel,
          current_qty: currentQty,
          deficit,
          reorder_point: reorderPoint,
        });
      }
    }

    // Sort by deficit (highest first), then by machine name
    deficitRows.sort((a, b) => b.deficit - a.deficit || a.machine_name.localeCompare(b.machine_name));
    return deficitRows;
  }, [inventoryData]);

  function exportCSV() {
    const headers = ["Machine","Product","SKU","PAR Level","Current Qty","Deficit","Reorder Point"];
    const lines = [headers.join(",")];
    for (const r of rows) {
      lines.push([
        csvEscape(r.machine_name), 
        csvEscape(r.product_name), 
        csvEscape(r.sku ?? ""), 
        r.par_level, 
        r.current_qty, 
        r.deficit, 
        r.reorder_point
      ].join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory_health.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Loading/Errors
  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-3 text-xl font-semibold">Inventory Health</div>
        <div className="text-sm text-muted-foreground">Loading inventory health…</div>
      </div>
    );
  }
  if (err) {
    return (
      <div className="p-6">
        <div className="mb-3 text-xl font-semibold">Inventory Health</div>
        <div className="text-sm text-rose-400">Error: {err}</div>
      </div>
    );
  }

  // Show guidance if no inventory data exists
  if (!loading && inventoryData.length === 0) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-xl font-semibold">
          <Package className="h-5 w-5" />
          Inventory Health
        </div>

        <div className="rounded-xl border border-border bg-card p-4 text-sm">
          <div className="flex items-start gap-2 text-amber-400">
            <AlertTriangle className="h-4 w-4 mt-0.5" />
            <div>
              No inventory data found. To use Inventory Health:
              <ul className="list-disc ml-5 mt-2 text-foreground">
                <li>Set up machines with slots using the <Link to="/slots" className="underline">Slot Planner</Link></li>
                <li>Configure PAR levels and reorder points for each product</li>
                <li>Record current inventory quantities</li>
              </ul>
            </div>
          </div>

          <div className="mt-3 text-xs text-muted-foreground flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5" />
            <span>
              Visit the <Link to="/inventory" className="underline">Inventory</Link> page to manage stock levels
              and set up your inventory tracking system.
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Main report
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xl font-semibold">
          <Package className="h-5 w-5" />
          Inventory Health
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted"
          >
            <Download className="h-4 w-4" /> CSV
          </button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        Scope: <b>{scope.label}</b>{scope.locationId ? " · location filter active" : ""}. 
        Shows items below PAR level or at/below reorder point. Deficits calculated as <i>PAR Level − Current Qty</i>.
      </div>

      <div className="rounded-xl border border-border overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <Th>Machine</Th>
              <Th>Product</Th>
              <Th>SKU</Th>
              <Th className="text-right">PAR Level</Th>
              <Th className="text-right">Current Qty</Th>
              <Th className="text-right">Deficit</Th>
              <Th className="text-right">Reorder Point</Th>
              <Th className="text-right">Action</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((r) => (
                <tr key={`${r.machine_id}::${r.product_id}`} className="odd:bg-card/50">
                  <Td>
                    <Link to={`/machines/${r.machine_id}`} className="hover:underline">{r.machine_name}</Link>
                  </Td>
                  <Td>{r.product_name}</Td>
                  <Td>{r.sku || ""}</Td>
                  <Td className="text-right">{r.par_level}</Td>
                  <Td className="text-right">{r.current_qty}</Td>
                  <Td className="text-right font-semibold">{r.deficit}</Td>
                  <Td className="text-right text-xs text-muted-foreground">{r.reorder_point}</Td>
                  <Td className="text-right">
                    <Link
                      to={`/picklists`}
                      className="text-xs rounded-md border border-border px-2 py-1 hover:bg-muted"
                      title="Open Picklists to plan replenishment"
                    >
                      Plan Pick
                    </Link>
                  </Td>
                </tr>
              ))
            ) : (
              <tr>
                <Td colSpan={8}>
                  <div className="py-6 text-center text-muted-foreground">No deficits — all machines at or above PAR level. 🎉</div>
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2 text-left ${className}`}>{children}</th>;
}
function Td({ children, className = "", colSpan }: { children: React.ReactNode; className?: string; colSpan?: number }) {
  return <td className={`px-3 py-2 ${className}`} colSpan={colSpan}>{children}</td>;
}