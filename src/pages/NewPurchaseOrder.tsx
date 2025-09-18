import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Supplier = { id: string; name: string; contact?: string | null };
type Product = { id: string; name: string; sku: string; cost: number };
type LineItem = { product_id?: string; qty_ordered: number; unit_cost: number };

export default function NewPurchaseOrderPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [supplierId, setSupplierId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { product_id: undefined, qty_ordered: 1, unit_cost: 0 },
  ]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const [{ data: sData, error: sErr }, { data: pData, error: pErr }] = await Promise.all([
        supabase.from("suppliers").select("id,name,contact").order("name", { ascending: true }),
        supabase.from("products").select("id,name,sku,cost").order("name", { ascending: true }),
      ]);
      if (!mounted) return;
      if (sErr) setError(`Failed to load suppliers: ${sErr.message}`);
      if (pErr) setError(prev => prev ? prev + " | " + pErr.message : pErr.message);
      setSuppliers(sData || []);
      setProducts((pData || []).map(p => ({ ...p, cost: Number(p.cost) || 0 })));
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  const total = useMemo(
    () => lineItems.reduce((sum, li) => sum + (Number(li.qty_ordered) || 0) * (Number(li.unit_cost) || 0), 0),
    [lineItems]
  );

  function addLine() {
    setLineItems(prev => [...prev, { product_id: undefined, qty_ordered: 1, unit_cost: 0 }]);
  }

  function removeLine(index: number) {
    setLineItems(prev => prev.filter((_, i) => i !== index));
  }

  function updateLine(index: number, patch: Partial<LineItem>) {
    setLineItems(prev => {
      const next = [...prev];
      const current = { ...next[index], ...patch };
      // Coerce numeric fields
      current.qty_ordered = Number(current.qty_ordered) || 0;
      current.unit_cost = Number(current.unit_cost) || 0;
      next[index] = current;
      return next;
    });
  }

  function onChangeProduct(index: number, productId: string) {
    const p = products.find(x => x.id === productId);
    setLineItems(prev => {
      const next = [...prev];
      const li = { ...next[index] };
      li.product_id = productId || undefined;
      if (!li.unit_cost || li.unit_cost === 0) {
        li.unit_cost = p ? Number(p.cost) || 0 : 0;
      }
      if (!li.qty_ordered || li.qty_ordered < 1) li.qty_ordered = 1;
      next[index] = li;
      return next;
    });
  }

  async function handleSave() {
    setError("");
    // Basic validation
    if (!supplierId) {
      setError("Please select a supplier.");
      return;
    }
    const validLines = lineItems.filter(
      li => li.product_id && Number(li.qty_ordered) >= 1 && Number(li.unit_cost) >= 0
    );
    if (validLines.length === 0) {
      setError("Add at least one valid line (product, qty ≥ 1, cost ≥ 0).");
      return;
    }

    setSaving(true);
    try {
      // 1) Insert PO header
      const { data: po, error: poErr } = await supabase
        .from("purchase_orders")
        .insert([{ supplier_id: supplierId, status: "OPEN", notes }])
        .select()
        .single();
      if (poErr) throw poErr;

      // 2) Insert PO lines
      const linesPayload = validLines.map(li => ({
        po_id: po.id,
        product_id: li.product_id!,
        qty_ordered: Number(li.qty_ordered),
        unit_cost: Number(li.unit_cost),
      }));
      const { error: itemsErr } = await supabase.from("purchase_order_items").insert(linesPayload);
      if (itemsErr) throw itemsErr;

      // 3) Navigate to PO details
      window.location.href = `/purchase-orders/${po.id}`;
    } catch (e: any) {
      setError(e?.message || "Failed to save purchase order.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-3">New Purchase Order</h1>

      {error && (
        <div className="mb-3 rounded bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Supplier</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            disabled={loading}
          >
            <option value="">Select supplier…</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <div className="text-xs text-gray-500 mt-1">
            Don't see it? Create suppliers at <a className="underline" href="/suppliers">/suppliers</a>.
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Line Items</label>
          <div className="space-y-3">
            {lineItems.map((li, idx) => {
              const invalid = !li.product_id || (li.qty_ordered ?? 0) < 1 || (li.unit_cost ?? -1) < 0;
              return (
                <div key={idx} className="rounded-lg border p-3 bg-white">
                  <div className="flex flex-col gap-2">
                    <div>
                      <label className="block text-xs font-medium mb-1">Product</label>
                      <select
                        className="w-full border rounded px-3 py-2"
                        value={li.product_id || ""}
                        onChange={(e) => onChangeProduct(idx, e.target.value)}
                      >
                        <option value="">Select product…</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>
                      {!products.length && (
                        <div className="text-xs text-gray-500 mt-1">
                          No products found. Add products at <a className="underline" href="/products">/products</a>.
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium mb-1">Qty</label>
                        <input
                          type="number"
                          min={1}
                          className="w-full border rounded px-3 py-2"
                          value={li.qty_ordered}
                          onChange={(e) => updateLine(idx, { qty_ordered: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Unit Cost</label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          className="w-full border rounded px-3 py-2"
                          value={li.unit_cost}
                          onChange={(e) => updateLine(idx, { unit_cost: Number(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${invalid ? "text-red-600" : "text-gray-500"}`}>
                        {invalid ? "Line invalid: choose product, qty ≥ 1, cost ≥ 0" : "Looks good"}
                      </span>
                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLine(idx)}
                          className="text-red-600 text-sm underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addLine}
            className="mt-2 w-full border rounded-lg py-2 font-medium"
          >
            + Add line
          </button>
        </div>

        <div className="rounded-lg border p-3 bg-white flex items-center justify-between">
          <span className="text-sm text-gray-600">PO Total</span>
          <span className="text-lg font-semibold">${total.toFixed(2)}</span>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="flex-1 rounded-lg bg-black text-white py-3 font-semibold disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Purchase Order"}
          </button>
          <a href="/purchase-orders" className="flex-1 rounded-lg border py-3 text-center font-semibold">
            Cancel
          </a>
        </div>
      </div>
    </div>
  );
}