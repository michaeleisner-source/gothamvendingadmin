import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Download, Filter, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";

type PurchaseOrder = {
  id: string;
  supplier_id: string;
  status: string;
  notes: string | null;
  created_at: string;
  supplier: {
    name: string;
  };
  purchase_order_items?: {
    id: string;
    qty_ordered: number;
    unit_cost: number;
  }[];
};

const fetchPurchaseOrders = async (filters?: { search?: string; status?: string }): Promise<PurchaseOrder[]> => {
  let query = supabase
    .from("purchase_orders")
    .select(`
      id,
      supplier_id,
      status,
      notes,
      created_at,
      supplier:suppliers(name),
      purchase_order_items(id, qty_ordered, unit_cost)
    `)
    .order("created_at", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status.toUpperCase());
  }

  if (filters?.search) {
    // Search in supplier name or PO ID
    query = query.or(`supplier.name.ilike.%${filters.search}%,id.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

const PurchaseOrders = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const deletePurchaseOrderMutation = useMutation({
    mutationFn: async (poId: string) => {
      const { error } = await supabase
        .from("purchase_orders")
        .delete()
        .eq("id", poId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Purchase order deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Error deleting purchase order");
    },
  });

  const handleDeletePO = async (po: PurchaseOrder) => {
    if (confirm(`⚠️ Are you sure you want to delete PO #${getShortId(po.id)}?\n\n• This will permanently delete the purchase order\n• All line items will also be deleted\n• This action CANNOT be undone\n\nClick OK to confirm deletion or Cancel to keep the purchase order.`)) {
      deletePurchaseOrderMutation.mutate(po.id);
    }
  };

  const {
    data: purchaseOrders = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["purchase-orders", { search: searchTerm, status: statusFilter }],
    queryFn: () => fetchPurchaseOrders({ search: searchTerm, status: statusFilter }),
  });

  const calculatePOTotal = (po: PurchaseOrder) => {
    if (!po.purchase_order_items) return 0;
    return po.purchase_order_items.reduce(
      (total, item) => total + (item.qty_ordered * item.unit_cost),
      0
    );
  };

  const exportToCSV = () => {
    if (purchaseOrders.length === 0) {
      toast.error("No purchase orders to export");
      return;
    }

    const headers = ['PO ID', 'Supplier', 'Status', 'Created Date', 'Total Amount', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...purchaseOrders.map(po => [
        getShortId(po.id),
        po.supplier?.name || 'Unknown Supplier',
        po.status || 'OPEN',
        formatDate(po.created_at),
        calculatePOTotal(po).toFixed(2),
        po.notes || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'purchase-orders.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

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
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Purchase Orders Review</h1>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button asChild>
            <Link to="/purchase-orders/new">
              <Plus className="h-4 w-4 mr-2" />
              New PO
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by supplier or PO ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Purchase Orders ({purchaseOrders.length})
            {(searchTerm || statusFilter !== "all") && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                (filtered)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : purchaseOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || statusFilter !== "all" ? (
                <>
                  <p>No purchase orders match your filters.</p>
                  <p className="text-sm mt-2">Try adjusting your search terms or filters.</p>
                </>
              ) : (
                <>
                  <p>No purchase orders found.</p>
                  <p className="text-sm mt-2">Create your first purchase order using the "New PO" button above.</p>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO #</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrders.map((po) => {
                    const total = calculatePOTotal(po);
                    return (
                      <TableRow key={po.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-mono font-medium">
                          <Link to={`/purchase-orders/${po.id}`} className="hover:underline">
                            {getShortId(po.id)}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link to={`/purchase-orders/${po.id}`} className="hover:underline">
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
                        <TableCell className="text-right font-medium">
                          <Link to={`/purchase-orders/${po.id}`}>
                            ${total.toFixed(2)}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link to={`/purchase-orders/${po.id}`} className="text-muted-foreground">
                            {formatDate(po.created_at)}
                          </Link>
                        </TableCell>
                        <TableCell className="max-w-48 truncate">
                          <Link to={`/purchase-orders/${po.id}`} className="text-muted-foreground">
                            {po.notes || "-"}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              handleDeletePO(po);
                            }}
                            className="text-destructive hover:text-destructive"
                            disabled={deletePurchaseOrderMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              
              {/* Summary */}
              <div className="border-t mt-4 pt-4">
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>
                    {purchaseOrders.length} purchase order{purchaseOrders.length !== 1 ? 's' : ''}
                    {(searchTerm || statusFilter !== "all") && " matching filters"}
                  </span>
                  <span className="font-medium">
                    Total Value: ${purchaseOrders.reduce((sum, po) => sum + calculatePOTotal(po), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseOrders;