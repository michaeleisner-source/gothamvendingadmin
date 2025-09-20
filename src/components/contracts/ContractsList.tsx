import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Search, MoreHorizontal, Eye, Edit, Trash2, FileText, Download, Plus, Minus } from "lucide-react";
import { useContracts, useDeleteContract } from "@/hooks/useContracts";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

const statusColors = {
  draft: "secondary",
  pending: "outline", 
  signed: "default",
  expired: "destructive",
  cancelled: "destructive",
} as const;

const statusLabels = {
  draft: "Draft",
  pending: "Pending",
  signed: "Active",
  expired: "Expired",
  cancelled: "Cancelled",
} as const;

export function ContractsList() {
  const [search, setSearch] = useState('');
  const [expandedContracts, setExpandedContracts] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const { data: contracts = [], isLoading } = useContracts(search);
  const deleteContract = useDeleteContract();

  const toggleExpanded = (contractId: string) => {
    setExpandedContracts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(contractId)) {
        newSet.delete(contractId);
      } else {
        newSet.add(contractId);
      }
      return newSet;
    });
  };

  const handleView = (contractId: string) => {
    navigate(`/contract/${contractId}`);
  };

  const handleEdit = (contractId: string) => {
    navigate(`/contracts/${contractId}/edit`);
  };

  const handleDelete = (contractId: string) => {
    deleteContract.mutate(contractId);
  };

  const formatCurrency = (cents: number | null) => {
    if (!cents) return 'N/A';
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatPercentage = (pct: number | null) => {
    if (!pct) return 'N/A';
    return `${pct.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contracts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Contracts</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contracts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {contracts.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No contracts found</h3>
            <p className="text-muted-foreground mb-4">
              {search ? 'No contracts match your search criteria.' : 'Get started by creating your first contract.'}
            </p>
            {!search && (
              <Button onClick={() => navigate('/contracts/new')}>
                Create Contract
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {contracts.map((contract) => {
              const isExpanded = expandedContracts.has(contract.id);
              return (
                <Collapsible key={contract.id} open={isExpanded} onOpenChange={() => toggleExpanded(contract.id)}>
                  <div className="border rounded-lg bg-background">
                    <CollapsibleTrigger className="w-full p-4 text-left hover:bg-muted/50 flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium">{contract.title}</h3>
                        <Badge variant={statusColors[contract.status as keyof typeof statusColors] || "secondary"}>
                          {statusLabels[contract.status as keyof typeof statusLabels] || contract.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">#{contract.contract_number}</span>
                        {isExpanded ? (
                          <Minus className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                        ) : (
                          <Plus className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                        )}
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="px-4 pb-4 border-t border-border/50">
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{contract.locations?.name || 'No location'}</span>
                            <span>Revenue Share: {formatPercentage(contract.revenue_share_pct)}</span>
                            <span>Flat Commission: {formatCurrency(contract.commission_flat_cents)}</span>
                            <span>Term: {contract.term_months ? `${contract.term_months} months` : 'N/A'}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Created: {format(new Date(contract.created_at), 'MMM dd, yyyy')}
                            {contract.signed_at && (
                              <span className="ml-4">
                                Signed: {format(new Date(contract.signed_at), 'MMM dd, yyyy')}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <Button variant="outline" size="sm" onClick={() => handleView(contract.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleEdit(contract.id)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            {(contract as any).contract_file_url && (
                              <Button variant="outline" size="sm" onClick={() => window.open((contract as any).contract_file_url, '_blank')}>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}