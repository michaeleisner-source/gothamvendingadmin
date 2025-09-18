import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Banknote, AlertTriangle, CheckCircle, Plus, Calendar, TrendingUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Collection = {
  id: string;
  collection_date: string;
  machine_id: string;
  machine_name?: string;
  collected_amount_cents: number;
  expected_amount_cents?: number;
  deposited_amount_cents?: number;
  discrepancy_cents?: number;
  collector_id?: string;
  collection_notes?: string;
  deposited_at?: string;
  deposit_reference?: string;
};

type Machine = {
  id: string;
  name: string;
};

function formatCurrency(cents?: number | null) {
  const value = typeof cents === "number" ? cents : 0;
  return (value / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export default function CashCollection() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Form state
  const [selectedMachine, setSelectedMachine] = useState("");
  const [collectionDate, setCollectionDate] = useState(new Date().toISOString().slice(0, 10));
  const [collectedAmount, setCollectedAmount] = useState("");
  const [expectedAmount, setExpectedAmount] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Load collections and machines separately
      const [collectionsResult, machinesResult] = await Promise.all([
        supabase
          .from('cash_collections')
          .select('*')
          .order('collection_date', { ascending: false })
          .limit(50),
        supabase
          .from('machines')
          .select('id, name')
          .order('name')
      ]);

      if (collectionsResult.error) throw collectionsResult.error;
      if (machinesResult.error) throw machinesResult.error;

      const machineMap = new Map(
        (machinesResult.data || []).map(m => [m.id, m.name])
      );

      const formattedCollections = (collectionsResult.data || []).map(c => ({
        ...c,
        machine_name: machineMap.get(c.machine_id)
      }));

      setCollections(formattedCollections);
      setMachines(machinesResult.data || []);

    } catch (error: any) {
      console.error('Error loading cash collection data:', error);
      toast({
        title: "Error",
        description: "Failed to load cash collection data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!selectedMachine || !collectedAmount) {
      toast({
        title: "Error",
        description: "Please fill in required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const collectedCents = Math.round(parseFloat(collectedAmount) * 100);
      const expectedCents = expectedAmount ? Math.round(parseFloat(expectedAmount) * 100) : null;
      const discrepancyCents = expectedCents ? collectedCents - expectedCents : null;

      // Get current user's org_id (required field)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to record collections.",
          variant: "destructive",
        });
        return;
      }

      // Get user's org_id from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();

      if (!profile?.org_id) {
        toast({
          title: "Error",
          description: "Unable to determine organization.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('cash_collections')
        .insert({
          org_id: profile.org_id,
          machine_id: selectedMachine,
          collection_date: collectionDate,
          collected_amount_cents: collectedCents,
          expected_amount_cents: expectedCents,
          discrepancy_cents: discrepancyCents,
          collection_notes: notes || null,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Cash collection recorded successfully.",
      });

      // Reset form
      setSelectedMachine("");
      setCollectedAmount("");
      setExpectedAmount("");
      setNotes("");
      setDialogOpen(false);
      
      // Reload data
      loadData();

    } catch (error: any) {
      console.error('Error saving cash collection:', error);
      toast({
        title: "Error",
        description: "Failed to save cash collection.",
        variant: "destructive",
      });
    }
  }

  const totals = collections.reduce((acc, collection) => ({
    collected: acc.collected + collection.collected_amount_cents,
    expected: acc.expected + (collection.expected_amount_cents || 0),
    discrepancies: acc.discrepancies + Math.abs(collection.discrepancy_cents || 0),
  }), { collected: 0, expected: 0, discrepancies: 0 });

  const collectionsWithDiscrepancies = collections.filter(c => c.discrepancy_cents && Math.abs(c.discrepancy_cents) > 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cash Collections</h1>
          <p className="text-muted-foreground">Track physical cash collections from vending machines</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Record Collection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Cash Collection</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="machine">Machine *</Label>
                <Select value={selectedMachine} onValueChange={setSelectedMachine}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a machine" />
                  </SelectTrigger>
                  <SelectContent>
                    {machines.map(machine => (
                      <SelectItem key={machine.id} value={machine.id}>
                        {machine.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="collection-date">Collection Date *</Label>
                <Input
                  id="collection-date"
                  type="date"
                  value={collectionDate}
                  onChange={(e) => setCollectionDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="collected-amount">Collected Amount * ($)</Label>
                <Input
                  id="collected-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={collectedAmount}
                  onChange={(e) => setCollectedAmount(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="expected-amount">Expected Amount ($)</Label>
                <Input
                  id="expected-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={expectedAmount}
                  onChange={(e) => setExpectedAmount(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional notes about this collection..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Record Collection
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-success">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
            <Banknote className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(totals.collected)}</div>
            <p className="text-xs text-muted-foreground">Physical cash collected</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-info">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expected Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">{formatCurrency(totals.expected)}</div>
            <p className="text-xs text-muted-foreground">Based on sales data</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Discrepancies</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{formatCurrency(totals.discrepancies)}</div>
            <p className="text-xs text-muted-foreground">{collectionsWithDiscrepancies.length} collections affected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collections</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{collections.length}</div>
            <p className="text-xs text-muted-foreground">Recent collections</p>
          </CardContent>
        </Card>
      </div>

      {/* Collections Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Collections</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : collections.length === 0 ? (
            <div className="text-center py-8">
              <Banknote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No cash collections recorded yet.</p>
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-border">
                    <th className="py-3 pr-4 font-medium">Date</th>
                    <th className="py-3 pr-4 font-medium">Machine</th>
                    <th className="py-3 pr-4 font-medium">Collected</th>
                    <th className="py-3 pr-4 font-medium">Expected</th>
                    <th className="py-3 pr-4 font-medium">Variance</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {collections.map((collection) => {
                    const hasDiscrepancy = collection.discrepancy_cents && Math.abs(collection.discrepancy_cents) > 0;
                    const discrepancyType = collection.discrepancy_cents && collection.discrepancy_cents > 0 ? 'over' : 'under';
                    
                    return (
                      <tr key={collection.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                        <td className="py-3 pr-4">
                          {new Date(collection.collection_date).toLocaleDateString()}
                        </td>
                        <td className="py-3 pr-4 font-medium">
                          {collection.machine_name || collection.machine_id}
                        </td>
                        <td className="py-3 pr-4 text-success font-semibold">
                          {formatCurrency(collection.collected_amount_cents)}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {collection.expected_amount_cents ? formatCurrency(collection.expected_amount_cents) : '—'}
                        </td>
                        <td className="py-3 pr-4">
                          {collection.discrepancy_cents ? (
                            <span className={collection.discrepancy_cents >= 0 ? 'text-success' : 'text-destructive'}>
                              {collection.discrepancy_cents >= 0 ? '+' : ''}{formatCurrency(collection.discrepancy_cents)}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="py-3 pr-4">
                          {hasDiscrepancy ? (
                            <Badge variant={discrepancyType === 'over' ? 'default' : 'destructive'}>
                              {discrepancyType === 'over' ? 'Over' : 'Under'}
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Match
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 text-muted-foreground text-xs">
                          {collection.collection_notes || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}