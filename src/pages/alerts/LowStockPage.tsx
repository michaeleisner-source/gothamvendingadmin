import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toastError, toastSuccess } from "@/components/useToast";

type Row = {
  machine_id: string;
  machine_name: string | null;
  slot_label: string;
  product_id: string;
  product_name: string | null;
  current_qty: number;
  restock_threshold: number;
};

type Supplier = { id: string; name: string };

export default function LowStockPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    const [r1, r2] = await Promise.all([
      supabase.rpc("report_low_stock"),
      supabase.from("suppliers").select("id,name").order("name", { ascending: true }),
    ]);
    if (r1.error) toastError(r1.error.message); else setRows(r1.data || []);
    if (r2.error) toastError(r2.error.message); else setSuppliers(r2.data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function createDraftPO() {
    if (!supplierId) return toastError("Choose a supplier first");
    setCreating(true);
    const { data, error } = await supabase.rpc("create_draft_po_for_low_stock", {
      p_supplier_id: supplierId,
      p_note: "Auto restock from Low Stock Alerts",
    });
    setCreating(false);
    if (error) return toastError(error.message);
    toastSuccess("Draft PO created from low-stock items");
    // Optional: navigate to POs page
    setTimeout(() => { window.location.href = "/purchase-orders"; }, 700);
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold">Low Stock Alerts</h1>
        <div className="flex items-end gap-2">
          <label className="flex flex-col">
            <span className="text-xs text-gray-600 mb-1">Supplier</span>
            <select
              className="border rounded px-3 py-2 min-h-[44px] min-w-[220px]"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              <option value="">Select supplier…</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <button
            onClick={createDraftPO}
            className="bg-black text-white rounded px-4 py-2 min-h-[44px] disabled:opacity-50"
            disabled={!supplierId || creating || rows.length === 0}
            title={rows.length === 0 ? "No low-stock items" : "Create a draft PO with needed quantities"}
          >
            {creating ? "Creating…" : "Restock all low slots"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border rounded-xl p-4">
          <div className="text-xs text-gray-500">Low slots</div>
          <div className="text-xl font-semibold">{rows.length}</div>
        </div>
      </div>

      {loading ? <div>Loading…</div> : rows.length === 0 ? (
        <div className="text-gray-600">No low-stock slots.</div>
      ) : (
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-3">Machine</th>
                <th className="py-2 pr-3">Slot</th>
                <th className="py-2 pr-3">Product</th>
                <th className="py-2 pr-3">Qty</th>
                <th className="py-2 pr-3">Threshold</th>
                <th className="py-2 pr-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.machine_id}-${r.slot_label}`} className="border-b last:border-0">
                  <td className="py-2 pr-3">{r.machine_name || r.machine_id}</td>
                  <td className="py-2 pr-3">{r.slot_label}</td>
                  <td className="py-2 pr-3">{r.product_name || r.product_id}</td>
                  <td className="py-2 pr-3">{r.current_qty}</td>
                  <td className="py-2 pr-3">{r.restock_threshold}</td>
                  <td className="py-2 pr-3">
                    <a href={`/machines/${r.machine_id}`} className="text-blue-600 hover:underline">Open Machine</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}