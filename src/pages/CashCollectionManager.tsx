import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, DollarSign, TrendingUp, Calendar, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CashCollection {
  id: string;
  machine_id: string;
  collection_date: string;
  collected_amount_cents: number;
  expected_amount_cents?: number;
  deposited_amount_cents?: number;
  discrepancy_cents?: number;
  collector_id?: string;
  route_id?: string;
  collection_notes?: string;
  deposited_at?: string;
  deposit_reference?: string;
  created_at: string;
}

interface Machine {
  id: string;
  name: string;
}

export default function CashCollectionManager() {
  const [collections, setCollections] = useState<CashCollection[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    machine_id: "",
    collection_date: new Date().toISOString().split('T')[0],
    collected_amount: "",
    expected_amount: "",
    deposited_amount: "",
    collection_notes: "",
    deposit_reference: ""
  });

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("breadcrumbs:set", { detail: { title: "Cash Collection" } }));
    loadCollections();
    loadMachines();
  }, []);

  const loadCollections = async () => {
    try {
      const { data, error } = await supabase
        .from('cash_collections')
        .select('*')
        .order('collection_date', { ascending: false });

      if (error) throw error;
      setCollections(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading collections",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMachines = async () => {
    try {
      const { data, error } = await supabase
        .from('machines')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setMachines(data || []);
    } catch (error: any) {
      console.error('Error loading machines:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const collectionData = {
        machine_id: formData.machine_id,
        collection_date: formData.collection_date,
        collected_amount_cents: Math.round(parseFloat(formData.collected_amount) * 100),
        expected_amount_cents: formData.expected_amount ? Math.round(parseFloat(formData.expected_amount) * 100) : null,
        deposited_amount_cents: formData.deposited_amount ? Math.round(parseFloat(formData.deposited_amount) * 100) : null,
        collection_notes: formData.collection_notes || null,
        deposit_reference: formData.deposit_reference || null,
        discrepancy_cents: formData.expected_amount && formData.collected_amount ? 
          Math.round((parseFloat(formData.collected_amount) - parseFloat(formData.expected_amount)) * 100) : null,
        org_id: '00000000-0000-0000-0000-000000000000' // Default org for demo
      };

      const { error } = await supabase
        .from('cash_collections')
        .insert(collectionData);

      if (error) throw error;

      toast({
        title: "Collection recorded",
        description: "Cash collection has been recorded successfully.",
      });

      setDialogOpen(false);
      resetForm();
      loadCollections();
    } catch (error: any) {
      toast({
        title: "Error recording collection",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      machine_id: "",
      collection_date: new Date().toISOString().split('T')[0],
      collected_amount: "",
      expected_amount: "",
      deposited_amount: "",
      collection_notes: "",
      deposit_reference: ""
    });
  };

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  const getMachineName = (machineId: string) => {
    const machine = machines.find(m => m.id === machineId);
    return machine ? machine.name : 'Unknown Machine';
  };

  const getDiscrepancyBadge = (discrepancyCents?: number) => {
    if (discrepancyCents === null || discrepancyCents === undefined) return null;
    
    if (discrepancyCents === 0) {
      return <Badge variant="default">Exact</Badge>;
    } else if (discrepancyCents > 0) {
      return <Badge variant="default">+{formatCurrency(discrepancyCents)}</Badge>;
    } else {
      return <Badge variant="destructive">{formatCurrency(discrepancyCents)}</Badge>;
    }
  };

  const totalCollected = collections.reduce((sum, c) => sum + c.collected_amount_cents, 0);
  const todayCollections = collections.filter(c => 
    new Date(c.collection_date).toDateString() === new Date().toDateString()
  );

  if (loading && collections.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <DollarSign className="mr-3 h-8 w-8" />
            Cash Collection Manager
          </h1>
          <p className="text-muted-foreground">Record and track cash collections from vending machines</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Record Collection
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Record Cash Collection</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="machine_id">Machine *</Label>
                  <Select value={formData.machine_id} onValueChange={(value) => setFormData({ ...formData, machine_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select machine" />
                    </SelectTrigger>
                    <SelectContent>
                      {machines.map((machine) => (
                        <SelectItem key={machine.id} value={machine.id}>
                          {machine.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="collection_date">Collection Date *</Label>
                  <Input
                    id="collection_date"
                    type="date"
                    value={formData.collection_date}
                    onChange={(e) => setFormData({ ...formData, collection_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="collected_amount">Amount Collected *</Label>
                  <Input
                    id="collected_amount"
                    type="number"
                    step="0.01"
                    value={formData.collected_amount}
                    onChange={(e) => setFormData({ ...formData, collected_amount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="expected_amount">Expected Amount</Label>
                  <Input
                    id="expected_amount"
                    type="number"
                    step="0.01"
                    value={formData.expected_amount}
                    onChange={(e) => setFormData({ ...formData, expected_amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="deposited_amount">Amount Deposited</Label>
                  <Input
                    id="deposited_amount"
                    type="number"
                    step="0.01"
                    value={formData.deposited_amount}
                    onChange={(e) => setFormData({ ...formData, deposited_amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="deposit_reference">Deposit Reference</Label>
                  <Input
                    id="deposit_reference"
                    value={formData.deposit_reference}
                    onChange={(e) => setFormData({ ...formData, deposit_reference: e.target.value })}
                    placeholder="Deposit slip #, etc."
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="collection_notes">Notes</Label>
                  <Textarea
                    id="collection_notes"
                    value={formData.collection_notes}
                    onChange={(e) => setFormData({ ...formData, collection_notes: e.target.value })}
                    placeholder="Any additional notes about the collection..."
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  Record Collection
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(totalCollected)}</div>
            <p className="text-xs text-muted-foreground">All time collections</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Collections</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayCollections.length}</div>
            <p className="text-xs text-muted-foreground">Collections recorded today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Amount</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(todayCollections.reduce((sum, c) => sum + c.collected_amount_cents, 0))}
            </div>
            <p className="text-xs text-muted-foreground">Cash collected today</p>
          </CardContent>
        </Card>
      </div>

      {/* Collections Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Collections ({collections.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {collections.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No collections recorded yet. Start by recording your first cash collection.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Machine</TableHead>
                    <TableHead>Collected</TableHead>
                    <TableHead>Expected</TableHead>
                    <TableHead>Discrepancy</TableHead>
                    <TableHead>Deposited</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collections.map((collection) => (
                    <TableRow key={collection.id}>
                      <TableCell>{formatDate(collection.collection_date)}</TableCell>
                      <TableCell className="font-medium">{getMachineName(collection.machine_id)}</TableCell>
                      <TableCell className="font-medium text-success">
                        {formatCurrency(collection.collected_amount_cents)}
                      </TableCell>
                      <TableCell>
                        {collection.expected_amount_cents ? formatCurrency(collection.expected_amount_cents) : '-'}
                      </TableCell>
                      <TableCell>{getDiscrepancyBadge(collection.discrepancy_cents)}</TableCell>
                      <TableCell>
                        {collection.deposited_amount_cents ? formatCurrency(collection.deposited_amount_cents) : '-'}
                      </TableCell>
                      <TableCell className="max-w-48 truncate">
                        {collection.collection_notes || '-'}
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
}