import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import { useState, useEffect } from "react";

export default function ContractEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: "",
    contract_number: "",
    status: "draft",
    revenue_share_pct: 0,
    commission_flat_cents: 0,
    term_months: 12,
    auto_renew: true,
    cancellation_notice_days: 30,
  });

  // Fetch contract data
  const { data: contract, isLoading } = useQuery({
    queryKey: ['contract', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          locations!contracts_location_id_fkey (
            id,
            name
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch locations for dropdown
  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  // Update form when contract loads
  useEffect(() => {
    if (contract) {
      setFormData({
        title: contract.title || "",
        contract_number: contract.contract_number || "",
        status: contract.status || "draft",
        revenue_share_pct: contract.revenue_share_pct || 0,
        commission_flat_cents: contract.commission_flat_cents || 0,
        term_months: contract.term_months || 12,
        auto_renew: contract.auto_renew ?? true,
        cancellation_notice_days: contract.cancellation_notice_days || 30,
      });
    }
  }, [contract]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('contracts')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contract', id] });
      toast({
        title: "Contract updated",
        description: "The contract has been successfully updated.",
      });
      navigate('/contracts');
    },
    onError: (error) => {
      toast({
        title: "Error updating contract",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="p-6">Loading contract...</div>;
  }

  if (!contract) {
    return <div className="p-6">Contract not found</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/contracts')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Contract</h1>
          <p className="text-muted-foreground">
            Update contract details and terms
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Contract Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contract_number">Contract Number</Label>
                <Input
                  id="contract_number"
                  value={formData.contract_number}
                  onChange={(e) => setFormData({ ...formData, contract_number: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending Signature</SelectItem>
                  <SelectItem value="signed">Signed</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="revenue_share_pct">Revenue Share (%)</Label>
                <Input
                  id="revenue_share_pct"
                  type="number"
                  step="0.01"
                  value={formData.revenue_share_pct}
                  onChange={(e) => setFormData({ ...formData, revenue_share_pct: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commission_flat_cents">Flat Commission (cents)</Label>
                <Input
                  id="commission_flat_cents"
                  type="number"
                  value={formData.commission_flat_cents}
                  onChange={(e) => setFormData({ ...formData, commission_flat_cents: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contract Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="term_months">Term (months)</Label>
                <Input
                  id="term_months"
                  type="number"
                  value={formData.term_months}
                  onChange={(e) => setFormData({ ...formData, term_months: parseInt(e.target.value) || 12 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cancellation_notice_days">Cancellation Notice (days)</Label>
                <Input
                  id="cancellation_notice_days"
                  type="number"
                  value={formData.cancellation_notice_days}
                  onChange={(e) => setFormData({ ...formData, cancellation_notice_days: parseInt(e.target.value) || 30 })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/contracts')}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}