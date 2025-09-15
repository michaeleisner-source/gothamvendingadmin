import { useState } from "react";
import { useOptimizedQuery } from "@/hooks/useOptimizedQuery";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/insurance-utils";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface InsurancePolicy {
  id: string;
  name: string;
  carrier: string | null;
  policy_number: string | null;
  coverage_start: string;
  coverage_end: string;
  monthly_premium_cents: number;
  document_url: string | null;
  notes: string | null;
  created_at: string;
}

export function InsurancePolicies() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<InsurancePolicy | null>(null);
  const { toast } = useToast();

  const { data: policies, isLoading, refetch } = useOptimizedQuery({
    queryKey: ["insurance-policies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("insurance_policies")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as InsurancePolicy[];
    },
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const policyData = {
      name: formData.get("name") as string,
      carrier: formData.get("carrier") as string || null,
      policy_number: formData.get("policy_number") as string || null,
      coverage_start: formData.get("coverage_start") as string,
      coverage_end: formData.get("coverage_end") as string,
      monthly_premium_cents: Math.round(parseFloat(formData.get("monthly_premium") as string || "0") * 100),
      document_url: formData.get("document_url") as string || null,
      notes: formData.get("notes") as string || null,
    };

    try {
      // Get current org_id
      const { data: orgData, error: orgError } = await supabase.rpc('current_org');
      if (orgError) throw orgError;
      
      const dataWithOrg = { ...policyData, org_id: orgData };
      
      if (editingPolicy) {
        const { error } = await supabase
          .from("insurance_policies")
          .update(policyData)
          .eq("id", editingPolicy.id);
        if (error) throw error;
        toast({ title: "Policy updated successfully" });
      } else {
        const { error } = await supabase
          .from("insurance_policies")
          .insert(dataWithOrg);
        if (error) throw error;
        toast({ title: "Policy created successfully" });
      }
      
      setIsCreating(false);
      setEditingPolicy(null);
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const PolicyForm = ({ policy }: { policy?: InsurancePolicy }) => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Policy Name *</Label>
          <Input
            id="name"
            name="name"
            defaultValue={policy?.name || ""}
            placeholder="e.g., General Liability 2025"
            required
          />
        </div>
        <div>
          <Label htmlFor="carrier">Insurance Carrier</Label>
          <Input
            id="carrier"
            name="carrier"
            defaultValue={policy?.carrier || ""}
            placeholder="e.g., The Hartford"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="policy_number">Policy Number</Label>
          <Input
            id="policy_number"
            name="policy_number"
            defaultValue={policy?.policy_number || ""}
          />
        </div>
        <div>
          <Label htmlFor="monthly_premium">Monthly Premium ($) *</Label>
          <Input
            id="monthly_premium"
            name="monthly_premium"
            type="number"
            step="0.01"
            min="0"
            defaultValue={policy ? (policy.monthly_premium_cents / 100).toFixed(2) : ""}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="coverage_start">Coverage Start *</Label>
          <Input
            id="coverage_start"
            name="coverage_start"
            type="date"
            defaultValue={policy?.coverage_start || ""}
            required
          />
        </div>
        <div>
          <Label htmlFor="coverage_end">Coverage End *</Label>
          <Input
            id="coverage_end"
            name="coverage_end"
            type="date"
            defaultValue={policy?.coverage_end || ""}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="document_url">Policy Document URL</Label>
        <Input
          id="document_url"
          name="document_url"
          type="url"
          defaultValue={policy?.document_url || ""}
          placeholder="https://..."
        />
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={policy?.notes || ""}
          placeholder="Additional policy information..."
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => {
            setIsCreating(false);
            setEditingPolicy(null);
          }}
        >
          Cancel
        </Button>
        <Button type="submit">
          {policy ? "Update Policy" : "Create Policy"}
        </Button>
      </div>
    </form>
  );

  if (isLoading) {
    return <div className="text-center py-8">Loading policies...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Insurance Policies</h3>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Policy
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Insurance Policy</DialogTitle>
              <DialogDescription>
                Add a new insurance policy with coverage details and premium information.
              </DialogDescription>
            </DialogHeader>
            <PolicyForm />
          </DialogContent>
        </Dialog>
      </div>

      {!policies?.length ? (
        <div className="text-center py-8 text-muted-foreground">
          No insurance policies found. Create your first policy to get started.
        </div>
      ) : (
        <div className="grid gap-4">
          {policies.map((policy) => (
            <Card key={policy.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {policy.name}
                      {new Date(policy.coverage_end) < new Date() && (
                        <Badge variant="destructive">Expired</Badge>
                      )}
                    </CardTitle>
                    {policy.carrier && (
                      <p className="text-sm text-muted-foreground">{policy.carrier}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {policy.document_url && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={policy.document_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Dialog open={editingPolicy?.id === policy.id} onOpenChange={(open) => !open && setEditingPolicy(null)}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => setEditingPolicy(policy)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Edit Insurance Policy</DialogTitle>
                          <DialogDescription>
                            Update the policy details and coverage information.
                          </DialogDescription>
                        </DialogHeader>
                        <PolicyForm policy={policy} />
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">Policy Number</p>
                    <p>{policy.policy_number || "—"}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Monthly Premium</p>
                    <p className="font-medium">{formatCurrency(policy.monthly_premium_cents)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Coverage Period</p>
                    <p>{format(new Date(policy.coverage_start), "MMM d, yyyy")} - {format(new Date(policy.coverage_end), "MMM d, yyyy")}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Created</p>
                    <p>{format(new Date(policy.created_at), "MMM d, yyyy")}</p>
                  </div>
                </div>
                {policy.notes && (
                  <div className="mt-4">
                    <p className="font-medium text-muted-foreground text-sm">Notes</p>
                    <p className="text-sm">{policy.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}