import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Package, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

type Row = {
  machine_id: string;
  machine_name: string | null;
  slot_label: string;
  product_id: string | null;
  product_name: string | null;
  current_qty: number;
  restock_threshold: number;
};

export default function LowStockPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.rpc("report_low_stock");
    if (error) {
      console.error("Error fetching low stock:", error);
    } else {
      setRows(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const criticalItems = rows.filter(r => r.current_qty === 0);
  const lowStockItems = rows.filter(r => r.current_qty > 0 && r.current_qty <= r.restock_threshold);

  const getStockStatus = (currentQty: number, threshold: number) => {
    if (currentQty === 0) return { label: "Empty", variant: "destructive" as const };
    if (currentQty <= threshold) return { label: "Low", variant: "secondary" as const };
    return { label: "Good", variant: "default" as const };
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Low Stock Alerts</h1>
          <p className="text-muted-foreground">Monitor inventory levels across all machines</p>
        </div>
        <Button onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical (Empty)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalItems.length}</div>
            <p className="text-xs text-muted-foreground">Requires immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <Package className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">Below restock threshold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rows.length}</div>
            <p className="text-xs text-muted-foreground">Across all machines</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Button asChild>
          <Link to="/restock-entry">
            <Package className="h-4 w-4 mr-2" />
            Start Restock
          </Link>
        </Button>
      </div>

      {/* Low Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle>Low Stock Items</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No low stock alerts found</p>
              <p className="text-sm text-muted-foreground mt-2">All inventory levels are healthy</p>
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 pr-4 font-medium">Machine</th>
                    <th className="text-left py-3 pr-4 font-medium">Slot</th>
                    <th className="text-left py-3 pr-4 font-medium">Product</th>
                    <th className="text-left py-3 pr-4 font-medium">Current Qty</th>
                    <th className="text-left py-3 pr-4 font-medium">Threshold</th>
                    <th className="text-left py-3 pr-4 font-medium">Status</th>
                    <th className="text-left py-3 pr-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => {
                    const status = getStockStatus(row.current_qty, row.restock_threshold);
                    return (
                      <tr key={`${row.machine_id}-${row.slot_label}-${index}`} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3 pr-4">
                          <Link 
                            to={`/machine/${row.machine_id}`}
                            className="text-primary hover:underline"
                          >
                            {row.machine_name || "Unknown Machine"}
                          </Link>
                        </td>
                        <td className="py-3 pr-4 font-mono">{row.slot_label}</td>
                        <td className="py-3 pr-4">{row.product_name || "—"}</td>
                        <td className="py-3 pr-4 font-medium">{row.current_qty}</td>
                        <td className="py-3 pr-4">{row.restock_threshold}</td>
                        <td className="py-3 pr-4">
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </td>
                        <td className="py-3 pr-4">
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/machines/${row.machine_id}/inventory`}>
                              View Machine
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}