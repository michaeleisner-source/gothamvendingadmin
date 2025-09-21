import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Calendar, MapPin } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';

interface Machine {
  id: string;
  name: string;
  location_name?: string;
}

export default function CashCollectionPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachine, setSelectedMachine] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadMachines();
  }, []);

  const loadMachines = async () => {
    try {
      const { data, error } = await supabase
        .from('machines')
        .select(`
          id, 
          name,
          locations(name)
        `)
        .order('name');

      if (error) throw error;
      
      const machinesWithLocation = data?.map(m => ({
        id: m.id,
        name: m.name,
        location_name: m.locations?.name
      })) || [];
      
      setMachines(machinesWithLocation);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load machines: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachine || !amount) return;

    setLoading(true);
    try {
      const amountCents = Math.round(parseFloat(amount) * 100);
      
      const { error } = await supabase
        .from('cash_collections')
        .insert({
          machine_id: selectedMachine,
          collection_date: new Date().toISOString().split('T')[0],
          collected_amount_cents: amountCents,
          collection_notes: notes || null,
          org_id: '', // Will be set by database trigger
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Cash collection recorded successfully",
      });

      // Reset form
      setSelectedMachine('');
      setAmount('');
      setNotes('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to record collection: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <PageHeader 
        title="Cash Collection"
        description="Record cash collections from vending machines"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            New Cash Collection
          </CardTitle>
          <CardDescription>
            Enter the details of your cash collection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="machine">Machine</Label>
              <Select value={selectedMachine} onValueChange={setSelectedMachine}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a machine" />
                </SelectTrigger>
                <SelectContent>
                  {machines.map((machine) => (
                    <SelectItem key={machine.id} value={machine.id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{machine.name}</span>
                        {machine.location_name && (
                          <span className="text-muted-foreground">
                            ({machine.location_name})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount Collected ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes about this collection..."
                rows={3}
              />
            </div>

            <Button 
              type="submit" 
              disabled={!selectedMachine || !amount || loading}
              className="w-full"
            >
              {loading ? "Recording..." : "Record Collection"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}