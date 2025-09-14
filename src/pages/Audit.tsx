import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle, Download, Play, RefreshCw } from "lucide-react";
import { toast } from "sonner";

// ======== TYPES (matching actual Supabase schema) ========
export type Product = {
  id: string;
  sku: string;
  name: string;
  category?: string;
  manufacturer?: string;
  size_oz?: number | null;
  size_ml?: number | null;
  image_url?: string | null;
  description?: string | null;
  cost?: number;        // unit cost
  price?: number;       // sale price (not sale_price)
  org_id: string;
  created_at: string;
  updated_at: string;
};

export type Location = {
  id: string;
  name: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  location_type_id?: string;
  traffic_daily_est?: number;
  traffic_monthly_est?: number;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  org_id: string;
  created_at?: string;
  from_prospect_id?: string;
};

export type Machine = {
  id: string;
  name: string;
  location_id?: string | null;
  location?: string;
  status: string;
  org_id: string;
  created_at?: string;
};

export type MachineSlot = {
  id: string;
  machine_id: string;
  label: string; // This is the slot identifier
  row: number;
  col: number;
  capacity?: number; // max items slot can hold
  org_id: string;
};

export type SlotAssignment = {
  id: string;
  slot_id: string;
  product_id: string;
  max_qty?: number;
  restock_threshold?: number;
  org_id: string;
};

export type Sale = {
  id: string;
  machine_id: string;
  product_id: string;
  qty: number;
  unit_price_cents: number;
  unit_cost_cents?: number;
  occurred_at: string;
  source?: string;
  org_id: string;
};

export type RestockLine = {
  id: string;
  session_id: string;
  slot_id: string;
  product_id: string;
  prev_qty?: number;
  added_qty?: number;
  new_qty?: number;
  org_id: string;
};

// ======== HELPERS ========
function toCsv(rows: any[], headerOrder?: string[]) {
  if (!rows?.length) return "";
  const headers = headerOrder ?? Object.keys(rows[0]);
  const escape = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map(h => escape(row[h])).join(","));
  }
  return lines.join("\n");
}

