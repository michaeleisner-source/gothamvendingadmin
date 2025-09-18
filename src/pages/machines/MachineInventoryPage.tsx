import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Minus, Plus } from "lucide-react";
import { toastError, toastSuccess } from "@/components/useToast";

type Row = {
  machine_id: string;
  machine_name: string | null;
  slot_label: string;
  product_id: string | null;
  product_name: string | null;
  current_qty: number;
  restock_threshold: number;
};

export default function MachineInventoryPage() {
  const { machineId } = useParams();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [machineName, setMachineName] = useState<string>("");

  async function load() {
    if (!machineId) return;
    setLoading(true);
    const inv = await supabase.rpc("get_machine_inventory", { p_machine_id: machineId });
    if (inv.error) {
      toastError(inv.error.message);
      setLoading(false);
      return;
    }
    setRows(inv.data || []);
    setMachineName(inv.data?.[0]?.machine_name || "");
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [machineId]);

  async function adjust(slot: string, delta: number) {
    if (!machineId) return;
    const { data, error } = await supabase.rpc("adjust_slot_qty", {
      p_machine_id: machineId,
      p_slot_label: slot,
      p_delta: delta,
    });
    if (error) {
      toastError(error.message);
      return;
    }
    setRows((rs) => rs.map((r) => (r.slot_label === slot ? { ...r, current_qty: data as number } : r)));
    toastSuccess(`Adjusted ${slot} by ${delta > 0 ? "+" : ""}${delta}`);
  }

  async function setQty(slot: string, qty: number) {
    if (!machineId) return;
    const { data, error } = await supabase.rpc("set_slot_qty", {
      p_machine_id: machineId,
      p_slot_label: slot,
      p_qty: qty,
    });
    if (error) {
      toastError(error.message);
      return;
    }
    setRows((rs) => rs.map((r) => (r.slot_label === slot ? { ...r, current_qty: data as number } : r)));
    toastSuccess(`Set ${slot} to ${qty}`);
  }

  const getStockStatus = (currentQty: number, threshold: number) => {
    if (currentQty === 0) return { label: "Empty", variant: "destructive" as const };
    if (currentQty <= threshold) return { label: "Low", variant: "secondary" as const };
    return { label: "Good", variant: "default" as const };
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <a href={`/machines/${machineId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Machine
            </a>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Machine Inventory</h1>
            {machineName && <p className="text-muted-foreground">{machineName}</p>}
          </div>
        </div>
        <Button onClick={load} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">Loading inventory...</div>
          </CardContent>
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">
              No slots found. Generate a planogram for this machine first.
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Slot Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 pr-4 font-medium">Slot</th>
                    <th className="text-left py-3 pr-4 font-medium">Product</th>
                    <th className="text-left py-3 pr-4 font-medium">Current Qty</th>
                    <th className="text-left py-3 pr-4 font-medium">Threshold</th>
                    <th className="text-left py-3 pr-4 font-medium">Status</th>
                    <th className="text-left py-3 pr-4 font-medium">Quick Adjust</th>
                    <th className="text-left py-3 pr-4 font-medium">Set Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const status = getStockStatus(r.current_qty, r.restock_threshold);
                    return (
                      <tr key={r.slot_label} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3 pr-4 font-mono font-medium">{r.slot_label}</td>
                        <td className="py-3 pr-4">{r.product_name || "—"}</td>
                        <td className="py-3 pr-4 font-medium">{r.current_qty}</td>
                        <td className="py-3 pr-4">{r.restock_threshold}</td>
                        <td className="py-3 pr-4">
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => adjust(r.slot_label, -1)}
                              disabled={r.current_qty <= 0}
                              title="Decrease by 1"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => adjust(r.slot_label, +1)}
                              title="Increase by 1"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => adjust(r.slot_label, +12)}
                              title="Restock (+12)"
                            >
                              +12
                            </Button>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              const input = (e.currentTarget.elements.namedItem("qty") as HTMLInputElement);
                              const val = Math.max(0, parseInt(input.value || "0", 10));
                              setQty(r.slot_label, val);
                            }}
                            className="flex items-center gap-2"
                          >
                            <Input
                              name="qty"
                              type="number"
                              min={0}
                              defaultValue={r.current_qty}
                              className="w-20"
                            />
                            <Button type="submit" size="sm">
                              Set
                            </Button>
                          </form>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}