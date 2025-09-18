import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HelpTooltip, HelpTooltipProvider } from "@/components/ui/HelpTooltip";
import { toast } from "sonner";
import { 
  Pencil, Trash2, Package
} from "lucide-react";

type Machine = {
  id: string;
  name: string;
  location: string | null;
  status: string | null;
};

const fetchMachines = async (): Promise<Machine[]> => {
  const { data, error } = await (supabase as any)
    .from("machines")
    .select("id, name, location, status")
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

const insertMachine = async (machine: { name: string; location: string; status: string; manufacturer: string; serial_number: string; wifi_type: string }) => {
  const { data, error } = await (supabase as any)
    .from("machines")
    .insert({
      name: machine.name,
      location: machine.location || null,
      status: machine.status || "ONLINE",
      manufacturer: machine.manufacturer || null,
      serial_number: machine.serial_number || null,
      wifi_type: machine.wifi_type || "local"
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

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

export const MachinesList = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    status: "",
    manufacturer: "",
    serial_number: "",
    wifi_type: "local"
  });

  const [machineFinance, setMachineFinance] = useState({
    acquisition_type: "purchase",
    purchase_price: "",
    monthly_payment: "",
    monthly_software_cost: "",
    cc_processing_fee_cents: "",
    cc_processing_fee_percent: "",
    other_onetime_costs: "",
    term_months: "",
    apr: "",
    insurance_monthly: "",
    telemetry_monthly: "",
    data_plan_monthly: ""
  });

  const {
    data: machines,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["machines"],
    queryFn: fetchMachines,
  });

  const addMachineMutation = useMutation({
    mutationFn: insertMachine,
    onSuccess: async (machine) => {
      queryClient.invalidateQueries({ queryKey: ["machines"] });
      
      // Create machine finance record if financial data is provided
      const hasFinanceData = machineFinance.purchase_price || 
                            machineFinance.monthly_payment || 
                            machineFinance.monthly_software_cost ||
                            machineFinance.cc_processing_fee_cents ||
                            machineFinance.cc_processing_fee_percent ||
                            machineFinance.other_onetime_costs;

      if (hasFinanceData && machine.id) {
        const financeData: any = {
          machine_id: machine.id,
          acquisition_type: machineFinance.acquisition_type
        };

        // Add numeric fields only if they have values
        if (machineFinance.purchase_price) financeData.purchase_price = parseFloat(machineFinance.purchase_price);
        if (machineFinance.monthly_payment) financeData.monthly_payment = parseFloat(machineFinance.monthly_payment);
        if (machineFinance.monthly_software_cost) financeData.monthly_software_cost = parseFloat(machineFinance.monthly_software_cost);
        if (machineFinance.cc_processing_fee_cents) financeData.cc_processing_fee_cents = parseInt(machineFinance.cc_processing_fee_cents);
        if (machineFinance.cc_processing_fee_percent) financeData.cc_processing_fee_percent = parseFloat(machineFinance.cc_processing_fee_percent);
        if (machineFinance.other_onetime_costs) financeData.other_onetime_costs = parseFloat(machineFinance.other_onetime_costs);
        if (machineFinance.term_months) financeData.term_months = parseInt(machineFinance.term_months);
        if (machineFinance.apr) financeData.apr = parseFloat(machineFinance.apr);
        if (machineFinance.insurance_monthly) financeData.insurance_monthly = parseFloat(machineFinance.insurance_monthly);
        if (machineFinance.telemetry_monthly) financeData.telemetry_monthly = parseFloat(machineFinance.telemetry_monthly);
        if (machineFinance.data_plan_monthly) financeData.data_plan_monthly = parseFloat(machineFinance.data_plan_monthly);

        const { error: financeError } = await supabase
          .from('machine_finance')
          .insert([financeData]);

        if (financeError) {
          console.error('Error creating machine finance:', financeError);
          toast.error('Machine created but failed to save financial data');
        }
      }
      
      setFormData({ name: "", location: "", status: "", manufacturer: "", serial_number: "", wifi_type: "local" });
      setMachineFinance({
        acquisition_type: "purchase",
        purchase_price: "",
        monthly_payment: "",
        monthly_software_cost: "",
        cc_processing_fee_cents: "",
        cc_processing_fee_percent: "",
        other_onetime_costs: "",
        term_months: "",
        apr: "",
        insurance_monthly: "",
        telemetry_monthly: "",
        data_plan_monthly: ""
      });
      toast.success("Machine added successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Error adding machine: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Machine name is required");
      return;
    }

    addMachineMutation.mutate({
      name: formData.name.trim(),
      location: formData.location.trim(),
      status: formData.status || "ONLINE",
      manufacturer: formData.manufacturer.trim(),
      serial_number: formData.serial_number.trim(),
      wifi_type: formData.wifi_type || "local"
    });
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateFinanceData = (field: string, value: string) => {
    setMachineFinance(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading machines...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-destructive">
          Error loading machines: {error.message}
        </div>
      </div>
    );
  }

  if (!machines || machines.length === 0) {
    return (
      <HelpTooltipProvider>
        <div className="container mx-auto py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Machines</h1>
            <p className="text-muted-foreground">
              Manage and monitor your machine inventory
            </p>
          </div>
          
          <div className="mb-6 rounded-md border p-6">
            <h2 className="text-xl font-semibold mb-4">Add New Machine</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      Name *
                      <HelpTooltip content="A unique name to identify this machine (e.g., 'Lobby Snack Machine', 'Break Room Drinks')" />
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => updateFormData("name", e.target.value)}
                      placeholder="Enter machine name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="location" className="flex items-center gap-2">
                      Location
                      <HelpTooltip content="Physical location or building where this machine is installed" />
                    </Label>
                    <Input
                      id="location"
                      type="text"
                      value={formData.location}
                      onChange={(e) => updateFormData("location", e.target.value)}
                      placeholder="Enter location"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status" className="flex items-center gap-2">
                      Status
                      <HelpTooltip content="Current operational status of the machine" />
                    </Label>
                    <Select value={formData.status} onValueChange={(value) => updateFormData("status", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ONLINE">ONLINE</SelectItem>
                        <SelectItem value="OFFLINE">OFFLINE</SelectItem>
                        <SelectItem value="SERVICE">SERVICE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="manufacturer" className="flex items-center gap-2">
                      Manufacturer
                      <HelpTooltip content="Company that manufactured this vending machine (e.g., Coca-Cola, Pepsi, Crane)" />
                    </Label>
                    <Input
                      id="manufacturer"
                      type="text"
                      value={formData.manufacturer}
                      onChange={(e) => updateFormData("manufacturer", e.target.value)}
                      placeholder="e.g., Coca-Cola, Pepsi"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="serial_number" className="flex items-center gap-2">
                      Serial Number
                      <HelpTooltip content="Unique serial number found on the machine for identification and warranty purposes" />
                    </Label>
                    <Input
                      id="serial_number"
                      type="text"
                      value={formData.serial_number}
                      onChange={(e) => updateFormData("serial_number", e.target.value)}
                      placeholder="Machine serial number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wifi_type" className="flex items-center gap-2">
                      Connectivity
                      <HelpTooltip content="How the machine connects to the internet for telemetry and payments" />
                    </Label>
                    <Select value={formData.wifi_type} onValueChange={(value) => updateFormData("wifi_type", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="local">Local WiFi</SelectItem>
                        <SelectItem value="cellular">Cellular Data</SelectItem>
                        <SelectItem value="wifi_card">WiFi Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Financial Information (Optional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="acquisition_type" className="flex items-center gap-2">
                      Acquisition Type
                      <HelpTooltip content="How you acquired this machine - affects depreciation calculations and ROI reporting" />
                    </Label>
                    <Select value={machineFinance.acquisition_type} onValueChange={(value) => updateFinanceData("acquisition_type", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="purchase">Purchase</SelectItem>
                        <SelectItem value="lease">Lease</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purchase_price" className="flex items-center gap-2">
                      Purchase/Lease Price ($)
                      <HelpTooltip content="Total cost of the machine or lease price - used for ROI and depreciation calculations" />
                    </Label>
                    <Input
                      id="purchase_price"
                      type="number"
                      step="0.01"
                      value={machineFinance.purchase_price}
                      onChange={(e) => updateFinanceData("purchase_price", e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="monthly_payment" className="flex items-center gap-2">
                      Monthly Payment ($)
                      <HelpTooltip content="Monthly loan/lease payment for financed machines - tracked for expense reporting" />
                    </Label>
                    <Input
                      id="monthly_payment"
                      type="number"
                      step="0.01"
                      value={machineFinance.monthly_payment}
                      onChange={(e) => updateFinanceData("monthly_payment", e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="monthly_software_cost" className="flex items-center gap-2">
                      Monthly Software Cost ($)
                      <HelpTooltip content="Monthly cost for vending management software, telemetry services, or remote monitoring" />
                    </Label>
                    <Input
                      id="monthly_software_cost"
                      type="number"
                      step="0.01"
                      value={machineFinance.monthly_software_cost}
                      onChange={(e) => updateFinanceData("monthly_software_cost", e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cc_processing_fee_cents" className="flex items-center gap-2">
                      CC Processing Fee (¢ per transaction)
                      <HelpTooltip content="Fixed fee charged per credit card transaction (e.g., 30 cents per swipe)" />
                    </Label>
                    <Input
                      id="cc_processing_fee_cents"
                      type="number"
                      value={machineFinance.cc_processing_fee_cents}
                      onChange={(e) => updateFinanceData("cc_processing_fee_cents", e.target.value)}
                      placeholder="30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cc_processing_fee_percent" className="flex items-center gap-2">
                      CC Processing Fee (%)
                      <HelpTooltip content="Percentage fee charged on each credit card transaction (e.g., 2.5% of transaction amount)" />
                    </Label>
                    <Input
                      id="cc_processing_fee_percent"
                      type="number"
                      step="0.01"
                      value={machineFinance.cc_processing_fee_percent}
                      onChange={(e) => updateFinanceData("cc_processing_fee_percent", e.target.value)}
                      placeholder="2.5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="other_onetime_costs" className="flex items-center gap-2">
                      Other One-time Costs ($)
                      <HelpTooltip content="Installation, setup, initial stocking, or other one-time costs associated with this machine" />
                    </Label>
                    <Input
                      id="other_onetime_costs"
                      type="number"
                      step="0.01"
                      value={machineFinance.other_onetime_costs}
                      onChange={(e) => updateFinanceData("other_onetime_costs", e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="term_months" className="flex items-center gap-2">
                      Finance Term (months)
                      <HelpTooltip content="Length of financing agreement in months (e.g., 60 months for a 5-year loan)" />
                    </Label>
                    <Input
                      id="term_months"
                      type="number"
                      value={machineFinance.term_months}
                      onChange={(e) => updateFinanceData("term_months", e.target.value)}
                      placeholder="60"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="apr" className="flex items-center gap-2">
                      APR (%)
                      <HelpTooltip content="Annual Percentage Rate for financed machines - used for interest calculations" />
                    </Label>
                    <Input
                      id="apr"
                      type="number"
                      step="0.01"
                      value={machineFinance.apr}
                      onChange={(e) => updateFinanceData("apr", e.target.value)}
                      placeholder="5.99"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="insurance_monthly" className="flex items-center gap-2">
                      Insurance Monthly ($)
                      <HelpTooltip content="Monthly insurance premium for theft, damage, or liability coverage for this machine" />
                    </Label>
                    <Input
                      id="insurance_monthly"
                      type="number"
                      step="0.01"
                      value={machineFinance.insurance_monthly}
                      onChange={(e) => updateFinanceData("insurance_monthly", e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telemetry_monthly" className="flex items-center gap-2">
                      Telemetry Monthly ($)
                      <HelpTooltip content="Monthly cost for remote monitoring, sales tracking, and diagnostic services" />
                    </Label>
                    <Input
                      id="telemetry_monthly"
                      type="number"
                      step="0.01"
                      value={machineFinance.telemetry_monthly}
                      onChange={(e) => updateFinanceData("telemetry_monthly", e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="data_plan_monthly" className="flex items-center gap-2">
                      Data Plan Monthly ($)
                      <HelpTooltip content="Monthly cellular data plan cost for machines using cellular connectivity" />
                    </Label>
                    <Input
                      id="data_plan_monthly"
                      type="number"
                      step="0.01"
                      value={machineFinance.data_plan_monthly}
                      onChange={(e) => updateFinanceData("data_plan_monthly", e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button type="submit" disabled={addMachineMutation.isPending}>
                  {addMachineMutation.isPending ? "Adding..." : "Add Machine"}
                </Button>
              </div>
            </form>
          </div>

          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">No machines found</div>
          </div>
        </div>
      </HelpTooltipProvider>
    );
  }

  return (
    <HelpTooltipProvider>
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Machines</h1>
          <p className="text-muted-foreground">
            Manage and monitor your machine inventory
          </p>
        </div>
        
        <div className="mb-6 rounded-md border p-6">
          <h2 className="text-xl font-semibold mb-4">Add New Machine</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    Name *
                    <HelpTooltip content="A unique name to identify this machine (e.g., 'Lobby Snack Machine', 'Break Room Drinks')" />
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateFormData("name", e.target.value)}
                    placeholder="Enter machine name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-2">
                    Location
                    <HelpTooltip content="Physical location or building where this machine is installed" />
                  </Label>
                  <Input
                    id="location"
                    type="text"
                    value={formData.location}
                    onChange={(e) => updateFormData("location", e.target.value)}
                    placeholder="Enter location"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status" className="flex items-center gap-2">
                    Status
                    <HelpTooltip content="Current operational status of the machine" />
                  </Label>
                  <Select value={formData.status} onValueChange={(value) => updateFormData("status", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ONLINE">ONLINE</SelectItem>
                      <SelectItem value="OFFLINE">OFFLINE</SelectItem>
                      <SelectItem value="SERVICE">SERVICE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manufacturer" className="flex items-center gap-2">
                    Manufacturer
                    <HelpTooltip content="Company that manufactured this vending machine (e.g., Coca-Cola, Pepsi, Crane)" />
                  </Label>
                  <Input
                    id="manufacturer"
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => updateFormData("manufacturer", e.target.value)}
                    placeholder="e.g., Coca-Cola, Pepsi"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serial_number" className="flex items-center gap-2">
                    Serial Number
                    <HelpTooltip content="Unique serial number found on the machine for identification and warranty purposes" />
                  </Label>
                  <Input
                    id="serial_number"
                    type="text"
                    value={formData.serial_number}
                    onChange={(e) => updateFormData("serial_number", e.target.value)}
                    placeholder="Machine serial number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wifi_type" className="flex items-center gap-2">
                    Connectivity
                    <HelpTooltip content="How the machine connects to the internet for telemetry and payments" />
                  </Label>
                  <Select value={formData.wifi_type} onValueChange={(value) => updateFormData("wifi_type", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Local WiFi</SelectItem>
                      <SelectItem value="cellular">Cellular Data</SelectItem>
                      <SelectItem value="wifi_card">WiFi Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Financial Information (Optional)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="acquisition_type" className="flex items-center gap-2">
                    Acquisition Type
                    <HelpTooltip content="How you acquired this machine - affects depreciation calculations and ROI reporting" />
                  </Label>
                  <Select value={machineFinance.acquisition_type} onValueChange={(value) => updateFinanceData("acquisition_type", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="purchase">Purchase</SelectItem>
                      <SelectItem value="lease">Lease</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchase_price" className="flex items-center gap-2">
                    Purchase/Lease Price ($)
                    <HelpTooltip content="Total cost of the machine or lease price - used for ROI and depreciation calculations" />
                  </Label>
                  <Input
                    id="purchase_price"
                    type="number"
                    step="0.01"
                    value={machineFinance.purchase_price}
                    onChange={(e) => updateFinanceData("purchase_price", e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthly_payment" className="flex items-center gap-2">
                    Monthly Payment ($)
                    <HelpTooltip content="Monthly loan/lease payment for financed machines - tracked for expense reporting" />
                  </Label>
                  <Input
                    id="monthly_payment"
                    type="number"
                    step="0.01"
                    value={machineFinance.monthly_payment}
                    onChange={(e) => updateFinanceData("monthly_payment", e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthly_software_cost" className="flex items-center gap-2">
                    Monthly Software Cost ($)
                    <HelpTooltip content="Monthly cost for vending management software, telemetry services, or remote monitoring" />
                  </Label>
                  <Input
                    id="monthly_software_cost"
                    type="number"
                    step="0.01"
                    value={machineFinance.monthly_software_cost}
                    onChange={(e) => updateFinanceData("monthly_software_cost", e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cc_processing_fee_cents" className="flex items-center gap-2">
                    CC Processing Fee (¢ per transaction)
                    <HelpTooltip content="Fixed fee charged per credit card transaction (e.g., 30 cents per swipe)" />
                  </Label>
                  <Input
                    id="cc_processing_fee_cents"
                    type="number"
                    value={machineFinance.cc_processing_fee_cents}
                    onChange={(e) => updateFinanceData("cc_processing_fee_cents", e.target.value)}
                    placeholder="30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cc_processing_fee_percent" className="flex items-center gap-2">
                    CC Processing Fee (%)
                    <HelpTooltip content="Percentage fee charged on each credit card transaction (e.g., 2.5% of transaction amount)" />
                  </Label>
                  <Input
                    id="cc_processing_fee_percent"
                    type="number"
                    step="0.01"
                    value={machineFinance.cc_processing_fee_percent}
                    onChange={(e) => updateFinanceData("cc_processing_fee_percent", e.target.value)}
                    placeholder="2.5"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="other_onetime_costs" className="flex items-center gap-2">
                    Other One-time Costs ($)
                    <HelpTooltip content="Installation, setup, initial stocking, or other one-time costs associated with this machine" />
                  </Label>
                  <Input
                    id="other_onetime_costs"
                    type="number"
                    step="0.01"
                    value={machineFinance.other_onetime_costs}
                    onChange={(e) => updateFinanceData("other_onetime_costs", e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="term_months" className="flex items-center gap-2">
                    Finance Term (months)
                    <HelpTooltip content="Length of financing agreement in months (e.g., 60 months for a 5-year loan)" />
                  </Label>
                  <Input
                    id="term_months"
                    type="number"
                    value={machineFinance.term_months}
                    onChange={(e) => updateFinanceData("term_months", e.target.value)}
                    placeholder="60"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apr" className="flex items-center gap-2">
                    APR (%)
                    <HelpTooltip content="Annual Percentage Rate for financed machines - used for interest calculations" />
                  </Label>
                  <Input
                    id="apr"
                    type="number"
                    step="0.01"
                    value={machineFinance.apr}
                    onChange={(e) => updateFinanceData("apr", e.target.value)}
                    placeholder="5.99"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="insurance_monthly" className="flex items-center gap-2">
                    Insurance Monthly ($)
                    <HelpTooltip content="Monthly insurance premium for theft, damage, or liability coverage for this machine" />
                  </Label>
                  <Input
                    id="insurance_monthly"
                    type="number"
                    step="0.01"
                    value={machineFinance.insurance_monthly}
                    onChange={(e) => updateFinanceData("insurance_monthly", e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telemetry_monthly" className="flex items-center gap-2">
                    Telemetry Monthly ($)
                    <HelpTooltip content="Monthly cost for remote monitoring, sales tracking, and diagnostic services" />
                  </Label>
                  <Input
                    id="telemetry_monthly"
                    type="number"
                    step="0.01"
                    value={machineFinance.telemetry_monthly}
                    onChange={(e) => updateFinanceData("telemetry_monthly", e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_plan_monthly" className="flex items-center gap-2">
                    Data Plan Monthly ($)
                    <HelpTooltip content="Monthly cellular data plan cost for machines using cellular connectivity" />
                  </Label>
                  <Input
                    id="data_plan_monthly"
                    type="number"
                    step="0.01"
                    value={machineFinance.data_plan_monthly}
                    onChange={(e) => updateFinanceData("data_plan_monthly", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button type="submit" disabled={addMachineMutation.isPending}>
                {addMachineMutation.isPending ? "Adding..." : "Add Machine"}
              </Button>
            </div>
          </form>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {machines.map((machine) => (
                <TableRow key={machine.id}>
                  <TableCell className="font-medium">
                    <Link 
                      to={`/machines/${machine.id}`}
                      className="text-primary hover:underline"
                    >
                      {machine.name}
                    </Link>
                  </TableCell>
                  <TableCell>{machine.location || "Not specified"}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(machine.status)}>
                      {machine.status || "Unknown"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <Link to={`/machines/${machine.id}/inventory`}>
                          <Package className="w-4 h-4" />
                        </Link>
                      </Button>
                      <EditMachineButton machine={machine} />
                      <DeleteMachineButton machineId={machine.id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </HelpTooltipProvider>
  );
};

// Edit Machine Button Component
function EditMachineButton({ machine }: { machine: Machine }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: machine.name || '',
    location: machine.location || '',
    status: machine.status || '',
  });
  const queryClient = useQueryClient();

  const updateMachine = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('machines')
        .update(data)
        .eq('id', machine.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      setOpen(false);
      toast.success('Machine updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update machine: ${error.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMachine.mutate(formData);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Pencil className="w-4 h-4" />
      </Button>
      
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold mb-4">Edit Machine</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ONLINE">ONLINE</SelectItem>
                    <SelectItem value="OFFLINE">OFFLINE</SelectItem>
                    <SelectItem value="MAINTENANCE">MAINTENANCE</SelectItem>
                    <SelectItem value="SERVICE">SERVICE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMachine.isPending}>
                  {updateMachine.isPending ? 'Updating...' : 'Update Machine'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// Delete Machine Button Component  
function DeleteMachineButton({ machineId }: { machineId: string }) {
  const queryClient = useQueryClient();
  
  const deleteMachine = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('machines')
        .delete()
        .eq('id', machineId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      toast.success('Machine deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete machine: ${error.message}`);
    }
  });

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this machine? This action cannot be undone.')) {
      deleteMachine.mutate();
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={deleteMachine.isPending}
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  );
}