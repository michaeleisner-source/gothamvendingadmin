import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Settings, DollarSign, Wrench, TrendingUp, Grid3x3, Info } from 'lucide-react';
import MachineSetup from './MachineSetup';
import MachineFinance from './MachineFinance';
import MachineMaintenance from './MachineMaintenance';
import MachineRoi from './MachineRoi';

type Machine = {
  id: string;
  name: string;
  location: string | null;
  status: string | null;
};

type Product = {
  id: string;
  name: string;
  sku: string;
};

type Slot = {
  id: string;
  label: string;
  row: number;
  col: number;
  capacity: number | null;
  product_id?: string;
  max_qty?: number;
  restock_threshold?: number;
};

type SlotAssignment = {
  slot_id: string;
  product_id: string;
  max_qty?: number;
  restock_threshold?: number;
};

const fetchMachine = async (id: string): Promise<Machine> => {
  const { data, error } = await supabase
    .from("machines")
    .select("id, name, location, status")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};

const fetchSlots = async (machineId: string): Promise<Slot[]> => {
  const { data, error } = await supabase
    .from("machine_slots")
    .select(`
      id, label, row, col, capacity,
      slot_assignments (
        product_id, max_qty, restock_threshold
      )
    `)
    .eq("machine_id", machineId)
    .order("row")
    .order("col");

  if (error) throw error;

  return (data || []).map(slot => ({
    id: slot.id,
    label: slot.label,
    row: slot.row,
    col: slot.col,
    capacity: slot.capacity,
    product_id: slot.slot_assignments?.[0]?.product_id,
    max_qty: slot.slot_assignments?.[0]?.max_qty,
    restock_threshold: slot.slot_assignments?.[0]?.restock_threshold,
  }));
};

const fetchProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, sku")
    .order("name");

  if (error) throw error;
  return data || [];
};

