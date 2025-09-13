import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

type PurchaseOrder = {
  id: string;
  supplier_id: string;
  status: string;
  notes: string | null;
  created_at: string;
  supplier: {
    name: string;
  };
};

const fetchPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
  const { data, error } = await (supabase as any)
    .from("purchase_orders")
    .select(`
      id,
      supplier_id,
      status,
      notes,
      created_at,
      supplier:suppliers(name)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

const PurchaseOrders = () => {
  const {
    data: purchaseOrders = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: fetchPurchaseOrders,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusVariant = (status: string) => {
    switch (status?.toUpperCase()) {
      case "OPEN":
        return "default";
      case "SUBMITTED":
        return "secondary";
      case "RECEIVED":
        return "success";
      case "CANCELLED":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getShortId = (id: string) => {
    return id.substring(0, 8).toUpperCase();
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Purchase Orders</h1>
        <p className="text-destructive">Error loading purchase orders: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Purchase Orders</h1>
        <Button asChild className="min-h-[44px] flex items-center gap-2">
          <Link to="/purchase-orders/new">
            <Plus className="h-4 w-4" />
            New PO
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders ({purchaseOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : purchaseOrders.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No purchase orders found. Create your first purchase order using the "New PO" button above.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO #</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrders.map((po) => (
                    <TableRow key={po.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-mono font-medium">
                        <Link to={`/purchase-orders/${po.id}`} className="hover:underline">
                          {getShortId(po.id)}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link to={`/purchase-orders/${po.id}`}>
                          {po.supplier?.name || "Unknown Supplier"}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link to={`/purchase-orders/${po.id}`}>
                          <Badge variant={getStatusVariant(po.status) as any}>
                            {po.status || "OPEN"}
                          </Badge>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link to={`/purchase-orders/${po.id}`}>
                          {formatDate(po.created_at)}
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseOrders;