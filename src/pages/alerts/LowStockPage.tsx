import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

type Row = {
  machine_id: string;
  machine_name: string | null;
  slot_label: string;
  product_id: string;
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
      console.error("Error loading low stock data:", error);
    }
    setRows(data || []);
    setLoading(false);
  }

  useEffect(() => { 
    load(); 
  }, []);

  const criticalSlots = rows.filter(r => r.current_qty === 0);
  const lowSlots = rows.filter(r => r.current_qty > 0 && r.current_qty <= r.restock_threshold);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Low Stock Alerts</h1>
          <p className="text-muted-foreground">Monitor inventory levels and restock needs</p>
        </div>
        <Button asChild>
          <Link to="/restock">
            <Package className="mr-2 h-4 w-4" />
            Start Restock
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical (Empty)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalSlots.length}</div>
            <p className="text-xs text-muted-foreground">Slots with 0 inventory</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <Package className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{lowSlots.length}</div>
            <p className="text-xs text-muted-foreground">Below reorder point</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rows.length}</div>
            <p className="text-xs text-muted-foreground">Requiring attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={rows.length === 0 ? "default" : "destructive"}>
              {rows.length === 0 ? "All Good" : "Action Needed"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Low Stock Details</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No low-stock alerts. All inventory levels are healthy!</p>
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-border">
                    <th className="py-3 pr-4 font-medium">Machine</th>
                    <th className="py-3 pr-4 font-medium">Slot</th>
                    <th className="py-3 pr-4 font-medium">Product</th>
                    <th className="py-3 pr-4 font-medium">Current</th>
                    <th className="py-3 pr-4 font-medium">Threshold</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={`${r.machine_id}-${r.slot_label}`} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="py-3 pr-4">{r.machine_name || r.machine_id}</td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline">{r.slot_label}</Badge>
                      </td>
                      <td className="py-3 pr-4">{r.product_name || r.product_id}</td>
                      <td className="py-3 pr-4">
                        <span className={r.current_qty === 0 ? "text-destructive font-semibold" : "text-warning font-semibold"}>
                          {r.current_qty}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{r.restock_threshold}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={r.current_qty === 0 ? "destructive" : "secondary"}>
                          {r.current_qty === 0 ? "Empty" : "Low"}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/machines/${r.machine_id}`}>
                            View Machine
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}