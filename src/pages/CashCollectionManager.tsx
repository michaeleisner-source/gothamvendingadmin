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
import { HelpTooltip, HelpTooltipProvider } from "@/components/ui/HelpTooltip";

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
    <HelpTooltipProvider>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Cash Collection Manager</h1>
            <HelpTooltip content="Track and manage cash collections from your vending machines. Record collection amounts, monitor discrepancies, track deposit status, and generate collection reports. Compare expected vs actual cash amounts." />
          </div>
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
              <div className="text-2xl font-bold text-blue-600">
                ${(totalExpected / 100).toFixed(2)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Discrepancy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
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

        {/* Collections Table */}
        <Card>
          <CardHeader>
            <CardTitle>Cash Collections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {collections.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No cash collections recorded for {format(selectedDate, 'MMMM yyyy')}
                </p>
              ) : (
                <div className="space-y-2">
                  {collections.map((collection) => (
                    <CollectionRow
                      key={collection.id}
                      collection={collection}
                      onMarkDeposited={markAsDeposited}
                    />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Record Collection Form */}
        {showForm && (
          <Card>
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
                      value={form.machine_id}
                      onChange={(e) => setForm({ ...form, machine_id: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                      required
                    >
                      <option value="">Select a machine</option>
                      {machines.map((machine) => (
                        <option key={machine.id} value={machine.id}>
                          {machine.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="date">Collection Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={format(form.collection_date, 'yyyy-MM-dd')}
                      onChange={(e) => setForm({ ...form, collection_date: new Date(e.target.value) })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="collected">Collected Amount ($) *</Label>
                    <Input
                      id="collected"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.collected_amount}
                      onChange={(e) => setForm({ ...form, collected_amount: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="expected">Expected Amount ($)</Label>
                    <Input
                      id="expected"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.expected_amount}
                      onChange={(e) => setForm({ ...form, expected_amount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="deposited">Deposited Amount ($)</Label>
                    <Input
                      id="deposited"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.deposited_amount}
                      onChange={(e) => setForm({ ...form, deposited_amount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reference">Deposit Reference</Label>
                    <Input
                      id="reference"
                      value={form.deposit_reference}
                      onChange={(e) => setForm({ ...form, deposit_reference: e.target.value })}
                      placeholder="Check #, Transaction ID, etc."
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Collection Notes</Label>
                  <Textarea
                    id="notes"
                    value={form.collection_notes}
                    onChange={(e) => setForm({ ...form, collection_notes: e.target.value })}
                    placeholder="Any notes about this collection..."
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button type="submit">Record Collection</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </HelpTooltipProvider>
  );
}

// Collection Row Component
function CollectionRow({ 
  collection, 
  onMarkDeposited 
}: { 
  collection: CashCollection; 
  onMarkDeposited: (id: string, amount: number, reference: string) => void;
}) {
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [depositAmount, setDepositAmount] = useState(collection.collected_amount_cents.toString());
  const [depositReference, setDepositReference] = useState('');

  const handleDeposit = () => {
    if (!depositAmount || !depositReference) {
      toast.error("Please enter deposit amount and reference");
      return;
    }
    
    onMarkDeposited(collection.id, Math.round(parseFloat(depositAmount)), depositReference);
    setShowDepositForm(false);
    setDepositAmount('');
    setDepositReference('');
  };

  const discrepancyAmount = collection.collected_amount_cents - (collection.expected_amount_cents || 0);

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <div className="font-medium">{collection.machine_name}</div>
            <div className="text-sm text-muted-foreground">{collection.location_name}</div>
          </div>
          
          <div className="text-sm">
            <div className="font-medium">{format(new Date(collection.collection_date), 'MMM dd, yyyy')}</div>
            <div className="text-muted-foreground">
              Collected: <span className="font-medium">${(collection.collected_amount_cents / 100).toFixed(2)}</span>
            </div>
          </div>

          {collection.expected_amount_cents && (
            <div className="text-xs">
              <div>Expected: ${(collection.expected_amount_cents / 100).toFixed(2)}</div>
              <div className={cn(
                "font-medium",
                discrepancyAmount === 0 ? "text-emerald-600" :
                discrepancyAmount > 0 ? "text-blue-600" : "text-red-600"
              )}>
                {discrepancyAmount === 0 ? "Perfect match" :
                 discrepancyAmount > 0 ? `+$${(discrepancyAmount / 100).toFixed(2)} over` :
                 `$${Math.abs(discrepancyAmount) / 100} under`}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {collection.deposited_at ? (
            <div className="text-right">
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Deposited
              </Badge>
              <div className="text-xs text-muted-foreground mt-1">
                ${(collection.deposited_amount_cents! / 100).toFixed(2)}
                {collection.deposit_reference && ` (${collection.deposit_reference})`}
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDepositForm(!showDepositForm)}
            >
              Mark as Deposited
            </Button>
          )}
        </div>
      </div>

      {collection.collection_notes && (
        <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
          <strong>Notes:</strong> {collection.collection_notes}
        </div>
      )}

      {showDepositForm && (
        <div className="border-t pt-3 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor={`deposit-amount-${collection.id}`}>Deposit Amount ($)</Label>
              <Input
                id={`deposit-amount-${collection.id}`}
                type="number"
                step="0.01"
                value={(parseFloat(depositAmount) / 100).toFixed(2)}
                onChange={(e) => setDepositAmount((parseFloat(e.target.value) * 100).toString())}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor={`deposit-ref-${collection.id}`}>Deposit Reference</Label>
              <Input
                id={`deposit-ref-${collection.id}`}
                value={depositReference}
                onChange={(e) => setDepositReference(e.target.value)}
                placeholder="Check #, Transaction ID, etc."
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button size="sm" onClick={handleDeposit}>
              Confirm Deposit
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowDepositForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}