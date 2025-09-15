import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Search, Edit, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Location = {
  id: string;
  name: string;
  location_type_id: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  traffic_daily_est: number | null;
  traffic_monthly_est: number | null;
  from_prospect_id: string | null;
  created_at: string;
  location_types?: { name: string } | null;
};

const Locations = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { toast } = useToast();

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("locations")
        .select(`
          *,
          location_types (
            name
          )
        `)
        .order("name", { ascending: true });

      if (error) throw error;
      setLocations(data || []);
      setFilteredLocations(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to load locations: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredLocations(locations);
    } else {
      const filtered = locations.filter((location) =>
        location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (location.city && location.city.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredLocations(filtered);
    }
  }, [searchTerm, locations]);

  const formatTraffic = (daily: number | null, monthly: number | null) => {
    const dailyStr = daily ? daily.toLocaleString() : "-";
    const monthlyStr = monthly ? monthly.toLocaleString() : "-";
    return `${dailyStr} / ${monthlyStr}`;
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
    setShowEditDialog(true);
  };

  const handleSaveLocation = async () => {
    if (!editingLocation) return;

    try {
      const { error } = await supabase
        .from("locations")
        .update({
          name: editingLocation.name,
          contact_name: editingLocation.contact_name,
          contact_email: editingLocation.contact_email,
          contact_phone: editingLocation.contact_phone,
          address_line1: editingLocation.address_line1,
          address_line2: editingLocation.address_line2,
          city: editingLocation.city,
          state: editingLocation.state,
          postal_code: editingLocation.postal_code,
          traffic_daily_est: editingLocation.traffic_daily_est,
          traffic_monthly_est: editingLocation.traffic_monthly_est,
        })
        .eq("id", editingLocation.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Location updated successfully",
      });

      setShowEditDialog(false);
      setEditingLocation(null);
      fetchLocations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to update location: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-bold">Locations</h1>
          
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/locations/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Location
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="flex justify-between">
          {/* Search Input */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search by name or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Locations Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              All Locations
              {searchTerm && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({filteredLocations.length} of {locations.length})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="text-sm text-muted-foreground">Loading locations...</div>
              </div>
            ) : filteredLocations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  {searchTerm ? "No locations found matching your search." : "No locations found."}
                </p>
                {!searchTerm && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Convert prospects to create locations.
                  </p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Location Type</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Traffic (Daily/Monthly)</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLocations.map((location) => (
                      <TableRow key={location.id}>
                        <TableCell>
                          <Link
                            to={`/locations/${location.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {location.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {location.location_types?.name || "-"}
                        </TableCell>
                        <TableCell>
                          {location.city || "-"}
                        </TableCell>
                        <TableCell>
                          {location.state || "-"}
                        </TableCell>
                        <TableCell>
                          {formatTraffic(location.traffic_daily_est, location.traffic_monthly_est)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditLocation(location)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Edit Location Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Location</DialogTitle>
            </DialogHeader>
            {editingLocation && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={editingLocation.name}
                      onChange={(e) =>
                        setEditingLocation({ ...editingLocation, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_name">Contact Name</Label>
                    <Input
                      id="contact_name"
                      value={editingLocation.contact_name || ""}
                      onChange={(e) =>
                        setEditingLocation({ ...editingLocation, contact_name: e.target.value })
                      }
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact_email">Email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={editingLocation.contact_email || ""}
                      onChange={(e) =>
                        setEditingLocation({ ...editingLocation, contact_email: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_phone">Phone</Label>
                    <Input
                      id="contact_phone"
                      value={editingLocation.contact_phone || ""}
                      onChange={(e) =>
                        setEditingLocation({ ...editingLocation, contact_phone: e.target.value })
                      }
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="address_line1">Address Line 1</Label>
                  <Input
                    id="address_line1"
                    value={editingLocation.address_line1 || ""}
                    onChange={(e) =>
                      setEditingLocation({ ...editingLocation, address_line1: e.target.value })
                    }
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={editingLocation.city || ""}
                      onChange={(e) =>
                        setEditingLocation({ ...editingLocation, city: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={editingLocation.state || ""}
                      onChange={(e) =>
                        setEditingLocation({ ...editingLocation, state: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input
                      id="postal_code"
                      value={editingLocation.postal_code || ""}
                      onChange={(e) =>
                        setEditingLocation({ ...editingLocation, postal_code: e.target.value })
                      }
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="traffic_daily">Daily Traffic</Label>
                    <Input
                      id="traffic_daily"
                      type="number"
                      value={editingLocation.traffic_daily_est || ""}
                      onChange={(e) =>
                        setEditingLocation({
                          ...editingLocation,
                          traffic_daily_est: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="traffic_monthly">Monthly Traffic</Label>
                    <Input
                      id="traffic_monthly"
                      type="number"
                      value={editingLocation.traffic_monthly_est || ""}
                      onChange={(e) =>
                        setEditingLocation({
                          ...editingLocation,
                          traffic_monthly_est: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveLocation}>Save Changes</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Locations;