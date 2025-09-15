import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { 
  FileText, Search, Calendar, MapPin, User, 
  CheckCircle2, Clock, AlertCircle, Plus, Filter
} from "lucide-react";
import { HelpTooltip } from "@/components/ui/HelpTooltip";

interface Contract {
  id: string;
  contract_number: string;
  title: string;
  status: string;
  created_at: string;
  signed_at: string | null;
  signed_name: string | null;
  location_id: string;
  prospect_id: string | null;
  revenue_share_pct: number | null;
  commission_flat_cents: number | null;
  locations?: {
    name: string;
    contact_name: string;
  };
  prospects?: {
    business_name: string;
    contact_name: string;
  };
}

const ContractManagement = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    setLoading(true);
    try {
      // First get contracts
      const { data: contractsData, error: contractsError } = await supabase
        .from("contracts")
        .select(`
          id, contract_number, title, status, created_at, signed_at, signed_name,
          location_id, prospect_id, revenue_share_pct, commission_flat_cents
        `)
        .order("created_at", { ascending: false });

      if (contractsError) throw contractsError;

      // Get related location and prospect data
      const locationIds = [...new Set(contractsData?.map(c => c.location_id).filter(Boolean) || [])];
      const prospectIds = [...new Set(contractsData?.map(c => c.prospect_id).filter(Boolean) || [])];

      const [locationsResponse, prospectsResponse] = await Promise.all([
        locationIds.length > 0 
          ? supabase.from("locations").select("id, name, contact_name").in("id", locationIds)
          : { data: [], error: null },
        prospectIds.length > 0 
          ? supabase.from("prospects").select("id, business_name, contact_name").in("id", prospectIds)
          : { data: [], error: null }
      ]);

      // Create maps for quick lookup
      const locationsMap: { [key: string]: { name: string; contact_name: string } } = {};
      const prospectsMap: { [key: string]: { business_name: string; contact_name: string } } = {};

      locationsResponse.data?.forEach(location => {
        if (location.id) {
          locationsMap[location.id] = {
            name: location.name || '',
            contact_name: location.contact_name || ''
          };
        }
      });

      prospectsResponse.data?.forEach(prospect => {
        if (prospect.id) {
          prospectsMap[prospect.id] = {
            business_name: prospect.business_name || '',
            contact_name: prospect.contact_name || ''
          };
        }
      });

      // Map the data together
      const contractsWithRelations: Contract[] = contractsData?.map(contract => ({
        ...contract,
        locations: contract.location_id ? locationsMap[contract.location_id] : undefined,
        prospects: contract.prospect_id ? prospectsMap[contract.prospect_id] : undefined,
      })) || [];

      setContracts(contractsWithRelations);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to load contracts: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = searchTerm === "" || 
      contract.contract_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.locations?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.prospects?.business_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || contract.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string, signedAt: string | null) => {
    if (signedAt) {
      return <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Signed
      </Badge>;
    }
    
    switch (status) {
      case "draft":
        return <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          Draft
        </Badge>;
      case "sent":
        return <Badge variant="outline">
          <AlertCircle className="h-3 w-3 mr-1" />
          Pending
        </Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (cents: number | null) => {
    if (!cents) return "N/A";
    return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  const formatPercent = (value: number | null) => {
    if (!value) return "N/A";
    return `${value.toFixed(2)}%`;
  };

  const stats = {
    total: contracts.length,
    signed: contracts.filter(c => c.signed_at).length,
    draft: contracts.filter(c => c.status === "draft").length,
    pending: contracts.filter(c => c.status === "sent" && !c.signed_at).length,
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Contract Management
          </h1>
          <p className="text-muted-foreground">
            Manage vending service agreements and contract lifecycle
          </p>
        </div>
        <Link to="/prospects/convert">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Contract
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All contracts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Signed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.signed}</div>
            <p className="text-xs text-muted-foreground">Active agreements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
            <p className="text-xs text-muted-foreground">Being prepared</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting signature</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Contract List
              <HelpTooltip content="All vending service agreements with their current status. Click on any contract to view details." />
            </CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contracts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Pending</option>
                <option value="signed">Signed</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredContracts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Contract #</th>
                    <th className="text-left p-3">Location/Business</th>
                    <th className="text-left p-3">Contact</th>
                    <th className="text-center p-3">Status</th>
                    <th className="text-right p-3">Commission</th>
                    <th className="text-left p-3">Created</th>
                    <th className="text-center p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContracts.map((contract) => (
                    <tr key={contract.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <div className="font-medium">{contract.contract_number}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-32">
                          {contract.title}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {contract.locations?.name || contract.prospects?.business_name || "Unknown"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {contract.signed_name || 
                             contract.locations?.contact_name || 
                             contract.prospects?.contact_name || 
                             "No contact"}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        {getStatusBadge(contract.status, contract.signed_at)}
                      </td>
                      <td className="p-3 text-right">
                        {contract.revenue_share_pct 
                          ? formatPercent(contract.revenue_share_pct)
                          : contract.commission_flat_cents
                          ? formatCurrency(contract.commission_flat_cents)
                          : "None"
                        }
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{new Date(contract.created_at).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <Link to={`/contracts/${contract.id}`}>
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No contracts found</p>
              <p className="text-sm">
                {searchTerm || statusFilter !== "all" 
                  ? "Try adjusting your search or filters"
                  : "Start by converting prospects to create contracts"
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ContractManagement;