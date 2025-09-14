import React, { useEffect, useState } from "react";
import { api, Machine, Location } from "@/lib/api";
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
    status: "ONLINE"
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
      status: "ONLINE"
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
        status: newMachine.status
      };

      if (newMachine.location_id) {
        machineData.location_id = newMachine.location_id;
      }

      await api.createMachine(machineData);
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
          <CardContent className="space-y-4">
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