const PlanogramTab = ({ machineId }: { machineId: string }) => {
  const queryClient = useQueryClient();
  const [selectedSlots, setSelectedSlots] = useState<Record<string, SlotAssignment>>({});
  const [gridDimensions, setGridDimensions] = useState({ rows: 6, cols: 8 });

  const { data: slots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ["slots", machineId],
    queryFn: () => fetchSlots(machineId),
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const generateSlotsMutation = useMutation({
    mutationFn: async ({ rows, cols }: { rows: number; cols: number }) => {
      const { error } = await supabase.rpc("generate_machine_slots", {
        p_machine_id: machineId,
        p_rows: rows,
        p_cols: cols,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slots", machineId] });
      toast.success("Slots generated successfully");
    },
    onError: (error) => {
      toast.error(`Error generating slots: ${error.message}`);
    },
  });

  const saveAssignmentsMutation = useMutation({
    mutationFn: async (assignments: SlotAssignment[]) => {
      const { error } = await supabase.rpc("upsert_slot_assignments", {
        p_machine_id: machineId,
        p_assignments: assignments.map(a => ({
          label: slots.find(s => s.id === a.slot_id)?.label || "",
          product_id: a.product_id,
          max_qty: a.max_qty,
          restock_threshold: a.restock_threshold,
        })),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slots", machineId] });
      toast.success("Slot assignments saved successfully");
      setSelectedSlots({});
    },
    onError: (error) => {
      toast.error(`Error saving assignments: ${error.message}`);
    },
  });

  const handleGenerateSlots = () => {
    generateSlotsMutation.mutate(gridDimensions);
  };

  const handleSaveAssignments = () => {
    const assignments = Object.values(selectedSlots);
    if (assignments.length === 0) {
      toast.error("No assignments to save");
      return;
    }
    saveAssignmentsMutation.mutate(assignments);
  };

  const handleSlotChange = (slotId: string, field: keyof SlotAssignment, value: any) => {
    setSelectedSlots(prev => ({
      ...prev,
      [slotId]: {
        ...prev[slotId],
        slot_id: slotId,
        [field]: value,
      }
    }));
  };

  if (slotsLoading) {
    return <div>Loading slots...</div>;
  }

  const maxRow = Math.max(...slots.map(s => s.row), 0);
  const maxCol = Math.max(...slots.map(s => s.col), 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Slot Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Rows</Label>
              <Input
                type="number"
                min="1"
                max="12"
                value={gridDimensions.rows}
                onChange={(e) => setGridDimensions(prev => ({ ...prev, rows: parseInt(e.target.value) || 1 }))}
              />
            </div>
            <div>
              <Label>Columns</Label>
              <Input
                type="number"
                min="1"
                max="12"
                value={gridDimensions.cols}
                onChange={(e) => setGridDimensions(prev => ({ ...prev, cols: parseInt(e.target.value) || 1 }))}
              />
            </div>
          </div>
          <Button onClick={handleGenerateSlots} disabled={generateSlotsMutation.isPending}>
            {generateSlotsMutation.isPending ? "Generating..." : "Generate Slots"}
          </Button>
        </CardContent>
      </Card>

      {slots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Planogram ({maxRow} x {maxCol})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div 
                className="grid gap-2 w-fit mx-auto"
                style={{
                  gridTemplateColumns: `repeat(${maxCol}, minmax(0, 1fr))`,
                }}
              >
                {Array.from({ length: maxRow }, (_, rowIndex) => {
                  const row = rowIndex + 1;
                  return Array.from({ length: maxCol }, (_, colIndex) => {
                    const col = colIndex + 1;
                    const slot = slots.find(s => s.row === row && s.col === col);
                    
                    if (!slot) {
                      return <div key={`${row}-${col}`} className="w-24 h-20 border border-dashed border-muted-foreground/30 rounded" />;
                    }

                    const assignedProduct = products.find(p => p.id === slot.product_id);
                    const assignment = selectedSlots[slot.id] || { slot_id: slot.id, product_id: '', max_qty: undefined, restock_threshold: undefined };

                    return (
                      <div key={slot.id} className="w-24 h-20 border rounded p-1 bg-card">
                        <div className="text-xs font-mono text-center mb-1">{slot.label}</div>
                        <Select
                          value={assignment.product_id || slot.product_id || ""}
                          onValueChange={(value) => handleSlotChange(slot.id, 'product_id', value)}
                        >
                          <SelectTrigger className="h-6 text-xs">
                            <SelectValue placeholder="Empty" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Empty</SelectItem>
                            {products.map(product => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  });
                }).flat()}
              </div>

              {Object.keys(selectedSlots).length > 0 && (
                <div className="flex justify-center">
                  <Button onClick={handleSaveAssignments} disabled={saveAssignmentsMutation.isPending}>
                    {saveAssignmentsMutation.isPending ? "Saving..." : "Save Assignments"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const MachineDetail = () => {
  const { id } = useParams<{ id: string }>();
  
  if (!id) {
    return <div>Machine ID not found</div>;
  }

  const { data: machine, isLoading, error } = useQuery({
    queryKey: ["machine", id],
    queryFn: () => fetchMachine(id),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !machine) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-8">
          <p className="text-destructive">Error loading machine details</p>
        </div>
      </div>
    );
  }

  const getStatusVariant = (status: string | null) => {
    switch (status?.toUpperCase()) {
      case "ONLINE":
        return "default";
      case "OFFLINE":
        return "destructive";
      case "MAINTENANCE":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{machine.name}</h1>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-muted-foreground">Location: {machine.location || "Not specified"}</span>
          <Badge variant={getStatusVariant(machine.status)}>
            {machine.status || "Unknown"}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="planogram" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="planogram" className="flex items-center gap-2">
            <Grid3x3 className="w-4 h-4" />
            Planogram
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Info className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="setup" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Setup
          </TabsTrigger>
          <TabsTrigger value="finance" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Finance
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="roi" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            ROI Analysis
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="planogram" className="mt-6">
          <PlanogramTab machineId={id} />
        </TabsContent>
        
        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Machine Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Name</Label>
                <p className="text-sm text-muted-foreground">{machine.name}</p>
              </div>
              <div>
                <Label>Location</Label>
                <p className="text-sm text-muted-foreground">{machine.location || "Not specified"}</p>
              </div>
              <div>
                <Label>Status</Label>
                <div className="mt-1">
                  <Badge variant={getStatusVariant(machine.status)}>
                    {machine.status || "Unknown"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="setup" className="mt-6">
          <MachineSetup />
        </TabsContent>
        
        <TabsContent value="finance" className="mt-6">
          <MachineFinance />
        </TabsContent>
        
        <TabsContent value="maintenance" className="mt-6">
          <MachineMaintenance />
        </TabsContent>
        
        <TabsContent value="roi" className="mt-6">
          <MachineRoi />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MachineDetail;