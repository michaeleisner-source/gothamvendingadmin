import { useState } from "react";
import { useOptimizedQuery } from "@/hooks/useOptimizedQuery";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { insuranceForMachines, formatCurrency } from "@/lib/insurance-utils";
import { useToast } from "@/hooks/use-toast";
import { Calculator, Download } from "lucide-react";
import { format } from "date-fns";

interface Machine {
  id: string;
  name: string;
  location_id?: string | null;
  location?: string | null;
}

export function InsuranceCostCalculator() {
  const [selectedMachines, setSelectedMachines] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [calculating, setCalculating] = useState(false);
  const [results, setResults] = useState<Record<string, number>>({});
  const { toast } = useToast();

  const { data: machines } = useOptimizedQuery({
    queryKey: ["machines-for-calculator"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("machines")
        .select("id, location_id")
        .order("id");
      
      if (error) throw error;
      
      // Add fallback names and fetch location names
      const machinesWithNames = await Promise.all(
        (data || []).map(async (machine) => {
          let locationName = null;
          
          if (machine.location_id) {
            const { data: location } = await supabase
              .from("locations")
              .select("name")
              .eq("id", machine.location_id)
              .maybeSingle();
            locationName = location?.name || null;
          }
          
          return {
            ...machine,
            name: `Machine ${machine.id}`,
            location: locationName,
          } as Machine;
        })
      );
      
      return machinesWithNames;
    },
  });

  const { data: locations } = useOptimizedQuery({
    queryKey: ["locations-for-calculator"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locations")
        .select("id, name")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const handleCalculate = async () => {
    if (!selectedMachines.length || !startDate || !endDate) {
      toast({
        title: "Missing Information",
        description: "Please select machines and date range for calculation.",
        variant: "destructive",
      });
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast({
        title: "Invalid Date Range",
        description: "Start date must be before end date.",
        variant: "destructive",
      });
      return;
    }

    setCalculating(true);
    try {
      const selectedMachineData = machines?.filter(m => selectedMachines.includes(m.id)) || [];
      const costs = await insuranceForMachines(
        selectedMachineData,
        startDate + "T00:00:00Z",
        endDate + "T23:59:59Z"
      );
      
      setResults(costs);
      toast({ title: "Insurance costs calculated successfully" });
    } catch (error: any) {
      toast({
        title: "Calculation Error",
        description: error.message || "Failed to calculate insurance costs",
        variant: "destructive",
      });
    } finally {
      setCalculating(false);
    }
  };

  const handleSelectAllMachines = () => {
    setSelectedMachines(machines?.map(m => m.id) || []);
  };

  const handleSelectMachinesByLocation = (locationId: string) => {
    const locationMachines = machines?.filter(m => m.location_id === locationId).map(m => m.id) || [];
    setSelectedMachines([...new Set([...selectedMachines, ...locationMachines])]);
  };

  const exportResults = () => {
    if (!Object.keys(results).length) return;

    const csvContent = [
      ["Machine ID", "Machine Name", "Location", "Insurance Cost"],
      ...Object.entries(results).map(([machineId, cost]) => {
        const machine = machines?.find(m => m.id === machineId);
        return [
          machineId,
          machine?.name || "Unknown",
          machine?.location || "—",
          formatCurrency(Math.round(cost * 100))
        ];
      })
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `insurance-costs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const totalCost = Object.values(results).reduce((sum, cost) => sum + cost, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculate Insurance Costs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Select Machines</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectAllMachines}>
                  Select All
                </Button>
                <Select onValueChange={handleSelectMachinesByLocation}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select by location" />
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
            </div>
            
            <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
              {machines?.map((machine) => (
                <label key={machine.id} className="flex items-center space-x-2 py-1">
                  <input
                    type="checkbox"
                    checked={selectedMachines.includes(machine.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMachines([...selectedMachines, machine.id]);
                      } else {
                        setSelectedMachines(selectedMachines.filter(id => id !== machine.id));
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">
                    {machine.name} {machine.location && `(${machine.location})`}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <Button onClick={handleCalculate} disabled={calculating} className="w-full">
            {calculating ? "Calculating..." : "Calculate Insurance Costs"}
          </Button>
        </CardContent>
      </Card>

      {Object.keys(results).length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Calculation Results</CardTitle>
              <div className="flex gap-2">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Cost</p>
                  <p className="text-lg font-bold">{formatCurrency(Math.round(totalCost * 100))}</p>
                </div>
                <Button variant="outline" size="sm" onClick={exportResults}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Machine</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Insurance Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(results).map(([machineId, cost]) => {
                  const machine = machines?.find(m => m.id === machineId);
                  return (
                    <TableRow key={machineId}>
                      <TableCell className="font-medium">{machine?.name || "Unknown"}</TableCell>
                      <TableCell>{machine?.location || "—"}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(Math.round(cost * 100))}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}