function downloadCsv(filename: string, rows: any[], headerOrder?: string[]) {
  const csv = toCsv(rows, headerOrder);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const SKU_REGEX = /^[A-Z]{2,4}\d{1,4}[A-Z]?$/; // Flexible SKU format

// ======== AUDIT LOGIC ========
type AuditResults = {
  summary: {
    products: number;
    machines: number;
    locations: number;
    slots: number;
    sales: number;
    restocks: number;
  };
  issues: {
    duplicateSkus: any[];
    invalidSkuFormat: any[];
    missingRequiredFields: any[];
    priceBelowCost: any[];
    slotWithoutProduct: any[];
    productsWithoutSlots: any[];
    lowMarginSkus: any[];
    machinesWithoutSlots: any[];
    orphanMachines: any[];
    slotsWithoutPrice: any[];
    negativeMargins: any[];
    staleProducts: any[];
    profitabilityIssues: any[];
  };
};

function runAudit(
  products: Product[],
  machines: Machine[],
  locations: Location[],
  slots: MachineSlot[],
  assignments: SlotAssignment[],
  sales: Sale[],
  restocks: RestockLine[],
  opts?: { marginFloorPct?: number; staleDays?: number }
): AuditResults {
  const marginFloorPct = opts?.marginFloorPct ?? 0.25;  // 25%
  const staleDays = opts?.staleDays ?? 30;

  const bySku = new Map<string, Product[]>();
  const now = Date.now();
  const staleCutoff = now - staleDays * 86400000;

  // Group products by SKU
  for (const p of products) {
    const arr = bySku.get(p.sku) ?? [];
    arr.push(p);
    bySku.set(p.sku, arr);
  }

  // 1. Duplicate SKUs
  const duplicateSkus: any[] = [];
  for (const [sku, arr] of bySku) {
    if (arr.length > 1) {
      duplicateSkus.push({ 
        sku, 
        count: arr.length, 
        names: arr.map(a => a.name).join(" | "),
        ids: arr.map(a => a.id).join(", ")
      });
    }
  }

  // 2. Invalid SKU format
  const invalidSkuFormat = products
    .filter(p => !SKU_REGEX.test((p.sku || "").toUpperCase()))
    .map(p => ({ 
      id: p.id,
      sku: p.sku, 
      name: p.name,
      reason: "Does not match expected format"
    }));

  // 3. Missing required fields
  const missingRequiredFields = products
    .filter(p => !p.name || !p.sku || p.cost === undefined || p.price === undefined)
    .map(p => ({
      id: p.id,
      sku: p.sku, 
      name: p.name, 
      missing_fields: [
        !p.name && "name",
        !p.sku && "sku", 
        p.cost === undefined && "cost",
        p.price === undefined && "price"
      ].filter(Boolean).join(", ")
    }));

  // 4. Price below cost
  const priceBelowCost = products
    .filter(p => (p.cost ?? 0) > 0 && (p.price ?? 0) > 0 && (p.price as number) < (p.cost as number))
    .map(p => ({ 
      id: p.id,
      sku: p.sku, 
      name: p.name, 
      cost: p.cost, 
      price: p.price,
      loss_per_unit: (p.cost! - p.price!).toFixed(2)
    }));

  // 5. Slots without product assignments
  const assignedSlots = new Set(assignments.map(a => a.slot_id));
  const slotWithoutProduct = slots
    .filter(s => !assignedSlots.has(s.id))
    .map(s => ({ 
      slot_id: s.id, 
      machine_id: s.machine_id, 
      label: s.label,
      machine_name: machines.find(m => m.id === s.machine_id)?.name || "Unknown"
    }));

  // 6. Products without any slot assignments
  const assignedProductIds = new Set(assignments.map(a => a.product_id));
  const productsWithoutSlots = products
    .filter(p => !assignedProductIds.has(p.id))
    .map(p => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      reason: "Not assigned to any machine slot"
    }));

  // 7. Low margin SKUs
  const lowMarginSkus = products
    .filter(p => (p.cost ?? 0) > 0 && (p.price ?? 0) > 0)
    .map(p => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      margin_pct: (((p.price! - p.cost!) / p.price!) * 100).toFixed(2),
      cost: p.cost,
      price: p.price,
      margin_dollars: (p.price! - p.cost!).toFixed(2)
    }))
    .filter(x => parseFloat(x.margin_pct) < marginFloorPct * 100);

  // 8. Machines without slots
  const machineIds = new Set(machines.map(m => m.id));
  const machinesWithSlots = new Set(slots.map(s => s.machine_id));
  const machinesWithoutSlots = machines
    .filter(m => !machinesWithSlots.has(m.id))
    .map(m => ({ 
      machine_id: m.id, 
      machine_name: m.name,
      status: m.status,
      location: m.location || "No location"
    }));

  // 9. Orphan machines (no location)
  const orphanMachines = machines
    .filter(m => !m.location_id)
    .map(m => ({ 
      machine_id: m.id, 
      machine_name: m.name,
      status: m.status
    }));

  // 10. Products with negative margins
  const negativeMargins = products
    .filter(p => (p.cost ?? 0) > 0 && (p.price ?? 0) > 0 && p.price! < p.cost!)
    .map(p => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      cost: p.cost,
      price: p.price,
      loss_per_unit: (p.cost! - p.price!).toFixed(2),
      loss_pct: (((p.cost! - p.price!) / p.cost!) * 100).toFixed(2)
    }));

  // 11. Stale products (no recent sales)
  const recentSales = new Set(
    sales
      .filter(s => new Date(s.occurred_at).getTime() > staleCutoff)
      .map(s => s.product_id)
  );
  const staleProducts = products
    .filter(p => !recentSales.has(p.id))
    .map(p => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      days_since_last_sale: `>${staleDays}`,
      status: "No recent sales"
    }));

  // 12. Profitability issues
  const profitabilityIssues = sales
    .filter(s => !s.unit_cost_cents || s.unit_cost_cents <= 0)
    .map(s => {
      const product = products.find(p => p.id === s.product_id);
      return {
        sale_id: s.id,
        product_sku: product?.sku || "Unknown",
        product_name: product?.name || "Unknown",
        machine_id: s.machine_id,
        occurred_at: s.occurred_at,
        issue: "Missing cost data for profit calculation"
      };
    });

  return {
    summary: {
      products: products.length,
      machines: machines.length,
      locations: locations.length,
      slots: slots.length,
      sales: sales.length,
      restocks: restocks.length
    },
    issues: {
      duplicateSkus,
      invalidSkuFormat,
      missingRequiredFields,
      priceBelowCost,
      slotWithoutProduct,
      productsWithoutSlots,
      lowMarginSkus,
      machinesWithoutSlots,
      orphanMachines,
      slotsWithoutPrice: [], // Not applicable with current schema
      negativeMargins,
      staleProducts,
      profitabilityIssues
    }
  };
}

