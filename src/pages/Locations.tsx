import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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

type Location = {
  id: string;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: string;
  notes: string | null;
  created_at: string;
};

const statusOptions = ["NEW", "CONTACTED", "FOLLOW-UP", "CLOSED"];

const Locations = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    contact_name: "",
    contact_email: "",
    status: "NEW",
  });
  const { toast } = useToast();

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setLocations(data || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error", 
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from("locations")
        .insert([{
          name: formData.name.trim(),
          contact_name: formData.contact_name.trim() || null,
          contact_email: formData.contact_email.trim() || null,
          status: formData.status,
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Location created successfully",
      });

      // Reset form
      setFormData({
        name: "",
        contact_name: "",
        contact_email: "",
        status: "NEW",
      });

      // Refresh locations
      fetchLocations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to create location: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Locations</h1>
        
        {/* Create New Location Form */}
        <Card>
          <CardHeader>
            <CardTitle>Add New Location</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter location name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contact_name">Contact Name</Label>
                  <Input
                    id="contact_name"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    placeholder="Enter contact name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    placeholder="Enter contact email"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button type="submit" disabled={saving} className="w-full md:w-auto">
                {saving ? "Creating..." : "Create Location"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Locations Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Locations</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="text-sm text-muted-foreground">Loading locations...</div>
              </div>
            ) : locations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No locations found.</p>
                <p className="text-xs text-muted-foreground mt-1">Create your first location using the form above.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact Name</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locations.map((location) => (
                      <TableRow key={location.id}>
                        <TableCell className="font-medium">
                          {location.name}
                        </TableCell>
                        <TableCell>
                          {location.contact_name || "-"}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            location.status === "NEW" 
                              ? "bg-blue-100 text-blue-800"
                              : location.status === "CONTACTED"
                              ? "bg-yellow-100 text-yellow-800" 
                              : location.status === "FOLLOW-UP"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-green-100 text-green-800"
                          }`}>
                            {location.status}
                          </span>
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
    </div>
  );
};

export default Locations;