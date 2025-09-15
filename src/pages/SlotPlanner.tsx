import React, { useEffect, useState } from "react";
import { api, Machine, MachineSlot, Product, SlotAssignment } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Grid3X3, 
  Package, 
  Settings, 
  Plus, 
  RefreshCw, 
  Monitor,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { HelpTooltip, HelpTooltipProvider } from "@/components/ui/HelpTooltip";

export default function SlotPlanner() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachineId, setSelectedMachineId] = useState<string>("");
  const [slots, setSlots] = useState<MachineSlot[]>([]);
  const [assignments, setAssignments] = useState<SlotAssignment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Grid generation state
  const [gridRows, setGridRows] = useState<number>(4);
  const [gridCols, setGridCols] = useState<number>(6);

  // Assignment state
  const [assignmentData, setAssignmentData] = useState<{
    [slotId: string]: {
      product_id: string;
      max_qty: number;
      restock_threshold: number;
    }
  }>({});

  const loadData = async () => {
    try {
      const [machinesData, productsData] = await Promise.all([
        api.listMachines(),
        api.listProducts()
      ]);
      setMachines(machinesData);
      setProducts(productsData);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error(`Failed to load data: ${error.message}`);
    }
  };

  const loadMachineSlots = async () => {
    if (!selectedMachineId) {
      setSlots([]);
      setAssignments([]);
      return;
    }

    try {
      const [slotsData, assignmentsData] = await Promise.all([
        api.listSlots(selectedMachineId),
        api.listSlotAssignments(selectedMachineId)
      ]);
      setSlots(slotsData);
      setAssignments(assignmentsData);

      // Initialize assignment data from existing assignments
      const initData: typeof assignmentData = {};
      assignmentsData.forEach(assignment => {
        initData[assignment.slot_id] = {
          product_id: assignment.product_id,
          max_qty: assignment.max_qty || 0,
          restock_threshold: assignment.restock_threshold || 0
        };
      });
      setAssignmentData(initData);
    } catch (error: any) {
      console.error('Error loading machine slots:', error);
      toast.error(`Failed to load machine slots: ${error.message}`);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadMachineSlots();
  }, [selectedMachineId]);

  const generateSlots = async () => {
    if (!selectedMachineId) {
      toast.error("Please select a machine first");
      return;
    }

    if (gridRows < 1 || gridRows > 10 || gridCols < 1 || gridCols > 20) {
      toast.error("Grid size must be between 1-10 rows and 1-20 cols");
      return;
    }

    setLoading(true);
    try {
      const slotsCreated = await api.generateSlots(selectedMachineId, gridRows, gridCols);
      toast.success(`Generated ${slotsCreated} slots for the machine`);
      loadMachineSlots();
    } catch (error: any) {
      console.error('Error generating slots:', error);
      toast.error(`Failed to generate slots: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateAssignment = (slotId: string, field: string, value: any) => {
    setAssignmentData(prev => ({
      ...prev,
      [slotId]: {
        ...prev[slotId],
        [field]: value
      }
    }));
  };

  const saveAssignments = async () => {
    if (!selectedMachineId) {
      toast.error("Please select a machine first");
      return;
    }

    const assignmentsToSave = Object.entries(assignmentData)
      .filter(([slotId, data]) => data.product_id && data.product_id !== "")
      .map(([slotId, data]) => {
        const slot = slots.find(s => s.id === slotId);
        return {
          label: slot?.label || "",
          product_id: data.product_id,
          max_qty: data.max_qty || 0,
          restock_threshold: data.restock_threshold || 0
        };
      });

    if (assignmentsToSave.length === 0) {
      toast.error("No assignments to save");
      return;
    }

    setLoading(true);
    try {
      await api.upsertSlotAssignments(selectedMachineId, assignmentsToSave);
      toast.success(`Saved ${assignmentsToSave.length} slot assignments`);
      loadMachineSlots();
    } catch (error: any) {
      console.error('Error saving assignments:', error);
      toast.error(`Failed to save assignments: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? `${product.name} (${product.sku})` : "Unknown Product";
  };

  const getAssignmentStatus = (slotId: string) => {
    const assignment = assignments.find(a => a.slot_id === slotId);
    const pendingAssignment = assignmentData[slotId];
    
    if (assignment) {
      return <Badge variant="default" className="bg-green-500">Assigned</Badge>;
    } else if (pendingAssignment?.product_id) {
      return <Badge variant="secondary">Pending Save</Badge>;
    } else {
      return <Badge variant="outline">Empty</Badge>;
    }
  };

  const SlotGrid = () => {
    if (slots.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Grid3X3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No slots configured for this machine.</p>
          <p className="text-sm mt-2">Use the "Generate Slots" tab to create a slot layout.</p>
        </div>
      );
    }

    // Group slots by row for grid display
    const slotsByRow = slots.reduce((acc, slot) => {
      if (!acc[slot.row]) acc[slot.row] = [];
      acc[slot.row].push(slot);
      return acc;
    }, {} as { [row: number]: MachineSlot[] });

    return (
      <div className="space-y-2">
        {Object.keys(slotsByRow)
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map(rowNum => (
            <div key={rowNum} className="flex gap-2 justify-center">
              {slotsByRow[parseInt(rowNum)]
                .sort((a, b) => a.col - b.col)
                .map(slot => {
                  const assignment = assignments.find(a => a.slot_id === slot.id);
                  const product = assignment ? products.find(p => p.id === assignment.product_id) : null;
                  
                  return (
                    <div
                      key={slot.id}
                      className={`w-16 h-16 border-2 rounded-lg flex flex-col items-center justify-center text-xs ${
                        assignment ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'
                      }`}
                    >
                      <div className="font-mono font-bold">{slot.label}</div>
                      {product && (
                        <div className="text-center">
                          <div className="truncate w-14" title={product.sku}>
                            {product.sku}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          ))}
      </div>
    );
  };

  return (
    <HelpTooltipProvider>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-2">
          <Grid3X3 className="w-6 h-6" />
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Slot Planner
            <HelpTooltip content="Configure machine slot layouts by creating grids and assigning products to each slot. Essential for organizing inventory and optimizing product placement." />
          </h1>
        </div>
        <p className="text-muted-foreground">
          Configure machine slot layouts and assign products to each slot
        </p>

      {/* Machine Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Select Machine
            <HelpTooltip content="Choose which vending machine to configure slot layouts for. Each machine can have a unique slot grid arrangement." size="sm" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedMachineId} onValueChange={setSelectedMachineId}>
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Choose a machine to configure..." />
            </SelectTrigger>
            <SelectContent>
              {machines.map((machine) => (
                <SelectItem key={machine.id} value={machine.id}>
                  {machine.name}
                  {machine.location && (
                    <span className="text-muted-foreground ml-2">• {machine.location}</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedMachineId && (
        <Tabs defaultValue="layout" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="layout">Slot Layout</TabsTrigger>
            <TabsTrigger value="generate">Generate Slots</TabsTrigger>
            <TabsTrigger value="assign">Assign Products</TabsTrigger>
          </TabsList>

          <TabsContent value="layout">
            <Card>
              <CardHeader>
                <CardTitle>Machine Layout</CardTitle>
              </CardHeader>
              <CardContent>
                <SlotGrid />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="generate">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Generate Slot Grid
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-yellow-800 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <AlertCircle className="w-4 h-4" />
                  <div className="text-sm">
                    <strong>Warning:</strong> Generating slots will remove any existing slot configuration for this machine.
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="rows">Rows</Label>
                    <Input
                      id="rows"
                      type="number"
                      min="1"
                      max="10"
                      value={gridRows}
                      onChange={(e) => setGridRows(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cols">Columns</Label>
                    <Input
                      id="cols"
                      type="number"
                      min="1"
                      max="20"
                      value={gridCols}
                      onChange={(e) => setGridCols(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  This will create a {gridRows} × {gridCols} grid ({gridRows * gridCols} total slots) 
                  with labels like A1, A2, B1, B2, etc.
                </div>

                <Button onClick={generateSlots} disabled={loading}>
                  {loading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Generate {gridRows * gridCols} Slots
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assign">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Product Assignments
                  </CardTitle>
                  <Button onClick={saveAssignments} disabled={loading || slots.length === 0}>
                    {loading ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    Save Assignments
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {slots.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No slots available for assignment.</p>
                    <p className="text-sm mt-2">Generate slots first using the "Generate Slots" tab.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Slot</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Max Qty</TableHead>
                          <TableHead>Restock Threshold</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {slots
                          .sort((a, b) => a.row - b.row || a.col - b.col)
                          .map((slot) => (
                            <TableRow key={slot.id}>
                              <TableCell className="font-mono font-medium">
                                {slot.label}
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={assignmentData[slot.id]?.product_id || ""}
                                  onValueChange={(value) => updateAssignment(slot.id, 'product_id', value)}
                                >
                                  <SelectTrigger className="w-64">
                                    <SelectValue placeholder="Select product..." />
                                  </SelectTrigger>
                                   <SelectContent>
                                     {products.map((product) => (
                                      <SelectItem key={product.id} value={product.id}>
                                        {product.name} ({product.sku})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  className="w-20"
                                  value={assignmentData[slot.id]?.max_qty || ""}
                                  onChange={(e) => updateAssignment(slot.id, 'max_qty', Number(e.target.value))}
                                  placeholder="0"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  className="w-20"
                                  value={assignmentData[slot.id]?.restock_threshold || ""}
                                  onChange={(e) => updateAssignment(slot.id, 'restock_threshold', Number(e.target.value))}
                                  placeholder="0"
                                />
                              </TableCell>
                              <TableCell>
                                {getAssignmentStatus(slot.id)}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
    </HelpTooltipProvider>
  );
}