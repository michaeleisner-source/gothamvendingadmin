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

type Machine = {
  id: string;
  name: string;
  location: string | null;
  status: string | null;
};

type MachineSlot = {
  id: string;
  label: string;
  row: number;
  col: number;
  capacity?: number | null;
};

type Product = {
  id: string;
  name: string;
  sku: string;
};

type SlotAssignment = {
  slot_id: string;
  product_id: string;
  max_qty?: number | null;
  restock_threshold?: number | null;
};

const fetchMachine = async (id: string): Promise<Machine> => {
  const { data, error } = await supabase
    .from("machines")
    .select("id, name, location, status")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
};

const fetchMachineSlots = async (machineId: string): Promise<MachineSlot[]> => {
  const { data, error } = await supabase
    .from("machine_slots")
    .select("id, label, row, col, capacity")
    .eq("machine_id", machineId)
    .order("row")
    .order("col");

  if (error) throw new Error(error.message);
  return data || [];
};

const fetchProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, sku")
    .order("name");

  if (error) throw new Error(error.message);
  return data || [];
};

const fetchSlotAssignments = async (machineId: string): Promise<SlotAssignment[]> => {
  const { data, error } = await supabase
    .from("slot_assignments")
    .select(`
      slot_id,
      product_id,
      max_qty,
      restock_threshold,
      machine_slots!inner(machine_id)
    `)
    .eq("machine_slots.machine_id", machineId);

  if (error) throw new Error(error.message);
  return data || [];
};

const PlanogramTab = ({ machineId }: { machineId: string }) => {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(6);
  const [assignments, setAssignments] = useState<Record<string, { product_id: string; max_qty: string; restock_threshold: string }>>({});

  const { data: slots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ["machine-slots", machineId],
    queryFn: () => fetchMachineSlots(machineId),
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const { data: existingAssignments = [] } = useQuery({
    queryKey: ["slot-assignments", machineId],
    queryFn: () => fetchSlotAssignments(machineId),
    enabled: slots.length > 0,
  });

  const generateSlotsMutation = useMutation({
    mutationFn: async ({ rows, cols }: { rows: number; cols: number }) => {
      const { data, error } = await supabase.rpc("generate_machine_slots", {
        p_machine_id: machineId,
        p_rows: rows,
        p_cols: cols,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["machine-slots", machineId] });
      toast.success("Machine slots generated successfully!");
    },
    onError: (error: any) => {
      toast.error(`Error generating slots: ${error.message}`);
    },
  });

  const saveAssignmentsMutation = useMutation({
    mutationFn: async (assignmentData: any[]) => {
      const { data, error } = await supabase.rpc("upsert_slot_assignments", {
        p_machine_id: machineId,
        p_assignments: assignmentData,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slot-assignments", machineId] });
      toast.success("Slot assignments saved successfully!");
    },
    onError: (error: any) => {
      toast.error(`Error saving assignments: ${error.message}`);
    },
  });

  const handleGenerateSlots = () => {
    if (rows < 1 || cols < 1) {
      toast.error("Rows and columns must be at least 1");
      return;
    }
    generateSlotsMutation.mutate({ rows, cols });
  };

  const handleAssignmentChange = (slotId: string, field: string, value: string) => {
    setAssignments(prev => ({
      ...prev,
      [slotId]: {
        ...prev[slotId],
        [field]: value,
      }
    }));
  };

  const handleSaveAssignments = () => {
    const assignmentData = Object.entries(assignments)
      .filter(([_, assignment]) => assignment.product_id)
      .map(([slotId, assignment]) => {
        const slot = slots.find(s => s.id === slotId);
        return {
          label: slot?.label,
          product_id: assignment.product_id,
          max_qty: assignment.max_qty || null,
          restock_threshold: assignment.restock_threshold || null,
        };
      });

    if (assignmentData.length === 0) {
      toast.error("No product assignments to save");
      return;
    }

    saveAssignmentsMutation.mutate(assignmentData);
  };

  // Initialize assignments from existing data
  useEffect(() => {
    if (existingAssignments.length > 0) {
      const assignmentMap = existingAssignments.reduce((acc, assignment) => {
        acc[assignment.slot_id] = {
          product_id: assignment.product_id,
          max_qty: assignment.max_qty?.toString() || '',
          restock_threshold: assignment.restock_threshold?.toString() || '',
        };
        return acc;
      }, {} as Record<string, { product_id: string; max_qty: string; restock_threshold: string }>);
      
      setAssignments(assignmentMap);
    }
  }, [existingAssignments]);

  if (slotsLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Generate Machine Layout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            No slots configured for this machine. Set up the grid layout first.
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-xs">
            <div className="space-y-2">
              <Label htmlFor="rows">Rows</Label>
              <Input
                id="rows"
                type="number"
                min="1"
                max="10"
                value={rows}
                onChange={(e) => setRows(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cols">Columns</Label>
              <Input
                id="cols"
                type="number"
                min="1"
                max="10"
                value={cols}
                onChange={(e) => setCols(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
          <Button 
            onClick={handleGenerateSlots}
            disabled={generateSlotsMutation.isPending}
          >
            {generateSlotsMutation.isPending ? "Generating..." : "Generate Slots"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Create grid layout
  const maxRow = Math.max(...slots.map(s => s.row));
  const maxCol = Math.max(...slots.map(s => s.col));
  
  const grid = Array.from({ length: maxRow }, (_, rowIndex) =>
    Array.from({ length: maxCol }, (_, colIndex) => {
      return slots.find(s => s.row === rowIndex + 1 && s.col === colIndex + 1);
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Slot Configuration</h3>
        <Button 
          onClick={handleSaveAssignments}
          disabled={saveAssignmentsMutation.isPending}
        >
          {saveAssignmentsMutation.isPending ? "Saving..." : "Save Assignments"}
        </Button>
      </div>

      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${maxCol}, minmax(200px, 1fr))` }}>
        {grid.map((row, rowIndex) =>
          row.map((slot, colIndex) => (
            <Card key={`${rowIndex}-${colIndex}`} className="p-3">
              {slot ? (
                <div className="space-y-2">
                  <div className="font-medium text-center">{slot.label}</div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs">Product</Label>
                    <Select
                      value={assignments[slot.id]?.product_id || ""}
                      onValueChange={(value) => handleAssignmentChange(slot.id, "product_id", value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-background">
                        <SelectItem value="">No product</SelectItem>
                        {products.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-1">
                    <div>
                      <Label className="text-xs">Max Qty</Label>
                      <Input
                        type="number"
                        min="0"
                        className="h-8 text-xs"
                        value={assignments[slot.id]?.max_qty || ""}
                        onChange={(e) => handleAssignmentChange(slot.id, "max_qty", e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Restock</Label>
                      <Input
                        type="number"
                        min="0"
                        className="h-8 text-xs"
                        value={assignments[slot.id]?.restock_threshold || ""}
                        onChange={(e) => handleAssignmentChange(slot.id, "restock_threshold", e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-20 flex items-center justify-center text-muted-foreground text-xs">
                  Empty
                </div>
              )}
            </Card>
          ))
        )}
      </div>
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
        <TabsList>
          <TabsTrigger value="planogram">Planogram</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
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
      </Tabs>
    </div>
  );
};

export default MachineDetail;