// ======== UI COMPONENT ========
export default function AuditDashboard() {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [slots, setSlots] = useState<MachineSlot[]>([]);
  const [assignments, setAssignments] = useState<SlotAssignment[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [restocks, setRestocks] = useState<RestockLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [opts, setOpts] = useState({ marginFloorPct: 0.25, staleDays: 30 });

  const results = useMemo(() => {
    if (!products.length) return null;
    return runAudit(products, machines, locations, slots, assignments, sales, restocks, opts);
  }, [products, machines, locations, slots, assignments, sales, restocks, opts]);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        productsRes, 
        machinesRes, 
        locationsRes, 
        slotsRes, 
        assignmentsRes, 
        salesRes,
        restocksRes
      ] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('machines').select('*'),
        supabase.from('locations').select('*'),
        supabase.from('machine_slots').select('*'),
        supabase.from('slot_assignments').select('*'),
        supabase.from('sales').select('*').order('occurred_at', { ascending: false }).limit(1000),
        supabase.from('restock_lines').select('*').limit(1000)
      ]);

      if (productsRes.error) throw productsRes.error;
      if (machinesRes.error) throw machinesRes.error;
      if (locationsRes.error) throw locationsRes.error;
      if (slotsRes.error) throw slotsRes.error;
      if (assignmentsRes.error) throw assignmentsRes.error;
      if (salesRes.error) throw salesRes.error;
      if (restocksRes.error) throw restocksRes.error;

      setProducts(productsRes.data || []);
      setMachines(machinesRes.data || []);
      setLocations(locationsRes.data || []);
      setSlots(slotsRes.data || []);
      setAssignments(assignmentsRes.data || []);
      setSales(salesRes.data || []);
      setRestocks(restocksRes.data || []);

      toast.success("Audit data loaded successfully");
    } catch (e: any) {
      console.error('Error loading data:', e);
      setError(e?.message || "Failed to load data");
      toast.error(`Failed to load data: ${e?.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const IssueTable = ({ title, rows }: { title: string; rows: any[] }) => {
    if (!rows?.length) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-green-600 text-sm">No issues found ✅</div>
          </CardContent>
        </Card>
      );
    }

    const headers = Object.keys(rows[0]);
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              {title} ({rows.length})
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadCsv(`${title.replace(/\s+/g, "_")}.csv`, rows, headers)}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((h) => (
                    <TableHead key={h} className="text-left font-medium">
                      {h.replace(/_/g, ' ').toUpperCase()}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={i}>
                    {headers.map((h) => (
                      <TableCell key={h} className="text-sm">
                        {String(r[h] ?? "")}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  };

  const totalIssues = results ? Object.values(results.issues).reduce((sum, issues) => sum + issues.length, 0) : 0;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Advanced System Audit</h1>
          <p className="text-muted-foreground">
            Comprehensive analysis of data integrity, profitability, and operational efficiency
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadAll} disabled={loading}>
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            {loading ? 'Running...' : 'Run Audit'}
          </Button>
        </div>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="space-y-2">
              <Label htmlFor="margin-floor">Minimum Margin % (Warning Threshold)</Label>
              <Input
                id="margin-floor"
                type="number"
                step="0.01"
                value={opts.marginFloorPct}
                onChange={(e) => setOpts({ ...opts, marginFloorPct: Number(e.target.value) })}
                className="w-32"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stale-days">Stale Product Days (No Sales)</Label>
              <Input
                id="stale-days"
                type="number"
                value={opts.staleDays}
                onChange={(e) => setOpts({ ...opts, staleDays: Number(e.target.value) })}
                className="w-32"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-destructive">
              <strong>Error:</strong> {error}
            </div>
          </CardContent>
        </Card>
      )}

      {results && (
        <>
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Audit Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{results.summary.products}</div>
                  <div className="text-sm text-muted-foreground">Products</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{results.summary.machines}</div>
                  <div className="text-sm text-muted-foreground">Machines</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{results.summary.locations}</div>
                  <div className="text-sm text-muted-foreground">Locations</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{results.summary.slots}</div>
                  <div className="text-sm text-muted-foreground">Slots</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{results.summary.sales}</div>
                  <div className="text-sm text-muted-foreground">Sales</div>
                </div>
                <div className="text-center p-4 border rounded-lg bg-yellow-50">
                  <div className="text-2xl font-bold text-yellow-600">{totalIssues}</div>
                  <div className="text-sm text-yellow-600">Total Issues</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Issues */}
          <div className="space-y-4">
            <IssueTable title="Duplicate SKUs" rows={results.issues.duplicateSkus} />
            <IssueTable title="Invalid SKU Format" rows={results.issues.invalidSkuFormat} />
            <IssueTable title="Missing Required Fields" rows={results.issues.missingRequiredFields} />
            <IssueTable title="Negative Margins (Price Below Cost)" rows={results.issues.negativeMargins} />
            <IssueTable title="Low Margin Products" rows={results.issues.lowMarginSkus} />
            <IssueTable title="Slots Without Product Assignment" rows={results.issues.slotWithoutProduct} />
            <IssueTable title="Products Not Assigned to Slots" rows={results.issues.productsWithoutSlots} />
            <IssueTable title="Machines Without Slots" rows={results.issues.machinesWithoutSlots} />
            <IssueTable title="Machines Without Location" rows={results.issues.orphanMachines} />
            <IssueTable title="Stale Products (No Recent Sales)" rows={results.issues.staleProducts} />
            <IssueTable title="Sales Missing Cost Data" rows={results.issues.profitabilityIssues} />
          </div>
        </>
      )}

      {!results && !error && (
        <Card>
          <CardContent className="text-center py-12">
            <Play className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ready for Advanced Audit</h3>
            <p className="text-muted-foreground mb-4">
              Click "Run Audit" to perform comprehensive analysis including:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 max-w-md mx-auto text-left">
              <li>• Duplicate SKU detection and validation</li>
              <li>• Profitability and margin analysis</li>
              <li>• Inventory configuration verification</li>
              <li>• Data integrity and relationship checks</li>
              <li>• Operational efficiency review</li>
              <li>• Stale product identification</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}