import React, { useEffect, useState } from "react";
import { api, Machine, Location } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Monitor, Plus, Building2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function MachineSetup() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Location form state
  const [newLocation, setNewLocation] = useState({
    name: "",
    address_line1: "",
    city: "",
    state: "",
    postal_code: "",
    traffic_daily_est: "",
    contact_name: "",
    contact_email: "",
    contact_phone: ""
  });

  // Machine form state
  const [newMachine, setNewMachine] = useState({
    name: "",
    location_id: "",
    status: "ONLINE",
    manufacturer: "",
    serial_number: "",
    wifi_type: "local"
  });

  // Machine finance form state
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

  const loadData = async () => {
    setLoading(true);
    try {
      const [locationsData, machinesData] = await Promise.all([
        api.listLocations(),
        api.listMachines()
      ]);
      setLocations(locationsData);
      setMachines(machinesData);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetLocationForm = () => {
    setNewLocation({
      name: "",
      address_line1: "",
      city: "",
      state: "",
      postal_code: "",
      traffic_daily_est: "",
      contact_name: "",
      contact_email: "",
      contact_phone: ""
    });
  };

  const resetMachineForm = () => {
    setNewMachine({
      name: "",
      location_id: "",
      status: "ONLINE",
      manufacturer: "",
      serial_number: "",
      wifi_type: "local"
    });
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
  };

  const createLocation = async () => {
    if (!newLocation.name.trim()) {
      toast.error("Location name is required");
      return;
    }

    try {
      const locationData: any = {
        name: newLocation.name.trim(),
      };

      if (newLocation.address_line1) locationData.address_line1 = newLocation.address_line1.trim();
      if (newLocation.city) locationData.city = newLocation.city.trim();
      if (newLocation.state) locationData.state = newLocation.state.trim();
      if (newLocation.postal_code) locationData.postal_code = newLocation.postal_code.trim();
      if (newLocation.contact_name) locationData.contact_name = newLocation.contact_name.trim();
      if (newLocation.contact_email) locationData.contact_email = newLocation.contact_email.trim();
      if (newLocation.contact_phone) locationData.contact_phone = newLocation.contact_phone.trim();
      if (newLocation.traffic_daily_est) {
        locationData.traffic_daily_est = parseInt(newLocation.traffic_daily_est);
      }

      await api.createLocation(locationData);
      toast.success("Location created successfully!");
      resetLocationForm();
      loadData();
    } catch (error: any) {
      console.error('Error creating location:', error);
      toast.error(`Failed to create location: ${error.message}`);
    }
  };

  const createMachine = async () => {
    if (!newMachine.name.trim()) {
      toast.error("Machine name is required");
      return;
    }

    try {
      const machineData: any = {
        name: newMachine.name.trim(),
        status: newMachine.status,
        manufacturer: newMachine.manufacturer.trim() || null,
        serial_number: newMachine.serial_number.trim() || null,
        wifi_type: newMachine.wifi_type
      };

      if (newMachine.location_id) {
        machineData.location_id = newMachine.location_id;
      }

      const machine = await api.createMachine(machineData);
      
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

        // Create finance record using direct supabase call since api.ts doesn't have this method
        const { error: financeError } = await supabase
          .from('machine_finance')
          .insert([financeData]);

        if (financeError) {
          console.error('Error creating machine finance:', financeError);
          toast.error('Machine created but failed to save financial data');
        }
      }

      toast.success("Machine created successfully!");
      resetMachineForm();
      loadData();
    } catch (error: any) {
      console.error('Error creating machine:', error);
      toast.error(`Failed to create machine: ${error.message}`);
    }
  };

  const getLocationName = (locationId?: string) => {
    if (!locationId) return "No location assigned";
    const location = locations.find(l => l.id === locationId);
    return location?.name || "Unknown location";
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ONLINE':
        return <Badge variant="default" className="bg-green-500">Online</Badge>;
      case 'OFFLINE':
        return <Badge variant="destructive">Offline</Badge>;
      case 'MAINTENANCE':
        return <Badge variant="secondary">Maintenance</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Machine Setup</h1>
          <p className="text-muted-foreground">
            Manage locations and vending machines in one place
          </p>
        </div>
        <Button onClick={loadData} variant="outline" disabled={loading}>
          {loading ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Create Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="locationName">Location Name *</Label>
                <Input
                  id="locationName"
                  placeholder="e.g., Downtown Office Building"
                  value={newLocation.name}
                  onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="Street address"
                  value={newLocation.address_line1}
                  onChange={(e) => setNewLocation({ ...newLocation, address_line1: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="City"
                  value={newLocation.city}
                  onChange={(e) => setNewLocation({ ...newLocation, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  placeholder="State"
                  value={newLocation.state}
                  onChange={(e) => setNewLocation({ ...newLocation, state: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal">Postal Code</Label>
                <Input
                  id="postal"
                  placeholder="ZIP code"
                  value={newLocation.postal_code}
                  onChange={(e) => setNewLocation({ ...newLocation, postal_code: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="traffic">Daily Traffic</Label>
                <Input
                  id="traffic"
                  type="number"
                  placeholder="Estimated daily foot traffic"
                  value={newLocation.traffic_daily_est}
                  onChange={(e) => setNewLocation({ ...newLocation, traffic_daily_est: e.target.value })}
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Name</Label>
                <Input
                  id="contactName"
                  placeholder="Site contact person"
                  value={newLocation.contact_name}
                  onChange={(e) => setNewLocation({ ...newLocation, contact_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="contact@example.com"
                  value={newLocation.contact_email}
                  onChange={(e) => setNewLocation({ ...newLocation, contact_email: e.target.value })}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  placeholder="Phone number"
                  value={newLocation.contact_phone}
                  onChange={(e) => setNewLocation({ ...newLocation, contact_phone: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={createLocation} disabled={!newLocation.name.trim()}>
                <Plus className="w-4 h-4 mr-2" />
                Create Location
              </Button>
              <Button variant="outline" onClick={resetLocationForm}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Create Machine */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Create Machine
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="machineName">Machine Name *</Label>
                  <Input
                    id="machineName"
                    placeholder="e.g., Vending Machine #1"
                    value={newMachine.name}
                    onChange={(e) => setNewMachine({ ...newMachine, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="machineStatus">Status</Label>
                  <Select value={newMachine.status} onValueChange={(value) => setNewMachine({ ...newMachine, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ONLINE">Online</SelectItem>
                      <SelectItem value="OFFLINE">Offline</SelectItem>
                      <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    placeholder="e.g., Coca-Cola, Pepsi"
                    value={newMachine.manufacturer}
                    onChange={(e) => setNewMachine({ ...newMachine, manufacturer: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input
                    id="serialNumber"
                    placeholder="Machine serial number"
                    value={newMachine.serial_number}
                    onChange={(e) => setNewMachine({ ...newMachine, serial_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="machineLocation">Location</Label>
                  <Select value={newMachine.location_id} onValueChange={(value) => setNewMachine({ ...newMachine, location_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a location (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            <span>{location.name}</span>
                            {location.city && location.state && (
                              <span className="text-muted-foreground text-xs">
                                • {location.city}, {location.state}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wifiType">Connectivity</Label>
                  <Select value={newMachine.wifi_type} onValueChange={(value) => setNewMachine({ ...newMachine, wifi_type: value })}>
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

            <Separator />

            {/* Financial Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Financial Information (Optional)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="acquisitionType">Acquisition Type</Label>
                  <Select value={machineFinance.acquisition_type} onValueChange={(value) => setMachineFinance({ ...machineFinance, acquisition_type: value })}>
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
                  <Label htmlFor="purchasePrice">Purchase/Lease Price ($)</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={machineFinance.purchase_price}
                    onChange={(e) => setMachineFinance({ ...machineFinance, purchase_price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthlyPayment">Monthly Payment ($)</Label>
                  <Input
                    id="monthlyPayment"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={machineFinance.monthly_payment}
                    onChange={(e) => setMachineFinance({ ...machineFinance, monthly_payment: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthlySoftware">Monthly Software Cost ($)</Label>
                  <Input
                    id="monthlySoftware"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={machineFinance.monthly_software_cost}
                    onChange={(e) => setMachineFinance({ ...machineFinance, monthly_software_cost: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ccFeeCents">CC Processing Fee (¢ per transaction)</Label>
                  <Input
                    id="ccFeeCents"
                    type="number"
                    placeholder="30"
                    value={machineFinance.cc_processing_fee_cents}
                    onChange={(e) => setMachineFinance({ ...machineFinance, cc_processing_fee_cents: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ccFeePercent">CC Processing Fee (%)</Label>
                  <Input
                    id="ccFeePercent"
                    type="number"
                    step="0.01"
                    placeholder="2.5"
                    value={machineFinance.cc_processing_fee_percent}
                    onChange={(e) => setMachineFinance({ ...machineFinance, cc_processing_fee_percent: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="onetimeCosts">Other One-time Costs ($)</Label>
                  <Input
                    id="onetimeCosts"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={machineFinance.other_onetime_costs}
                    onChange={(e) => setMachineFinance({ ...machineFinance, other_onetime_costs: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="termMonths">Finance Term (months)</Label>
                  <Input
                    id="termMonths"
                    type="number"
                    placeholder="60"
                    value={machineFinance.term_months}
                    onChange={(e) => setMachineFinance({ ...machineFinance, term_months: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apr">APR (%)</Label>
                  <Input
                    id="apr"
                    type="number"
                    step="0.01"
                    placeholder="5.99"
                    value={machineFinance.apr}
                    onChange={(e) => setMachineFinance({ ...machineFinance, apr: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="insuranceMonthly">Insurance Monthly ($)</Label>
                  <Input
                    id="insuranceMonthly"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={machineFinance.insurance_monthly}
                    onChange={(e) => setMachineFinance({ ...machineFinance, insurance_monthly: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telemetryMonthly">Telemetry Monthly ($)</Label>
                  <Input
                    id="telemetryMonthly"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={machineFinance.telemetry_monthly}
                    onChange={(e) => setMachineFinance({ ...machineFinance, telemetry_monthly: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataPlanMonthly">Data Plan Monthly ($)</Label>
                  <Input
                    id="dataPlanMonthly"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={machineFinance.data_plan_monthly}
                    onChange={(e) => setMachineFinance({ ...machineFinance, data_plan_monthly: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={createMachine} disabled={!newMachine.name.trim()}>
                <Plus className="w-4 h-4 mr-2" />
                Create Machine
              </Button>
              <Button variant="outline" onClick={resetMachineForm}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Machines List */}
      <Card>
        <CardHeader>
          <CardTitle>Machines ({machines.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : machines.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No machines found.</p>
              <p className="text-sm mt-2">Create your first machine above to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Machine Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {machines.map((machine) => (
                    <TableRow key={machine.id}>
                      <TableCell className="font-medium">{machine.name}</TableCell>
                      <TableCell>{getLocationName(machine.location_id)}</TableCell>
                      <TableCell>{getStatusBadge(machine.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {machine.created_at ? new Date(machine.created_at).toLocaleDateString() : "-"}
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