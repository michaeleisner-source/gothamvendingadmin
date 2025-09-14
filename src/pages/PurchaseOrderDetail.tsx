import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DeletionConfirmDialog } from "@/components/DeletionConfirmDialog";
import { ArrowLeft, Edit, FileText, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type PurchaseOrderDetail = {
  id: string;
  supplier_id: string;
  status: string;
  notes: string | null;
  created_at: string;
  supplier: {
    name: string;
    contact: string | null;
  };
  purchase_order_items: {
    id: string;
    qty_ordered: number;
    unit_cost: number;
    product: {
      name: string;
      sku: string;
    };
  }[];
};

const fetchPurchaseOrderDetail = async (id: string): Promise<PurchaseOrderDetail> => {
  const { data, error } = await (supabase as any)
    .from("purchase_orders")
    .select(`
      id,
      supplier_id,
      status,
      notes,
      created_at,
      supplier:suppliers(name, contact),
      purchase_order_items(
        id,
        qty_ordered,
        unit_cost,
        product:products(name, sku)
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const PurchaseOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newStatus, setNewStatus] = useState<string>("");
  const [showDeletePODialog, setShowDeletePODialog] = useState(false);
  const [showDeleteItemDialog, setShowDeleteItemDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const {
    data: purchaseOrder,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["purchase-order", id],
    queryFn: () => fetchPurchaseOrderDetail(id!),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("purchase_orders")
        .update({ status: status.toUpperCase() })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-order", id] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Purchase order status updated successfully!");
      setNewStatus("");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Error updating purchase order status");
    },
  });

  const deletePOMutation = useMutation({
    mutationFn: async ({ poId, deletedByName, reason }: { 
      poId: string; 
      deletedByName: string; 
      reason?: string 
    }) => {
      const { error } = await supabase.rpc('delete_purchase_order_with_log', {
        p_po_id: poId,
        p_deleted_by_name: deletedByName,
        p_reason: reason
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Purchase order deleted successfully!");
      navigate("/purchase-orders");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Error deleting purchase order");
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async ({ itemId, deletedByName, reason }: { 
      itemId: string; 
      deletedByName: string; 
      reason?: string 
    }) => {
      const { error } = await supabase.rpc('delete_purchase_order_item_with_log', {
        p_item_id: itemId,
        p_deleted_by_name: deletedByName,
        p_reason: reason
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-order", id] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Line item deleted successfully!");
      setItemToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Error deleting line item");
      setItemToDelete(null);
    },
  });

  const handleStatusUpdate = (status: string) => {
    if (!id) return;
    updateStatusMutation.mutate({ id, status });
  };

  const handleDeletePO = (deletedByName: string, reason?: string) => {
    if (!id) return;
    deletePOMutation.mutate({ poId: id, deletedByName, reason });
  };

  const handleDeleteItem = (deletedByName: string, reason?: string) => {
    if (!itemToDelete) return;
    deleteItemMutation.mutate({ itemId: itemToDelete, deletedByName, reason });
  };

  const handleItemDeleteClick = (itemId: string) => {
    setItemToDelete(itemId);
    setShowDeleteItemDialog(true);
  };

  const canEdit = () => {
    const currentStatus = purchaseOrder?.status?.toUpperCase();
    return currentStatus === "OPEN" || currentStatus === "DRAFT";
  };

  const getAvailableActions = () => {
    const currentStatus = purchaseOrder?.status?.toUpperCase();
    const actions = [];

    switch (currentStatus) {
      case "OPEN":
      case "DRAFT":
        actions.push(
          { label: "Submit PO", status: "SUBMITTED", variant: "default", icon: CheckCircle },
          { label: "Cancel PO", status: "CANCELLED", variant: "destructive", icon: XCircle }
        );
        break;
      case "SUBMITTED":
        actions.push(
          { label: "Mark as Received", status: "RECEIVED", variant: "default", icon: CheckCircle },
          { label: "Cancel PO", status: "CANCELLED", variant: "destructive", icon: XCircle }
        );
        break;
      case "RECEIVED":
        // No actions available for received orders
        break;
      case "CANCELLED":
        actions.push(
          { label: "Reopen PO", status: "OPEN", variant: "outline", icon: Edit }
        );
        break;
    }

    return actions;
  };

  const exportPO = () => {
    if (!purchaseOrder) return;
    
    const data = {
      po_number: getShortId(purchaseOrder.id),
      supplier: purchaseOrder.supplier.name,
      contact: purchaseOrder.supplier.contact,
      status: purchaseOrder.status,
      created: new Date(purchaseOrder.created_at).toLocaleDateString(),
      total: calculateTotal(),
      items: purchaseOrder.purchase_order_items.map(item => ({
        product: item.product.name,
        sku: item.product.sku,
        qty: item.qty_ordered,
        unit_cost: item.unit_cost,
        total: item.qty_ordered * item.unit_cost
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PO-${getShortId(purchaseOrder.id)}.json`;
    a.click();
    URL.revokeObjectURL(url);
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

  const calculateTotal = () => {
    if (!purchaseOrder?.purchase_order_items) return 0;
    return purchaseOrder.purchase_order_items.reduce(
      (total, item) => total + (item.qty_ordered * item.unit_cost),
      0
    );
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/purchase-orders")}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Purchase Order</h1>
        </div>
        <p className="text-destructive">Error loading purchase order: {error.message}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/purchase-orders")}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Purchase Order</h1>
        </div>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/purchase-orders")}
          className="h-10 w-10"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">
          Purchase Order #{getShortId(purchaseOrder!.id)}
        </h1>
        <div className="ml-auto flex gap-2">
          <Button onClick={exportPO} variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Export
          </Button>
          {canEdit() && (
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
          {(purchaseOrder?.status === "OPEN" || purchaseOrder?.status === "DRAFT") && (
            <Button 
              onClick={() => setShowDeletePODialog(true)} 
              variant="destructive" 
              size="sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete PO
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Actions Section */}
        {getAvailableActions().length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {getAvailableActions().map((action) => {
                  const Icon = action.icon;
                  return (
                    <AlertDialog key={action.status}>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant={action.variant as any} 
                          size="sm"
                          disabled={updateStatusMutation.isPending}
                        >
                          <Icon className="w-4 h-4 mr-2" />
                          {action.label}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirm Action</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to {action.label.toLowerCase()}? 
                            This will change the status to "{action.status}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleStatusUpdate(action.status)}>
                            {action.label}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* PO Header Information */}
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Supplier</Label>
                <p className="text-lg font-medium">{purchaseOrder!.supplier.name}</p>
                {purchaseOrder!.supplier.contact && (
                  <p className="text-sm text-muted-foreground">{purchaseOrder!.supplier.contact}</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                <div className="mt-1">
                  <Badge variant={getStatusVariant(purchaseOrder!.status) as any} className="text-sm">
                    {purchaseOrder!.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {purchaseOrder!.status === "OPEN" && "Ready for review and submission"}
                  {purchaseOrder!.status === "SUBMITTED" && "Awaiting supplier confirmation"}
                  {purchaseOrder!.status === "RECEIVED" && "Items have been received"}
                  {purchaseOrder!.status === "CANCELLED" && "Order has been cancelled"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                <p className="text-lg">
                  {new Date(purchaseOrder!.created_at).toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(purchaseOrder!.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t">
              <div className="flex justify-between items-center">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Order Total</Label>
                  <p className="text-2xl font-bold text-primary">${calculateTotal().toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <Label className="text-sm font-medium text-muted-foreground">Items</Label>
                  <p className="text-lg font-medium">
                    {purchaseOrder!.purchase_order_items.reduce((sum, item) => sum + item.qty_ordered, 0)} units
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <CardTitle>
              Line Items ({purchaseOrder!.purchase_order_items.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Qty Ordered</TableHead>
                    <TableHead className="text-right">Unit Cost</TableHead>
                    <TableHead className="text-right">Line Total</TableHead>
                    {canEdit() && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrder!.purchase_order_items.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.product.name}</TableCell>
                      <TableCell className="font-mono text-sm">{item.product.sku}</TableCell>
                      <TableCell className="text-right">{item.qty_ordered}</TableCell>
                      <TableCell className="text-right">${item.unit_cost.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium">
                        ${(item.qty_ordered * item.unit_cost).toFixed(2)}
                      </TableCell>
                      {canEdit() && (
                        <TableCell className="text-right">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleItemDeleteClick(item.id)}
                            disabled={deleteItemMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Summary */}
            <div className="border-t pt-4 mt-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes Section */}
        {purchaseOrder!.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {purchaseOrder!.notes}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Deletion Confirmation Dialogs */}
      <DeletionConfirmDialog
        open={showDeletePODialog}
        onOpenChange={setShowDeletePODialog}
        title="Delete Purchase Order"
        description={`Are you sure you want to permanently delete Purchase Order #${purchaseOrder ? getShortId(purchaseOrder.id) : ''}? This will delete all line items and cannot be undone.`}
        itemName={purchaseOrder ? `PO-${getShortId(purchaseOrder.id)}` : 'PO'}
        onConfirm={handleDeletePO}
        isLoading={deletePOMutation.isPending}
      />

      <DeletionConfirmDialog
        open={showDeleteItemDialog}
        onOpenChange={setShowDeleteItemDialog}
        title="Delete Line Item"
        description="Are you sure you want to delete this line item? This action cannot be undone."
        itemName={itemToDelete && purchaseOrder ? 
          purchaseOrder.purchase_order_items.find(item => item.id === itemToDelete)?.product.name || 'ITEM' 
          : 'ITEM'}
        onConfirm={handleDeleteItem}
        isLoading={deleteItemMutation.isPending}
      />
    </div>
  );
};

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export default PurchaseOrderDetail;