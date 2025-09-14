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
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Eye, Download, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type DeletionLog = {
  id: string;
  deleted_by_name: string;
  deleted_at: string;
  entity_type: string;
  entity_id: string;
  entity_data: any;
  reason: string | null;
  created_at: string;
};

const fetchDeletionLogs = async (search?: string): Promise<DeletionLog[]> => {
  let query = supabase
    .from("deletion_logs")
    .select("*")
    .order("deleted_at", { ascending: false });

  if (search) {
    query = query.or(`deleted_by_name.ilike.%${search}%,entity_type.ilike.%${search}%,reason.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

const DeletionLogs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState<DeletionLog | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const {
    data: deletionLogs = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["deletion-logs", searchTerm],
    queryFn: () => fetchDeletionLogs(searchTerm),
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getEntityTypeBadge = (entityType: string) => {
    switch (entityType) {
      case "purchase_order":
        return <Badge variant="destructive">Purchase Order</Badge>;
      case "purchase_order_item":
        return <Badge variant="secondary">Line Item</Badge>;
      case "product":
        return <Badge variant="outline">Product</Badge>;
      default:
        return <Badge variant="default">{entityType}</Badge>;
    }
  };

  const formatEntityInfo = (log: DeletionLog) => {
    if (log.entity_type === "purchase_order" && log.entity_data) {
      return `PO: ${log.entity_data.supplier_name || 'Unknown Supplier'}`;
    } else if (log.entity_type === "purchase_order_item" && log.entity_data) {
      return `Item: ${log.entity_data.product_name || 'Unknown Product'}`;
    } else if (log.entity_type === "product" && log.entity_data) {
      return `Product: ${log.entity_data.name || 'Unknown Product'}`;
    }
    return `ID: ${log.entity_id.substring(0, 8)}...`;
  };

  const viewDetails = (log: DeletionLog) => {
    setSelectedLog(log);
    setShowDetailsDialog(true);
  };

  const exportLogs = () => {
    if (deletionLogs.length === 0) {
      toast.error("No deletion logs to export");
      return;
    }

    const headers = ['Date', 'Deleted By', 'Type', 'Entity Info', 'Reason'];
    const csvContent = [
      headers.join(','),
      ...deletionLogs.map(log => [
        formatDate(log.deleted_at),
        log.deleted_by_name,
        log.entity_type,
        formatEntityInfo(log),
        log.reason || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'deletion-logs.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Deletion Logs</h1>
        <p className="text-destructive">Error loading deletion logs: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Deletion Audit Logs</h1>
          <p className="text-muted-foreground">Track of all deleted items for compliance and audit purposes</p>
        </div>
        <Button onClick={exportLogs} variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Search Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, type, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Deletion Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            Deletion History ({deletionLogs.length})
            {searchTerm && (
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
          ) : deletionLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? (
                <>
                  <p>No deletion logs match your search.</p>
                  <p className="text-sm mt-2">Try adjusting your search terms.</p>
                </>
              ) : (
                <>
                  <p>No items have been deleted yet.</p>
                  <p className="text-sm mt-2">This log will track all future deletions for audit purposes.</p>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Deleted By</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Entity Info</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deletionLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {formatDate(log.deleted_at)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {log.deleted_by_name}
                      </TableCell>
                      <TableCell>
                        {getEntityTypeBadge(log.entity_type)}
                      </TableCell>
                      <TableCell>
                        {formatEntityInfo(log)}
                      </TableCell>
                      <TableCell className="max-w-48 truncate">
                        {log.reason ? (
                          <span className="text-sm">{log.reason}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">No reason provided</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewDetails(log)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Deletion Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Deleted By</h4>
                  <p className="font-medium">{selectedLog.deleted_by_name}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Deletion Date</h4>
                  <p>{formatDate(selectedLog.deleted_at)}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Entity Type</h4>
                  {getEntityTypeBadge(selectedLog.entity_type)}
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Entity ID</h4>
                  <p className="font-mono text-sm">{selectedLog.entity_id}</p>
                </div>
              </div>
              
              {selectedLog.reason && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Reason</h4>
                  <p className="text-sm bg-muted p-3 rounded whitespace-pre-wrap">
                    {selectedLog.reason}
                  </p>
                </div>
              )}

              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Deleted Data</h4>
                <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-64">
                  {JSON.stringify(selectedLog.entity_data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeletionLogs;