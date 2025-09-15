import { useState } from "react";
import { useOptimizedQuery } from "@/hooks/useOptimizedQuery";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercentage } from "@/lib/insurance-utils";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface InsuranceAllocation {
  id: string;
  policy_id: string;
  level: 'global' | 'location' | 'machine';
  location_id: string | null;
  machine_id: string | null;
  allocated_pct_bps: number | null;
  flat_monthly_cents: number | null;
  effective_start: string | null;
  effective_end: string | null;
  insurance_policies: {
    name: string;
  };
  locations?: {
    name: string;
  } | null;
  machines?: {
    name: string;
  } | null;
}

export function InsuranceAllocations() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState<InsuranceAllocation | null>(null);
  const [allocationType, setAllocationType] = useState<'percentage' | 'flat'>('percentage');
  const { toast } = useToast();

  const { data: allocations, isLoading, refetch } = useOptimizedQuery({
    queryKey: ["insurance-allocations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("insurance_allocations")
        .select(`
          *,
          insurance_policies(name),
          locations(name),
          machines(name)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as InsuranceAllocation[];
    },
  });

  const { data: policies } = useOptimizedQuery({
    queryKey: ["policies-for-allocation"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("insurance_policies")
        .select("id, name")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const { data: locations } = useOptimizedQuery({
    queryKey: ["locations-for-allocation"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locations")
        .select("id, name")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const { data: machines } = useOptimizedQuery({
    queryKey: ["machines-for-allocation"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("machines")
        .select("id, name")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const level = formData.get("level") as string;
    const allocationData: any = {
      policy_id: formData.get("policy_id") as string,
      level,
      location_id: level === 'location' ? formData.get("location_id") as string : null,
      machine_id: level === 'machine' ? formData.get("machine_id") as string : null,
      effective_start: formData.get("effective_start") as string || null,
      effective_end: formData.get("effective_end") as string || null,
    };

    if (allocationType === 'percentage') {
      allocationData.allocated_pct_bps = Math.round(parseFloat(formData.get("percentage") as string || "0") * 100);
      allocationData.flat_monthly_cents = null;
    } else {
      allocationData.flat_monthly_cents = Math.round(parseFloat(formData.get("flat_amount") as string || "0") * 100);
      allocationData.allocated_pct_bps = null;
    }

    try {
      // Get current org_id
      const { data: orgData, error: orgError } = await supabase.rpc('current_org');
      if (orgError) throw orgError;
      
      const dataWithOrg = { ...allocationData, org_id: orgData };
      
      if (editingAllocation) {
        const { error } = await supabase
          .from("insurance_allocations")
          .update(allocationData)
          .eq("id", editingAllocation.id);
        if (error) throw error;
        toast({ title: "Allocation updated successfully" });
      } else {
        const { error } = await supabase
          .from("insurance_allocations")
          .insert(dataWithOrg);
        if (error) throw error;
        toast({ title: "Allocation created successfully" });
      }
      
      setIsCreating(false);
      setEditingAllocation(null);
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("insurance_allocations")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      toast({ title: "Allocation deleted successfully" });
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const AllocationForm = ({ allocation }: { allocation?: InsuranceAllocation }) => {
    const [selectedLevel, setSelectedLevel] = useState<string>(allocation?.level || 'global');
    const [currentAllocationType, setCurrentAllocationType] = useState<'percentage' | 'flat'>(
      allocation?.allocated_pct_bps !== null ? 'percentage' : 'flat'
    );

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="policy_id">Insurance Policy *</Label>
          <Select name="policy_id" defaultValue={allocation?.policy_id || ""} required>
            <SelectTrigger>
              <SelectValue placeholder="Select a policy" />
            </SelectTrigger>
            <SelectContent>
              {policies?.map((policy) => (
                <SelectItem key={policy.id} value={policy.id}>
                  {policy.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="level">Allocation Level *</Label>
          <Select name="level" value={selectedLevel} onValueChange={setSelectedLevel} required>
            <SelectTrigger>
              <SelectValue placeholder="Select allocation level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">Global (All Machines)</SelectItem>
              <SelectItem value="location">Location</SelectItem>
              <SelectItem value="machine">Specific Machine</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedLevel === 'location' && (
          <div>
            <Label htmlFor="location_id">Location *</Label>
            <Select name="location_id" defaultValue={allocation?.location_id || ""} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a location" />
              </SelectTrigger>
              <SelectContent>
                {locations?.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {selectedLevel === 'machine' && (
          <div>
            <Label htmlFor="machine_id">Machine *</Label>
            <Select name="machine_id" defaultValue={allocation?.machine_id || ""} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a machine" />
              </SelectTrigger>
              <SelectContent>
                {machines?.map((machine) => (
                  <SelectItem key={machine.id} value={machine.id}>
                    {machine.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label>Allocation Method *</Label>
          <Select value={currentAllocationType} onValueChange={(value: 'percentage' | 'flat') => setCurrentAllocationType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage of Premium</SelectItem>
              <SelectItem value="flat">Flat Monthly Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {currentAllocationType === 'percentage' ? (
          <div>
            <Label htmlFor="percentage">Percentage (%) *</Label>
            <Input
              id="percentage"
              name="percentage"
              type="number"
              step="0.01"
              min="0"
              max="100"
              defaultValue={allocation?.allocated_pct_bps ? (allocation.allocated_pct_bps / 100).toFixed(2) : ""}
              placeholder="e.g., 50.00"
              required
            />
          </div>
        ) : (
          <div>
            <Label htmlFor="flat_amount">Flat Monthly Amount ($) *</Label>
            <Input
              id="flat_amount"
              name="flat_amount"
              type="number"
              step="0.01"
              min="0"
              defaultValue={allocation?.flat_monthly_cents ? (allocation.flat_monthly_cents / 100).toFixed(2) : ""}
              placeholder="e.g., 250.00"
              required
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="effective_start">Effective Start</Label>
            <Input
              id="effective_start"
              name="effective_start"
              type="date"
              defaultValue={allocation?.effective_start || ""}
            />
          </div>
          <div>
            <Label htmlFor="effective_end">Effective End</Label>
            <Input
              id="effective_end"
              name="effective_end"
              type="date"
              defaultValue={allocation?.effective_end || ""}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              setIsCreating(false);
              setEditingAllocation(null);
            }}
          >
            Cancel
          </Button>
          <Button type="submit">
            {allocation ? "Update Allocation" : "Create Allocation"}
          </Button>
        </div>
      </form>
    );
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading allocations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Insurance Allocations</h3>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Allocation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Insurance Allocation</DialogTitle>
              <DialogDescription>
                Configure how insurance costs are allocated across your operations.
              </DialogDescription>
            </DialogHeader>
            <AllocationForm />
          </DialogContent>
        </Dialog>
      </div>

      {!allocations?.length ? (
        <div className="text-center py-8 text-muted-foreground">
          No insurance allocations found. Create allocations to distribute costs.
        </div>
      ) : (
        <div className="grid gap-4">
          {allocations.map((allocation) => (
            <Card key={allocation.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {allocation.insurance_policies.name}
                      <Badge variant="secondary" className="capitalize">
                        {allocation.level}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {allocation.level === 'location' && allocation.locations?.name}
                      {allocation.level === 'machine' && allocation.machines?.name}
                      {allocation.level === 'global' && 'All machines'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={editingAllocation?.id === allocation.id} onOpenChange={(open) => !open && setEditingAllocation(null)}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => setEditingAllocation(allocation)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Edit Insurance Allocation</DialogTitle>
                          <DialogDescription>
                            Update the allocation configuration.
                          </DialogDescription>
                        </DialogHeader>
                        <AllocationForm allocation={allocation} />
                      </DialogContent>
                    </Dialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Allocation</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this allocation? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(allocation.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">Allocation Method</p>
                    <p className="font-medium">
                      {allocation.allocated_pct_bps !== null 
                        ? formatPercentage(allocation.allocated_pct_bps)
                        : formatCurrency(allocation.flat_monthly_cents || 0) + "/month"
                      }
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Effective Period</p>
                    <p>
                      {allocation.effective_start || "—"} to {allocation.effective_end || "Open"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}