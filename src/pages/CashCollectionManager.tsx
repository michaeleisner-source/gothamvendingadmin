import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  DollarSign, 
  Plus, 
  Calendar as CalendarIcon, 
  MapPin, 
  AlertTriangle,
  CheckCircle,
  Download,
  TrendingUp,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface CashCollection {
  id: string;
  machine_id: string;
  machine_name: string;
  location_name: string;
  collection_date: string;
  collected_amount_cents: number;
  expected_amount_cents: number | null;
  deposited_amount_cents: number | null;
  discrepancy_cents: number;
  collection_notes: string | null;
  deposit_reference: string | null;
  deposited_at: string | null;
  collector_name: string | null;
}

interface CollectionForm {
  machine_id: string;
  collection_date: Date;
  collected_amount: string;
  expected_amount: string;
  deposited_amount: string;
  collection_notes: string;
  deposit_reference: string;
}

export default function CashCollectionManager() {
  const [collections, setCollections] = useState<CashCollection[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [form, setForm] = useState<CollectionForm>({
    machine_id: '',
    collection_date: new Date(),
    collected_amount: '',
    expected_amount: '',
    deposited_amount: '',
    collection_notes: '',
    deposit_reference: ''
  });

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadCollections(), loadMachines()]);
    } catch (error) {
      toast.error("Failed to load cash collection data");
    } finally {
      setLoading(false);
    }
  };

  const loadCollections = async () => {
    const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

    const { data, error } = await supabase
      .from('cash_collections')
      .select('*')
      .gte('collection_date', format(startOfMonth, 'yyyy-MM-dd'))
      .lte('collection_date', format(endOfMonth, 'yyyy-MM-dd'))
      .order('collection_date', { ascending: false });

    if (error) throw error;

    // Get machine and location names separately for now
    const machineIds = [...new Set(data?.map(c => c.machine_id) || [])];
    const { data: machineData } = await supabase.from('machines').select('id, name').in('id', machineIds);
    
    setCollections(data?.map(collection => ({
      ...collection,
      machine_name: machineData?.find(m => m.id === collection.machine_id)?.name || 'Unknown',
      location_name: 'Location', // Simplified for now
      collector_name: null
    })) || []);
  };

  const loadMachines = async () => {
    const { data, error } = await supabase
      .from('machines')
      .select(`
        id,
        name,
        locations!inner(name)
      `)
      .order('name');

    if (error) throw error;
    setMachines(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.machine_id || !form.collected_amount) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      const collectionData = {
        org_id: (await supabase.from('machines').select('org_id').eq('id', form.machine_id).single()).data?.org_id,
        machine_id: form.machine_id,
        collection_date: format(form.collection_date, 'yyyy-MM-dd'),
        collected_amount_cents: Math.round(parseFloat(form.collected_amount) * 100),
        expected_amount_cents: form.expected_amount ? Math.round(parseFloat(form.expected_amount) * 100) : null,
        deposited_amount_cents: form.deposited_amount ? Math.round(parseFloat(form.deposited_amount) * 100) : null,
        collection_notes: form.collection_notes || null,
        deposit_reference: form.deposit_reference || null,
        deposited_at: form.deposited_amount ? new Date().toISOString() : null
      };

      const { error } = await supabase
        .from('cash_collections')
        .insert(collectionData);

      if (error) throw error;

      toast.success("Cash collection recorded successfully");
      setShowForm(false);
      setForm({
        machine_id: '',
        collection_date: new Date(),
        collected_amount: '',
        expected_amount: '',
        deposited_amount: '',
        collection_notes: '',
        deposit_reference: ''
      });
      loadCollections();
    } catch (error) {
      toast.error("Failed to record cash collection");
    }
  };

  const markAsDeposited = async (collectionId: string, amount: number, reference: string) => {
    try {
      const { error } = await supabase
        .from('cash_collections')
        .update({
          deposited_amount_cents: amount,
          deposit_reference: reference,
          deposited_at: new Date().toISOString()
        })
        .eq('id', collectionId);

      if (error) throw error;

      toast.success("Marked as deposited");
      loadCollections();
    } catch (error) {
      toast.error("Failed to update deposit status");
    }
  };

  const exportCollections = () => {
    const csvData = [
      ['Date', 'Machine', 'Location', 'Collected', 'Expected', 'Discrepancy', 'Deposited', 'Status', 'Notes'],
      ...collections.map(c => [
        c.collection_date,
        c.machine_name,
        c.location_name,
        (c.collected_amount_cents / 100).toFixed(2),
        c.expected_amount_cents ? (c.expected_amount_cents / 100).toFixed(2) : '',
        (c.discrepancy_cents / 100).toFixed(2),
        c.deposited_amount_cents ? (c.deposited_amount_cents / 100).toFixed(2) : '',
        c.deposited_at ? 'Deposited' : 'Pending',
        c.collection_notes || ''
      ])
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cash_collections_${format(selectedDate, 'yyyy-MM')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalCollected = collections.reduce((sum, c) => sum + c.collected_amount_cents, 0);
  const totalExpected = collections.reduce((sum, c) => sum + (c.expected_amount_cents || 0), 0);
  const totalDiscrepancy = collections.reduce((sum, c) => sum + c.discrepancy_cents, 0);
  const pendingDeposits = collections.filter(c => !c.deposited_at).length;

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cash Collection Manager</h1>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {format(selectedDate, 'MMMM yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button onClick={exportCollections} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Record Collection
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              Total Collected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              ${(totalCollected / 100).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Expected Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(totalExpected / 100).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              Discrepancy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              totalDiscrepancy === 0 ? 'text-emerald-600' :
              Math.abs(totalDiscrepancy) > 1000 ? 'text-red-600' : 'text-yellow-600'
            }`}>
              ${(totalDiscrepancy / 100).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              Pending Deposits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {pendingDeposits}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collection Form Modal */}
      {showForm && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle>Record Cash Collection</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="machine">Machine *</Label>
                  <select
                    id="machine"
                    className="w-full px-3 py-2 border border-border rounded-md"
                    value={form.machine_id}
                    onChange={(e) => setForm({...form, machine_id: e.target.value})}
                    required
                  >
                    <option value="">Select machine...</option>
                    {machines.map(machine => (
                      <option key={machine.id} value={machine.id}>
                        {machine.name} - {machine.locations?.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="collection_date">Collection Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !form.collection_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.collection_date ? format(form.collection_date, "PPP") : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={form.collection_date}
                        onSelect={(date) => date && setForm({...form, collection_date: date})}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="collected_amount">Collected Amount ($) *</Label>
                  <Input
                    id="collected_amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.collected_amount}
                    onChange={(e) => setForm({...form, collected_amount: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expected_amount">Expected Amount ($)</Label>
                  <Input
                    id="expected_amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.expected_amount}
                    onChange={(e) => setForm({...form, expected_amount: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deposited_amount">Deposited Amount ($)</Label>
                  <Input
                    id="deposited_amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.deposited_amount}
                    onChange={(e) => setForm({...form, deposited_amount: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deposit_reference">Deposit Reference</Label>
                  <Input
                    id="deposit_reference"
                    placeholder="Bank ref, check #, etc."
                    value={form.deposit_reference}
                    onChange={(e) => setForm({...form, deposit_reference: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Collection Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any notes about this collection..."
                  value={form.collection_notes}
                  onChange={(e) => setForm({...form, collection_notes: e.target.value})}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Record Collection
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Collections List */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Collections ({collections.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending Deposits ({pendingDeposits})</TabsTrigger>
          <TabsTrigger value="discrepancies">Discrepancies</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <CollectionsList 
            collections={collections} 
            onMarkDeposited={markAsDeposited}
          />
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <CollectionsList 
            collections={collections.filter(c => !c.deposited_at)}
            onMarkDeposited={markAsDeposited}
          />
        </TabsContent>

        <TabsContent value="discrepancies" className="space-y-4">
          <CollectionsList 
            collections={collections.filter(c => Math.abs(c.discrepancy_cents) > 0)}
            onMarkDeposited={markAsDeposited}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface CollectionsListProps {
  collections: CashCollection[];
  onMarkDeposited: (id: string, amount: number, reference: string) => void;
}

function CollectionsList({ collections, onMarkDeposited }: CollectionsListProps) {
  const [depositForm, setDepositForm] = useState<{id: string, amount: string, reference: string} | null>(null);

  const handleDeposit = (collection: CashCollection) => {
    setDepositForm({
      id: collection.id,
      amount: (collection.collected_amount_cents / 100).toString(),
      reference: collection.deposit_reference || ''
    });
  };

  const submitDeposit = () => {
    if (!depositForm) return;
    
    onMarkDeposited(
      depositForm.id,
      Math.round(parseFloat(depositForm.amount) * 100),
      depositForm.reference
    );
    setDepositForm(null);
  };

  if (collections.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Collections Found</h3>
          <p className="text-muted-foreground">No cash collections for the selected period.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {collections.map(collection => (
        <Card key={collection.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="font-semibold">{collection.machine_name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {collection.location_name} • {format(new Date(collection.collection_date), 'MMM dd, yyyy')}
                  </p>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Collected</span>
                    <div className="font-semibold text-emerald-600">
                      ${(collection.collected_amount_cents / 100).toFixed(2)}
                    </div>
                  </div>
                  {collection.expected_amount_cents && (
                    <div>
                      <span className="text-muted-foreground">Expected</span>
                      <div className="font-semibold">
                        ${(collection.expected_amount_cents / 100).toFixed(2)}
                      </div>
                    </div>
                  )}
                  {collection.discrepancy_cents !== 0 && (
                    <div>
                      <span className="text-muted-foreground">Discrepancy</span>
                      <div className={`font-semibold ${
                        collection.discrepancy_cents > 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        ${(collection.discrepancy_cents / 100).toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {collection.deposited_at ? (
                  <Badge variant="default" className="bg-emerald-100 text-emerald-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Deposited
                  </Badge>
                ) : (
                  <Button size="sm" onClick={() => handleDeposit(collection)}>
                    Mark Deposited
                  </Button>
                )}
              </div>
            </div>

            {collection.collection_notes && (
              <div className="mt-3 p-2 bg-muted rounded text-sm">
                <strong>Notes:</strong> {collection.collection_notes}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Deposit Form Modal */}
      {depositForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md m-4">
            <CardHeader>
              <CardTitle>Mark as Deposited</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Deposited Amount ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={depositForm.amount}
                  onChange={(e) => setDepositForm({...depositForm, amount: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Deposit Reference</Label>
                <Input
                  placeholder="Bank reference, check number, etc."
                  value={depositForm.reference}
                  onChange={(e) => setDepositForm({...depositForm, reference: e.target.value})}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={submitDeposit}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Deposited
                </Button>
                <Button variant="outline" onClick={() => setDepositForm(null)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}